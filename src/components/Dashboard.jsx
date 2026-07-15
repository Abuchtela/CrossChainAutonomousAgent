import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllBalances,
  connectMiniPay,
  getInjectedProvider,
  CHAINS as CHAIN_CONFIG,
} from '../api/crossChainAPI';
import { getTodayIncome, getTotalPnL, addEntry } from '../api/ledgerAPI';
import ProfitChart from './ProfitChart';
import PortfolioPage from './PortfolioPage';

const CHAIN_KEYS = Object.keys(CHAIN_CONFIG);

const CHAIN_COLORS = {
  base: '#0052ff',
  optimism: '#ff0420',
  celo: '#35d07f',
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
  const [connectingWallet, setConnectingWallet] = useState(false);
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
  const [walletProviderLabel, setWalletProviderLabel] = useState('');
  const [miniPayReady, setMiniPayReady] = useState(false);

  const refreshStats = useCallback(() => {
    setTodayIncome(getTodayIncome());
    setTotalPnL(getTotalPnL());
  }, []);

  useEffect(() => {
    refreshStats();
    const provider = getInjectedProvider({ preferMiniPay: true });
    if (provider) {
      setMiniPayReady(true);
      setWalletProviderLabel(provider.isMiniPay ? 'MiniPay detected' : 'Injected wallet detected');
    }
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

  const handleConnectMiniPay = async () => {
    setConnectingWallet(true);
    try {
      const { account, provider } = await connectMiniPay();
      if (!account) {
        throw new Error('No wallet account was returned.');
      }

      setMiniPayReady(true);
      setWalletProviderLabel(provider?.isMiniPay ? 'Connected with MiniPay' : 'Connected with wallet');
      setEvmAddress(account);
      localStorage.setItem(
        'agent_addresses',
        JSON.stringify({ evm: account, stacks: stacksAddress })
      );
      await fetchBalances(account, stacksAddress);
      showNotification(provider?.isMiniPay ? 'MiniPay connected on Celo.' : 'Wallet connected on Celo.');
    } catch (error) {
      showNotification(`Wallet connection failed: ${error.message}`);
    } finally {
      setConnectingWallet(false);
    }
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
            <p className="muted-text" style={{ marginBottom: '1rem' }}>
              Use your EVM wallet for Base, Optimism, and Celo. Connect MiniPay to auto-fill your
              Celo-ready address.
            </p>
            <div className="address-form">
              <div className="form-group">
                <label>EVM Address (Base, Optimism &amp; Celo)</label>
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
                <button
                  className="btn btn-secondary"
                  onClick={handleConnectMiniPay}
                  disabled={connectingWallet}
                >
                  {connectingWallet ? 'Connecting…' : 'Connect MiniPay'}
                </button>
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
              <p className="muted-text">
                {miniPayReady
                  ? `${walletProviderLabel} — Celo balances will be fetched with the same EVM address.`
                  : 'MiniPay not detected. You can still paste any Celo-compatible EVM address manually.'}
              </p>
            </div>
          </section>

          <section>
            <h2>Chain Balances</h2>
            <div className="chains-grid">
              {CHAIN_KEYS.map((chain) => (
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
                    {CHAIN_KEYS.map((c) => (
                      <option key={c} value={c}>
                        {CHAIN_CONFIG[c].name}
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
