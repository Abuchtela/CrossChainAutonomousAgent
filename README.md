# CrossChain Autonomous Agent

Autonomous multi-chain agent dashboard for **Base**, **Optimism**, and **Stacks** with trading, vault integration, hidden ledger, and daily income tracking.

## Features

- 📊 **Live chain balances** — native ETH on Base & Optimism, STX on Stacks
- 💹 **Profit charts** — line & bar charts powered by Recharts
- 📒 **Hidden ledger** — log income, expenses, and trades per chain
- 📁 **CSV export** — download your full ledger history
- 🌙 **Dark theme** — sleek crypto-native UI

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your preferred RPC endpoints (optional — public defaults are included)
```

### 3. Start the development server

```bash
npm start
# Opens http://localhost:3000
```

### 4. Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── api/
│   ├── crossChainAPI.js   # Base, Optimism & Stacks chain connectors (ethers.js)
│   └── ledgerAPI.js       # localStorage-backed ledger (add, export, P&L)
├── components/
│   ├── Dashboard.jsx      # Main dashboard — balances, log activity
│   ├── PortfolioPage.jsx  # Full ledger view with filters & CSV export
│   └── ProfitChart.jsx    # Recharts profit / P&L visualisation
├── App.jsx                # Root component
├── index.js               # React entry point
└── styles.css             # Dark-theme global styles
public/
└── index.html             # HTML shell
```

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18 |
| EVM chains | ethers.js 6 |
| Stacks | @stacks/transactions 2 |
| Charts | Recharts 2 |
| HTTP | axios |
| Build | react-scripts (CRA) |

## License

MIT © 2026 amber buchtela
