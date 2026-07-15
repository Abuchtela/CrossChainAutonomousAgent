const STORAGE_KEY = 'crosschain_ledger';
const CELO_CHAIN_KEY = 'celo';
let entryIdCounter = 0;

const SEED_ENTRIES = [
  {
    id: 'seed-base-1',
    timestamp: '2024-01-01T08:30:00.000Z',
    chain: 'base',
    type: 'income',
    amount: 28.1,
    description: 'Base vault yield',
  },
  {
    id: 'seed-optimism-1',
    timestamp: '2024-01-02T10:15:00.000Z',
    chain: 'optimism',
    type: 'trade',
    amount: 113.2,
    description: 'Optimism trading profit',
  },
  {
    id: 'seed-stacks-1',
    timestamp: '2024-01-03T12:00:00.000Z',
    chain: 'stacks',
    type: 'income',
    amount: 54,
    description: 'Stacks vault yield',
  },
  {
    id: 'seed-celo-1',
    timestamp: '2024-01-04T09:45:00.000Z',
    chain: 'celo',
    type: 'income',
    amount: 41.75,
    description: 'MiniPay user payout on Celo',
  },
];

function normaliseType(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('expense') || value.includes('cost')) return 'expense';
  if (value.includes('trade')) return 'trade';
  return 'income';
}

function normaliseChain(chain) {
  return String(chain || 'base').trim().toLowerCase();
}

function parseEntryAmount(entry) {
  if (typeof entry.amount === 'number') return entry.amount;
  if (typeof entry.usd === 'number') return entry.usd;

  const parsed = parseFloat(entry.amount || entry.usd || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function generateEntryId(timestamp, index) {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const randomBytes = new Uint8Array(8);
    cryptoApi.getRandomValues(randomBytes);
    const randomSuffix = Array.from(randomBytes, (value) => value.toString(16).padStart(2, '0')).join('');
    return `${Date.parse(timestamp) || Date.now()}-${index}-${randomSuffix}`;
  }

  const perfSuffix =
    typeof globalThis?.performance?.now === 'function'
      ? Math.floor(globalThis.performance.now() * 1000)
      : Date.now();

  return `${Date.parse(timestamp) || Date.now()}-${index}-${perfSuffix}-${entryIdCounter++}`;
}

function normaliseEntry(entry, index = 0) {
  const timestamp = entry.timestamp || entry.date || new Date().toISOString();
  const type = normaliseType(entry.type);
  const amount = parseEntryAmount(entry);

  return {
    id: entry.id || generateEntryId(timestamp, index),
    timestamp: new Date(timestamp).toISOString(),
    chain: normaliseChain(entry.chain),
    type,
    amount: Number.isFinite(amount) ? amount : 0,
    description: entry.description || entry.token || '',
  };
}

export function loadLedger() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalised = parsed.map(normaliseEntry);
        saveLedger(normalised);
        return normalised;
      }
    }
  } catch {
    // ignore parse errors
  }

  saveLedger(SEED_ENTRIES);
  return SEED_ENTRIES;
}

export function saveLedger(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.map(normaliseEntry)));
}

export function getEntries() {
  return loadLedger();
}

export function addLedgerEntry(entry) {
  const entries = loadLedger();
  const nextEntry = normaliseEntry(entry, entries.length);
  const updated = [...entries, nextEntry];
  saveLedger(updated);
  return nextEntry;
}

export function addEntry(entry) {
  return addLedgerEntry({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

export function clearLedger() {
  saveLedger([]);
}

export function getTodayIncome(entries = loadLedger()) {
  const today = new Date().toISOString().slice(0, 10);
  return entries.reduce((sum, entry) => {
    if (!entry.timestamp.startsWith(today)) return sum;
    if (entry.type === 'expense') return sum - entry.amount;
    return sum + entry.amount;
  }, 0);
}

export function getTotalPnL(entries = loadLedger()) {
  return entries.reduce((sum, entry) => {
    if (entry.type === 'expense') return sum - entry.amount;
    return sum + entry.amount;
  }, 0);
}

export function getCeloImpactMetrics(entries = loadLedger()) {
  const issuedEntries = entries
    .filter((entry) => entry.chain === CELO_CHAIN_KEY && entry.type !== 'expense')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const totalIssued = issuedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const lastIssuedAt = issuedEntries.at(-1)?.timestamp || null;

  return {
    totalIssued: Number(totalIssued.toFixed(4)),
    issuanceCount: issuedEntries.length,
    lastIssuedAt,
  };
}

export function totalIncome(entries = loadLedger()) {
  return entries.reduce((sum, entry) => {
    if (entry.type === 'expense') return sum;
    return sum + entry.amount;
  }, 0);
}

export function dailyTotals(entries = loadLedger()) {
  const totals = new Map();

  entries.forEach((entry) => {
    const date = entry.timestamp.slice(0, 10);
    const current = totals.get(date) || 0;
    const next = entry.type === 'expense' ? current - entry.amount : current + entry.amount;
    totals.set(date, next);
  });

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, income]) => ({ date, income: Number(income.toFixed(2)) }));
}

export function chainTotals(entries = loadLedger()) {
  const totals = new Map();

  entries.forEach((entry) => {
    const current = totals.get(entry.chain) || 0;
    const next = entry.type === 'expense' ? current - entry.amount : current + entry.amount;
    totals.set(entry.chain, next);
  });

  return Array.from(totals.entries()).map(([chain, total]) => ({
    chain,
    total: Number(total.toFixed(2)),
  }));
}

export function getChartData(entries = loadLedger()) {
  let runningPnL = 0;

  return entries
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((entry) => {
      const income = entry.type === 'expense' ? 0 : entry.amount;
      const expense = entry.type === 'expense' ? entry.amount : 0;
      runningPnL += entry.type === 'expense' ? -entry.amount : entry.amount;

      return {
        date: new Date(entry.timestamp).toLocaleDateString(),
        income,
        expense,
        pnl: Number(runningPnL.toFixed(4)),
      };
    });
}

export function exportToCSV(entries = loadLedger()) {
  if (entries.length === 0) return '';

  const header = ['timestamp', 'chain', 'type', 'amount', 'description'];
  const rows = entries.map((entry) =>
    [
      entry.timestamp,
      entry.chain,
      entry.type,
      entry.amount,
      `"${String(entry.description || '').replace(/"/g, '""')}"`,
    ].join(',')
  );

  return [header.join(','), ...rows].join('\n');
}
