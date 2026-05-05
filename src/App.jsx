import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PortfolioPage from './components/PortfolioPage';
import './styles.css';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-logo">⛓ CrossChain Agent</span>
        <div className="nav-links">
          <button
            className={activePage === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activePage === 'portfolio' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage('portfolio')}
          >
            Portfolio
          </button>
        </div>
      </nav>
      <main className="main-content">
        {activePage === 'dashboard' ? <Dashboard /> : <PortfolioPage />}
      </main>
    </div>
  );
}

export default App;
