const CELO_MAINNET_PARAMS = {
  chainId: '0xa4ec',
  chainName: 'Celo Mainnet',
  nativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: [process.env.REACT_APP_CELO_RPC_URL || 'https://forno.celo.org'],
  blockExplorerUrls: ['https://celoscan.io'],
};

const UNRECOGNIZED_CHAIN_ERROR = 4902;
const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const CHAINS = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org',
    nativeToken: 'ETH',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.REACT_APP_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    nativeToken: 'ETH',
  },
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: process.env.REACT_APP_CELO_RPC_URL || 'https://forno.celo.org',
    nativeToken: 'CELO',
  },
  stacks: {
    name: 'Stacks',
    apiUrl:
      process.env.REACT_APP_STACKS_NETWORK === 'testnet'
        ? 'https://stacks-node-api.testnet.stacks.co'
        : 'https://stacks-node-api.mainnet.stacks.co',
    nativeToken: 'STX',
  },
};

function parseHexBalance(value, decimals) {
  if (!value) return 0;

  const balance = BigInt(value);
  const divisor = 10n ** BigInt(decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  const fractionString = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
    .slice(0, 6);

  return Number(fractionString ? `${whole.toString()}.${fractionString}` : whole.toString());
}

async function postRpc(chain, method, params = []) {
  const response = await fetch(chain.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Unknown RPC error');
  }

  return data.result;
}

function isEvmAddress(value) {
  return EVM_ADDRESS_PATTERN.test(String(value || '').trim());
}

function getProviderErrorCode(error) {
  return error?.code ?? error?.data?.originalError?.code ?? null;
}

async function fetchEVMBalance(chain, address) {
  const result = await postRpc(chain, 'eth_getBalance', [address, 'latest']);
  return parseHexBalance(result, 18);
}

async function fetchStacksBalance(address) {
  const url = `${CHAINS.stacks.apiUrl}/v2/accounts/${address}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Stacks API error: ${response.status}`);
  const data = await response.json();
  return Number(data.balance) / 1e6;
}

export async function fetchBalance(chainKey, address) {
  if (!address) return null;

  const chain = CHAINS[chainKey];
  if (!chain) {
    throw new Error(`Unknown chain: ${chainKey}`);
  }

  if (chainKey === 'stacks') {
    return fetchStacksBalance(address);
  }

  return fetchEVMBalance(chain, address);
}

export async function getAllBalances(evmAddress, stacksAddress) {
  const entries = await Promise.all(
    Object.keys(CHAINS).map(async (chainKey) => {
      const address = chainKey === 'stacks' ? stacksAddress : evmAddress;
      if (!address) {
        return [chainKey, null];
      }

      try {
        const balance = await fetchBalance(chainKey, address);
        return [
          chainKey,
          {
            balance,
            symbol: CHAINS[chainKey].nativeToken,
            address,
          },
        ];
      } catch (error) {
        return [
          chainKey,
          {
            error: error.message,
            symbol: CHAINS[chainKey].nativeToken,
            address,
          },
        ];
      }
    })
  );

  return Object.fromEntries(entries);
}

export async function fetchGasPrice(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain || chainKey === 'stacks') return null;

  const result = await postRpc(chain, 'eth_gasPrice');
  return parseHexBalance(result, 9);
}

export async function fetchBlockNumber(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain || chainKey === 'stacks') return null;

  const result = await postRpc(chain, 'eth_blockNumber');
  return Number(BigInt(result));
}

export async function fetchContractDeploymentStatus(chainKey, contractAddress) {
  const chain = CHAINS[chainKey];
  if (!chain || chainKey === 'stacks') {
    throw new Error(`Contract deployment status is unavailable for ${chainKey}.`);
  }

  const address = String(contractAddress || '').trim();
  if (!address) {
    return {
      configured: false,
      deployed: false,
      address: '',
    };
  }

  if (!isEvmAddress(address)) {
    return {
      configured: true,
      deployed: false,
      address,
      error: 'Configured contract address is invalid.',
    };
  }

  const code = await postRpc(chain, 'eth_getCode', [address, 'latest']);
  return {
    configured: true,
    deployed: code !== '0x',
    address,
  };
}

export async function fetchStacksNodeInfo() {
  const url = `${CHAINS.stacks.apiUrl}/v2/info`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Stacks API error: ${response.status}`);
  return response.json();
}

export function getInjectedProvider({ preferMiniPay = false } = {}) {
  if (typeof window === 'undefined') return null;

  const providers = window.ethereum?.providers ?? [window.ethereum].filter(Boolean);
  if (providers.length === 0) {
    return null;
  }

  if (preferMiniPay) {
    return providers.find((provider) => provider?.isMiniPay) || providers[0];
  }

  return providers[0];
}

export async function switchToCeloMainnet(provider = getInjectedProvider({ preferMiniPay: true })) {
  if (!provider) {
    throw new Error('No compatible wallet was found.');
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CELO_MAINNET_PARAMS.chainId }],
    });
  } catch (error) {
    const errorCode = getProviderErrorCode(error);
    if (errorCode === UNRECOGNIZED_CHAIN_ERROR) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [CELO_MAINNET_PARAMS],
      });
      return;
    }

    throw error;
  }
}

export async function connectMiniPay() {
  const provider = getInjectedProvider({ preferMiniPay: true });
  if (!provider) {
    throw new Error('MiniPay or another injected wallet is not available.');
  }

  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  await switchToCeloMainnet(provider);

  return {
    account: accounts?.[0] || '',
    provider,
  };
}

export { CELO_MAINNET_PARAMS, CHAINS };
