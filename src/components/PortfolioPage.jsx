import React, { useState } from 'react';
import { loadLedger, addLedgerEntry, totalIncome, chainTotals } from '../api/ledgerAPI';
import { CHAINS } from '../api/crossChainAPI';

const CHAIN_KEYS = Object.keys(CHAINS);
const TYPES = ['Vault Yield', 'Trading Profit', 'Bridge Fee', 'Other'];

function emptyForm() {
  return { date: new Date().toISOString().slice(0, 10), chain: 'Base', type: 'Vault Yield', amount: '', token: 'ETH', usd: '' };
}

export default function PortfolioPage() {
  const [entries, setEntries] = useState(() => loadLedger());
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const income = totalIncome(entries);
  const byChain = chainTotals(entries);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const entry = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      usd: parseFloat(form.usd) || 0,
    };
    const updated = addLedgerEntry(entry);
    setEntries(updated);
    setForm(emptyForm());
    setShowForm(false);
  }

  return (
    <div>
      <div className="grid">
        <div className="card">
          <h2>Total Portfolio Income</h2>
          <div className="value">${income.toFixed(2)}</div>
          <div className="sub">USD equivalent · all chains</div>
        </div>
        {byChain.map(({ chain, total }) => (
          <div key={chain} className="card">
            <h2>{chain}</h2>
            <div className="value">${total.toFixed(2)}</div>
            <div className="sub">USD income</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p className="section-title" style={{ margin: 0 }}>Hidden Ledger</p>
        <button className="nav-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>Date</div>
              <input type="date" name="date" value={form.date} onChange={handleChange}
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }} />
            </label>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>Chain</div>
              <select name="chain" value={form.chain} onChange={handleChange}
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }}>
                {CHAIN_KEYS.map((k) => <option key={k}>{CHAINS[k].name}</option>)}
              </select>
            </label>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>Type</div>
              <select name="type" value={form.type} onChange={handleChange}
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>Amount</div>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" step="any"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }} />
            </label>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>Token</div>
              <input type="text" name="token" value={form.token} onChange={handleChange} placeholder="ETH"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }} />
            </label>
            <label>
              <div className="sub" style={{ marginBottom: 4 }}>USD Value</div>
              <input type="number" name="usd" value={form.usd} onChange={handleChange} placeholder="0.00" step="any"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', color: '#c9d1d9', width: '100%' }} />
            </label>
            <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
              <button type="submit" className="nav-btn active">Save Entry</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Chain</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Token</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8b949e', padding: 24 }}>No entries yet.</td></tr>
            )}
            {entries.map((e, i) => (
              <tr key={i}>
                <td>{e.date}</td>
                <td><span className={`chain-badge chain-${e.chain.toLowerCase()}`}>{e.chain}</span></td>
                <td>{e.type}</td>
                <td className="positive">{e.amount}</td>
                <td>{e.token}</td>
                <td className="positive">${parseFloat(e.usd).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
