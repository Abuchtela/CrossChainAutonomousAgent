import { ethers } from 'ethers';

const NETWORKS = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org',
    nativeSymbol: 'ETH',
    explorer: 'https://basescan.org',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.REACT_APP_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    nativeSymbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
  },
};

const STACKS_NETWORK = process.env.REACT_APP_STACKS_NETWORK === 'testnet'
  ? 'https://stacks-node-api.testnet.stacks.co'
  : 'https://stacks-node-api.mainnet.stacks.co';

export const getEvmProvider = (chain) => {
  if (!NETWORKS[chain]) throw new Error(`Unsupported EVM chain: ${chain}`);
  return new ethers.JsonRpcProvider(NETWORKS[chain].rpcUrl);
};

export const getEvmBalance = async (address, chain) => {
  const provider = getEvmProvider(chain);
  const balance = await provider.getBalance(address);
  return {
    balance: ethers.formatEther(balance),
    symbol: NETWORKS[chain].nativeSymbol,
    chain,
  };
};

export const getTokenBalance = async (tokenAddress, walletAddress, chain) => {
  const provider = getEvmProvider(chain);
  const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ];
  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const [balance, decimals, symbol] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals(),
    contract.symbol(),
  ]);
  return {
    balance: ethers.formatUnits(balance, decimals),
    symbol,
    chain,
  };
};

export const getStacksBalance = async (address) => {
  const url = `${STACKS_NETWORK}/v2/accounts/${address}?proof=0`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Stacks API error: ${response.status}`);
  const data = await response.json();
  const microStx = parseInt(data.balance, 16);
  return {
    balance: (microStx / 1_000_000).toFixed(6),
    symbol: 'STX',
    chain: 'stacks',
  };
};

export const getGasPrice = async (chain) => {
  const provider = getEvmProvider(chain);
  const feeData = await provider.getFeeData();
  return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
};

export const getAllBalances = async (evmAddress, stacksAddress) => {
  const results = {};
  const promises = [];

  if (evmAddress) {
    promises.push(
      getEvmBalance(evmAddress, 'base')
        .then((data) => { results.base = data; })
        .catch((err) => { results.base = { error: err.message, chain: 'base' }; })
    );
    promises.push(
      getEvmBalance(evmAddress, 'optimism')
        .then((data) => { results.optimism = data; })
        .catch((err) => { results.optimism = { error: err.message, chain: 'optimism' }; })
    );
  }

  if (stacksAddress) {
    promises.push(
      getStacksBalance(stacksAddress)
        .then((data) => { results.stacks = data; })
        .catch((err) => { results.stacks = { error: err.message, chain: 'stacks' }; })
    );
  }

  await Promise.all(promises);
  return results;
};

export { NETWORKS, STACKS_NETWORK };
