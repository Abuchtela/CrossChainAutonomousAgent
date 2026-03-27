import React, { useState, useEffect, useCallback } from 'react';
import { getAllBalances } from '../api/crossChainAPI';
import { getTodayIncome, getTotalPnL, addEntry } from '../api/ledgerAPI';
import ProfitChart from './ProfitChart';
import PortfolioPage from './PortfolioPage';

const CHAINS = ['base', 'optimism', 'stacks'];

const CHAIN_COLORS = {
  base: '#0052ff',
  optimism: '#ff0420',
  stacks: '#5546ff',
};

const ChainCard = ({ chain, data, loading }) => (
  <div className="chain-card" style={{ borderLeft: `4px solid ${CHAIN_COLORS[chain]}` }}>
    <h3 className="chain-name">{chain.charAt(0).toUpperCase() + chain.slice(1)}</h3>
    {loading ? (
      <div className="spinner" />
    ) : data?.error ? (
      <p className="error-text" title={data.error}>Unable to fetch balance</p>
    ) : data ? (
      <p className="balance-value">
        {parseFloat(data.balance).toFixed(6)}{' '}
        <span className="balance-symbol">{data.symbol}</span>
      </p>
    ) : (
      <p className="muted-text">No address connected</p>
    )}
  </div>
);

const Dashboard = () => {
  const [evmAddress, setEvmAddress] = useState('');
  const [stacksAddress, setStacksAddress] = useState('');
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todayIncome, setTodayIncome] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [newEntry, setNewEntry] = useState({
    type: 'income',
    amount: '',
    description: '',
    chain: 'base',
  });
  const [notification, setNotification] = useState('');

  const refreshStats = useCallback(() => {
    setTodayIncome(getTodayIncome());
    setTotalPnL(getTotalPnL());
  }, []);

  useEffect(() => {
    refreshStats();
    try {
      const stored = localStorage.getItem('agent_addresses');
      if (stored) {
        const { evm, stacks } = JSON.parse(stored);
        setEvmAddress(evm || '');
        setStacksAddress(stacks || '');
      }
    } catch {
      // ignore corrupted storage
    }
  }, [refreshStats]);

  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }, []);

  const fetchBalances = useCallback(async (evm, stx) => {
    const evmAddr = evm !== undefined ? evm : evmAddress;
    const stxAddr = stx !== undefined ? stx : stacksAddress;
    if (!evmAddr && !stxAddr) return;
    setLoading(true);
    try {
      const result = await getAllBalances(evmAddr || null, stxAddr || null);
      setBalances(result);
    } catch (err) {
      showNotification('Failed to fetch balances: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [evmAddress, stacksAddress, showNotification]);

  const saveAddresses = () => {
    localStorage.setItem(
      'agent_addresses',
      JSON.stringify({ evm: evmAddress, stacks: stacksAddress })
    );
    fetchBalances(evmAddress, stacksAddress);
    showNotification('Addresses saved!');
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newEntry.amount || isNaN(parseFloat(newEntry.amount))) {
      showNotification('Please enter a valid amount');
      return;
    }
    addEntry(newEntry);
    refreshStats();
    setNewEntry({ type: 'income', amount: '', description: '', chain: 'base' });
    showNotification('Entry added to ledger!');
  };

  return (
    <div className="dashboard">
      {notification && <div className="notification">{notification}</div>}

      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-icon">⚡</span>
          <h1>CrossChain Autonomous Agent</h1>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => { setActiveTab('portfolio'); refreshStats(); }}
          >
            Portfolio
          </button>
        </nav>
      </header>

      {activeTab === 'dashboard' && (
        <main className="dashboard-main">
          <section className="stats-bar">
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
          </section>

          <section className="card">
            <h2>Wallet Addresses</h2>
            <div className="address-form">
              <div className="form-group">
                <label>EVM Address (Base &amp; Optimism)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0x..."
                  value={evmAddress}
                  onChange={(e) => setEvmAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Stacks Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="SP... or SM..."
                  value={stacksAddress}
                  onChange={(e) => setStacksAddress(e.target.value)}
                />
              </div>
              <div className="button-row">
                <button className="btn btn-primary" onClick={saveAddresses}>
                  Save &amp; Refresh
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => fetchBalances()}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : '↻ Refresh Balances'}
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2>Chain Balances</h2>
            <div className="chains-grid">
              {CHAINS.map((chain) => (
                <ChainCard
                  key={chain}
                  chain={chain}
                  data={balances[chain]}
                  loading={loading}
                />
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Profit Overview</h2>
            <ProfitChart />
          </section>

          <section className="card">
            <h2>Log Activity</h2>
            <form onSubmit={handleAddEntry} className="entry-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="input"
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="trade">Trade</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Chain</label>
                  <select
                    className="input"
                    value={newEntry.chain}
                    onChange={(e) => setNewEntry({ ...newEntry, chain: e.target.value })}
                  >
                    {CHAINS.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (USD)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0.00"
                    step="0.0001"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. vault yield, swap profit, gas cost…"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add Entry
              </button>
            </form>
          </section>
        </main>
      )}

      {activeTab === 'portfolio' && (
        <main className="dashboard-main">
          <PortfolioPage onBack={() => setActiveTab('dashboard')} />
        </main>
      )}
    </div>
  );
};

export default Dashboard;
