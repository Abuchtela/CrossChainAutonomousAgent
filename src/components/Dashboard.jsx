import React, { useState, useEffect, useCallback } from 'react';
import { fetchBlockNumber, fetchGasPrice, CHAINS } from '../api/crossChainAPI';
import ProfitChart from './ProfitChart';
import { loadLedger, dailyTotals, chainTotals, totalIncome } from '../api/ledgerAPI';

const CHAIN_KEYS = ['base', 'optimism', 'stacks'];

function formatNum(n, decimals = 4) {
  if (n === null || n === undefined) return '—';
  return parseFloat(n).toFixed(decimals);
}

function AgentLog({ logs }) {
  return (
    <div className="agent-log">
      {logs.map((line, i) => (
        <div key={i} className="log-line">
          <span className="log-time">{line.time}</span>
          {line.msg}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [chainData, setChainData] = useState({
    base: { block: null, gas: null, status: 'loading' },
    optimism: { block: null, gas: null, status: 'loading' },
    stacks: { block: null, gas: null, status: 'loading' },
  });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [logs, setLogs] = useState([]);

  const pushLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, msg }, ...prev].slice(0, 30));
  }, []);

  const refreshChain = useCallback(async (key) => {
    try {
      let block = null;
      let gas = null;

      if (key !== 'stacks') {
        [block, gas] = await Promise.all([
          fetchBlockNumber(key),
          fetchGasPrice(key),
        ]);
      }

      setChainData((prev) => ({
        ...prev,
        [key]: { block, gas, status: 'online' },
      }));
      pushLog(`[${CHAINS[key].name}] block=${block ?? 'n/a'} gas=${gas !== null ? gas.toFixed(2) + ' Gwei' : 'n/a'}`);
    } catch (err) {
      setChainData((prev) => ({
        ...prev,
        [key]: { block: null, gas: null, status: 'offline' },
      }));
      pushLog(`[${CHAINS[key].name}] ERROR: ${err.message}`);
    }
  }, [pushLog]);

  const refreshAll = useCallback(() => {
    CHAIN_KEYS.forEach(refreshChain);
    setLedgerEntries(loadLedger());
  }, [refreshChain]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const entries = ledgerEntries;
  const income = totalIncome(entries);
  const daily = dailyTotals(entries);
  const byChain = chainTotals(entries);

  return (
    <div>
      <div className="grid">
        <div className="card">
          <h2>Total Income</h2>
          <div className="value">${income.toFixed(2)}</div>
          <div className="sub">All chains · All time</div>
        </div>
        <div className="card">
          <h2>Active Chains</h2>
          <div className="value">
            {CHAIN_KEYS.filter((k) => chainData[k].status === 'online').length} / {CHAIN_KEYS.length}
          </div>
          <div className="sub">Live connections</div>
        </div>
        <div className="card">
          <h2>Ledger Entries</h2>
          <div className="value">{entries.length}</div>
          <div className="sub">Recorded transactions</div>
        </div>
      </div>

      {/* Chain status cards */}
      <p className="section-title">Chain Status</p>
      <div className="grid">
        {CHAIN_KEYS.map((key) => {
          const chain = CHAINS[key];
          const data = chainData[key];
          const badgeClass = `chain-badge chain-${key}`;
          return (
            <div key={key} className="card">
              <h2>
                <span className={`status-dot ${data.status}`} />
                <span className={badgeClass}>{chain.name}</span>
              </h2>
              {key !== 'stacks' && (
                <>
                  <div className="sub">Block: {data.block ?? '—'}</div>
                  <div className="sub">Gas: {data.gas !== null ? formatNum(data.gas, 2) + ' Gwei' : '—'}</div>
                </>
              )}
              {key === 'stacks' && (
                <div className="sub">Stacks node (STX)</div>
              )}
              <div className="sub" style={{ marginTop: 6 }}>
                Status: <strong>{data.status}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <ProfitChart daily={daily} byChain={byChain} />

      {/* Agent log */}
      <p className="section-title" style={{ marginTop: 24 }}>Agent Log</p>
      <AgentLog logs={logs} />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button className="nav-btn" onClick={refreshAll}>↻ Refresh Now</button>
      </div>
    </div>
  );
}
