// Multi-chain API connector for Base, Optimism, and Stacks

const CHAINS = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    nativeToken: 'ETH',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    nativeToken: 'ETH',
  },
  stacks: {
    name: 'Stacks',
    apiUrl: 'https://stacks-node-api.mainnet.stacks.co',
    nativeToken: 'STX',
  },
};

// Fetch EVM-compatible chain balance via JSON-RPC
async function fetchEVMBalance(chain, address) {
  const body = {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [address, 'latest'],
    id: 1,
  };

  const response = await fetch(chain.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`RPC error: ${response.status}`);
  const data = await response.json();
  const wei = parseInt(data.result, 16);
  return wei / 1e18;
}

// Fetch Stacks STX balance
async function fetchStacksBalance(address) {
  const url = `${CHAINS.stacks.apiUrl}/v2/accounts/${address}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Stacks API error: ${response.status}`);
  const data = await response.json();
  return parseInt(data.balance, 16) / 1e6;
}

// Fetch balance for a given chain key and address
export async function fetchBalance(chainKey, address) {
  if (!address) return null;
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error(`Unknown chain: ${chainKey}`);

  if (chainKey === 'stacks') {
    return fetchStacksBalance(address);
  }
  return fetchEVMBalance(chain, address);
}

// Fetch gas price for EVM chains
export async function fetchGasPrice(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain || chainKey === 'stacks') return null;

  const body = {
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    params: [],
    id: 1,
  };

  const response = await fetch(chain.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`RPC error: ${response.status}`);
  const data = await response.json();
  return parseInt(data.result, 16) / 1e9; // Gwei
}

// Fetch latest block number for EVM chains
export async function fetchBlockNumber(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain || chainKey === 'stacks') return null;

  const body = {
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1,
  };

  const response = await fetch(chain.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`RPC error: ${response.status}`);
  const data = await response.json();
  return parseInt(data.result, 16);
}

// Fetch Stacks node info
export async function fetchStacksNodeInfo() {
  const url = `${CHAINS.stacks.apiUrl}/v2/info`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Stacks API error: ${response.status}`);
  return response.json();
}

export { CHAINS };
