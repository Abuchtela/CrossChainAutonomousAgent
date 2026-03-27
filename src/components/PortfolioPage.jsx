import React, { useState, useEffect } from 'react';
import { getEntries, getTodayIncome, getTotalPnL, exportToCSV, clearLedger } from '../api/ledgerAPI';

const TYPE_COLORS = {
  income: '#48bb78',
  expense: '#fc8181',
  trade: '#63b3ed',
};

const PortfolioPage = ({ onBack }) => {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState({ type: 'all', chain: 'all' });
  const [todayIncome, setTodayIncome] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => {
    setEntries(getEntries());
    setTodayIncome(getTodayIncome());
    setTotalPnL(getTotalPnL());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = entries.filter((e) => {
    if (filter.type !== 'all' && e.type !== filter.type) return false;
    if (filter.chain !== 'all' && e.chain !== filter.chain) return false;
    return true;
  });

  const handleExport = () => {
    const csv = exportToCSV();
    if (!csv) {
      alert('No ledger entries to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirmClear) {
      clearLedger();
      refresh();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <button className="btn btn-secondary btn-small" onClick={onBack}>
          ← Back
        </button>
        <h2>Portfolio &amp; Ledger</h2>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Today's Income</span>
          <span className={`stat-value ${todayIncome >= 0 ? 'positive' : 'negative'}`}>
            ${todayIncome.toFixed(4)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total P&amp;L</span>
          <span className={`stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
            ${totalPnL.toFixed(4)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Entries</span>
          <span className="stat-value">{entries.length}</span>
        </div>
      </div>

      <div className="card">
        <div className="filter-row">
          <div className="form-group">
            <label>Type</label>
            <select
              className="input"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="trade">Trade</option>
            </select>
          </div>
          <div className="form-group">
            <label>Chain</label>
            <select
              className="input"
              value={filter.chain}
              onChange={(e) => setFilter({ ...filter, chain: e.target.value })}
            >
              <option value="all">All Chains</option>
              <option value="base">Base</option>
              <option value="optimism">Optimism</option>
              <option value="stacks">Stacks</option>
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary btn-small" onClick={handleExport}>
              ⬇ Export CSV
            </button>
            <button
              className={`btn btn-small ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleClear}
            >
              {confirmClear ? 'Confirm Clear?' : '🗑 Clear'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="muted-text" style={{ padding: '1rem 0' }}>
            No entries found. Log activity from the Dashboard tab to get started.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Chain</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((entry) => (
                  <tr key={entry.id}>
                    <td className="td-date">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: TYPE_COLORS[entry.type] || '#718096' }}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="td-chain">{entry.chain}</td>
                    <td
                      className={
                        entry.type === 'expense' ? 'td-amount negative' : 'td-amount positive'
                      }
                    >
                      {entry.type === 'expense' ? '-' : '+'}$
                      {parseFloat(entry.amount || 0).toFixed(4)}
                    </td>
                    <td className="td-desc">{entry.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
