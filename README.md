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
### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set your preferred RPC endpoints. Public defaults are included so this step is optional for local development:

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_BASE_RPC_URL` | `https://mainnet.base.org` | Base mainnet JSON-RPC endpoint |
| `REACT_APP_OPTIMISM_RPC_URL` | `https://mainnet.optimism.io` | Optimism mainnet JSON-RPC endpoint |
| `REACT_APP_STACKS_NETWORK` | `mainnet` | Stacks network (`mainnet` or `testnet`) |

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

### 4. Start the development server

```bash
npm start
```

The app opens automatically at [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
```

The optimised output is written to the `build/` directory.

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
.env.example               # Environment variable template
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

## Usage

1. Enter your **EVM wallet address** (for Base and Optimism balances).
2. Enter your **Stacks address** (for STX balance).
3. Use the **Activity Logger** on the Dashboard to record income, expenses, and trades.
4. Switch to the **Portfolio** tab to browse the full ledger, apply filters, and export a CSV.
5. View cumulative P&L and daily income trends in the **Profit Chart**.

## License

MIT © 2026 amber buchtela
