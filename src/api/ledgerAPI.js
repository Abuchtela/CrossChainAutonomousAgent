const LEDGER_KEY = 'crosschain_ledger';

export const getEntries = () => {
  try {
    const data = localStorage.getItem(LEDGER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addEntry = (entry) => {
  const entries = getEntries();
  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  entries.push(newEntry);
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
  return newEntry;
};

export const getTodayIncome = () => {
  const today = new Date().toISOString().split('T')[0];
  return getEntries()
    .filter((e) => e.timestamp.startsWith(today) && e.type === 'income')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
};

export const getTotalPnL = () => {
  return getEntries().reduce((sum, e) => {
    if (e.type === 'income') return sum + (parseFloat(e.amount) || 0);
    if (e.type === 'expense') return sum - (parseFloat(e.amount) || 0);
    return sum;
  }, 0);
};

export const getChartData = () => {
  const entries = getEntries();
  const byDate = {};
  entries.forEach((e) => {
    const date = e.timestamp.split('T')[0];
    if (!byDate[date]) byDate[date] = { date, income: 0, expense: 0, pnl: 0 };
    if (e.type === 'income') byDate[date].income += parseFloat(e.amount) || 0;
    if (e.type === 'expense') byDate[date].expense += parseFloat(e.amount) || 0;
    byDate[date].pnl = byDate[date].income - byDate[date].expense;
  });
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
};

export const exportToCSV = () => {
  const entries = getEntries();
  if (!entries.length) return '';
  const headers = ['id', 'timestamp', 'type', 'chain', 'amount', 'description'];
  const rows = entries.map((e) =>
    headers.map((h) => JSON.stringify(e[h] ?? '')).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

export const clearLedger = () => {
  localStorage.removeItem(LEDGER_KEY);
};
