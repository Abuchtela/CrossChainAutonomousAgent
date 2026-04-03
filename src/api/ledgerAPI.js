// Ledger API – reads and manages the hidden income ledger (ledger.csv)
// In the browser environment, the ledger is stored in localStorage
// and seeded from the bundled CSV data on first load.

const STORAGE_KEY = 'crosschain_ledger';

// Seed data mirroring ledger.csv
const SEED_ENTRIES = [
  { date: '2024-01-01', chain: 'Base', type: 'Vault Yield', amount: 12.4, token: 'ETH', usd: 28.1 },
  { date: '2024-01-02', chain: 'Optimism', type: 'Trading Profit', amount: 0.05, token: 'ETH', usd: 113.2 },
  { date: '2024-01-03', chain: 'Stacks', type: 'Vault Yield', amount: 45.0, token: 'STX', usd: 54.0 },
  { date: '2024-01-04', chain: 'Base', type: 'Trading Profit', amount: 0.02, token: 'ETH', usd: 45.3 },
  { date: '2024-01-05', chain: 'Optimism', type: 'Vault Yield', amount: 0.03, token: 'ETH', usd: 67.9 },
  { date: '2024-01-06', chain: 'Stacks', type: 'Trading Profit', amount: 30.0, token: 'STX', usd: 36.0 },
  { date: '2024-01-07', chain: 'Base', type: 'Vault Yield', amount: 15.1, token: 'ETH', usd: 34.2 },
];

// Load all ledger entries from localStorage, seeding if empty
export function loadLedger() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES));
  return SEED_ENTRIES;
}

// Save entries to localStorage
export function saveLedger(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Add a new ledger entry
export function addLedgerEntry(entry) {
  const entries = loadLedger();
  const updated = [...entries, entry];
  saveLedger(updated);
  return updated;
}

// Compute total USD income
export function totalIncome(entries) {
  return entries.reduce((sum, e) => sum + (e.usd || 0), 0);
}

// Compute daily totals for charting
export function dailyTotals(entries) {
  const map = {};
  entries.forEach((e) => {
    map[e.date] = (map[e.date] || 0) + (e.usd || 0);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, income]) => ({ date, income: parseFloat(income.toFixed(2)) }));
}

// Compute per-chain totals for charting
export function chainTotals(entries) {
  const map = {};
  entries.forEach((e) => {
    map[e.chain] = (map[e.chain] || 0) + (e.usd || 0);
  });
  return Object.entries(map).map(([chain, total]) => ({
    chain,
    total: parseFloat(total.toFixed(2)),
  }));
}
