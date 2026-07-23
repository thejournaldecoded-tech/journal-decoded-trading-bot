# JournalDecoded — Full Repository Audit & Migration Guide

> [!IMPORTANT]
> **This document is analysis only. No code has been changed, no deployments have been triggered.**

---

## Part 0: Version Freeze (Git Guidance)

### What already exists
I previously created a tag `v1.0.0-stable` and a branch `stable-backup` on GitHub. However, your brief requests specific names. Here is what you should run manually:

```bash
# 1. Create the tag you specified
git tag -a v1-stable-deployed -m "Frozen copy of the currently deployed production version"

# 2. Create the new working branch
git checkout -b next-gen-architecture

# 3. Push both to GitHub
git push origin v1-stable-deployed
git push origin next-gen-architecture
```

### Reverting back if anything breaks
```bash
git checkout main
git reset --hard v1-stable-deployed
git push origin main --force
```

### Deployment Mapping

| Service | Provider | Connected Branch | Notes |
|---|---|---|---|
| **Backend API** | Render (Web Service) | `main` | Auto-deploys on push to `main`. Uses `uvicorn main:app` |
| **Frontend** | Render (Static Site) | `main` | Auto-deploys on push to `main`. Builds with `npm run build` |
| **Database** | Neon PostgreSQL | N/A (connection string) | Region: `ap-southeast-1` (Singapore) |
| **Domain** | journaldecoded.in | Points to Render | DNS configured externally |

### Environment Variables Currently In Use

| Variable | Where Used | Current State |
|---|---|---|
| `DATABASE_URL` | [database.py](file:///Users/JD-CODE-FULL-AI-ML/backend/database.py#L8-L9) | **HARDCODED as fallback** in source code |
| `REACT_APP_API_URL` | [config.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/config.js#L2) | Set in Render dashboard, falls back to `localhost:8000` |
| `REACT_APP_WS_URL` | [config.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/config.js#L5) | Optional, auto-derived from API URL |
| `SECRET_KEY` (JWT) | [auth.py](file:///Users/JD-CODE-FULL-AI-ML/backend/core/auth.py#L7) | **HARDCODED** in source code |

> [!CAUTION]
> The database connection string (with username and password) is hardcoded in [database.py:L8](file:///Users/JD-CODE-FULL-AI-ML/backend/database.py#L8). The JWT secret key is hardcoded in [auth.py:L7](file:///Users/JD-CODE-FULL-AI-ML/backend/core/auth.py#L7). Both are committed to GitHub. This is a critical security issue.

---

## Part 1: Repository Audit — Folder Structure

```
JD-CODE-FULL-AI-ML/
├── backend/                          # FastAPI Python backend
│   ├── main.py                       # App entrypoint, CORS, WebSocket handlers, router registration
│   ├── database.py                   # SQLAlchemy engine + session factory (Neon PostgreSQL)
│   ├── requirements.txt              # Python dependencies
│   ├── dataset.csv                   # Training data for ML models (~157KB)
│   ├── model_randomforest.pkl        # Trained Random Forest model (~9.5MB)
│   ├── model_svm.pkl                 # Trained SVM model (~107KB)
│   ├── model_logisticregression.pkl  # Trained Logistic Regression model (~1.3KB)
│   │
│   ├── models/                       # SQLAlchemy ORM models (database tables)
│   │   ├── base.py                   # Declarative base
│   │   ├── user.py                   # users table
│   │   ├── trade.py                  # trades table
│   │   ├── wallet.py                 # wallets table
│   │   ├── position.py              # positions table
│   │   ├── candle.py                 # candles table (OHLCV data)
│   │   ├── order.py                  # orders table
│   │   ├── post.py                   # posts table (blog/CMS)
│   │   └── strategy_log.py          # strategy_logs table
│   │
│   ├── routes/                       # API route handlers (18 files)
│   │   ├── user_routes.py            # /register, /login
│   │   ├── trade_routes.py           # /trades, /signal/{symbol}
│   │   ├── market_routes.py          # /market/{symbol}, /market/history
│   │   ├── portfolio_routes.py       # /portfolio
│   │   ├── manual_trade_routes.py    # /api/manual-trade
│   │   ├── wallet_routes.py          # /api/wallet
│   │   ├── auto_trading_routes.py    # /api/auto-trading/*
│   │   ├── post_routes.py            # /api/posts (CRUD for blog)
│   │   ├── train_routes.py           # /train (basic model training)
│   │   ├── enhanced_train_routes.py  # /api/enhanced-train
│   │   ├── bulk_seed_routes.py       # /api/bulk-seed
│   │   ├── candle_seed_routes.py     # /api/seed-candles
│   │   └── ... (analytics, backtest, strategy, feature, history, pnl)
│   │
│   ├── services/                     # Business logic layer (25 files)
│   │   ├── market_service.py         # Fetches live prices from Bybit API
│   │   ├── model_service.py          # Basic single-model ML inference
│   │   ├── enhanced_model_service.py # Multi-algorithm ML (RF, SVM, LR)
│   │   ├── consensus_service.py      # Voting/consensus across models
│   │   ├── feature_service.py        # RSI, EMA, momentum calculation
│   │   ├── trade_services.py         # Trade execution, P&L, portfolio
│   │   ├── position_service.py       # Position tracking (long/short)
│   │   ├── auto_trading_service.py   # Automated trading engine
│   │   ├── scheduler_service.py      # APScheduler background jobs
│   │   ├── strategy_services.py      # EMA crossover strategy logic
│   │   └── ... (analytics, backtest, candle, paper_trading, wallet, etc.)
│   │
│   ├── core/                         # Cross-cutting concerns
│   │   ├── auth.py                   # JWT decode + user extraction
│   │   ├── config.py                 # (empty)
│   │   └── state.py                  # Global in-memory dict: live_prices = {}
│   │
│   ├── utils/                        # Utilities
│   │   ├── dependencies.py           # FastAPI dependency injection
│   │   ├── security.py               # Password hashing (bcrypt)
│   │   └── logger.py                 # Basic logging setup
│   │
│   ├── schemas/                      # Pydantic validation schemas
│   │   └── trade_schema.py           # TradeRequest schema
│   │
│   ├── bot/                          # Trading bot (currently disabled)
│   │   ├── scheduler.py
│   │   └── trade_bot.py
│   │
│   └── alembic/                      # Database migrations (Alembic)
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── App.js                    # Router + route definitions
│   │   ├── config.js                 # API_BASE_URL + WS_BASE_URL
│   │   ├── index.js                  # React DOM entry
│   │   ├── index.css                 # Global styles
│   │   │
│   │   ├── layouts/
│   │   │   └── MainLayout.js         # Navbar, TickerTape, footer
│   │   │
│   │   ├── pages/                    # 15 page components
│   │   │   ├── Home.js               # Landing page + TradingView chart
│   │   │   ├── Dashboard.js          # Trading engine + paper trading
│   │   │   ├── TradingSignals.js     # AI signal display (Macro Predictions)
│   │   │   ├── StrategyLab.js        # TradingView sandbox + posts
│   │   │   ├── Login.js              # Auth form
│   │   │   ├── AdminPanel.js         # Post CRUD for admins
│   │   │   ├── PostDetail.js         # Individual post view
│   │   │   ├── Economics.js          # Blog section (economics)
│   │   │   ├── Insights.js           # Blog section (insights)
│   │   │   └── ... (APITest, TestAuth, TestLogin, SimpleDashboard, BlogList, BlogPost)
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── LiveMarket.js         # WebSocket live price display
│   │   │   ├── PaperTradeForm.js     # Manual trade form
│   │   │   ├── SignalPanel.js        # Signal summary widget
│   │   │   ├── PostGrid.js           # Post listing grid
│   │   │   └── ProtectedRoute.js     # Auth guard wrapper
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js        # React Context for JWT auth state
│   │   │
│   │   └── utils/
│   │       └── api.js                # Axios instance + JWT interceptor
```

---

## Part 2: Feature-to-File Ownership Map

### Authentication
| Concern | File | What It Does |
|---|---|---|
| Login/Register API | [user_routes.py](file:///Users/JD-CODE-FULL-AI-ML/backend/routes/user_routes.py) | Handles `/register` and `/login`, issues JWT |
| JWT Decode | [auth.py](file:///Users/JD-CODE-FULL-AI-ML/backend/core/auth.py) | Verifies JWT, extracts `user_id` |
| Password Hashing | [security.py](file:///Users/JD-CODE-FULL-AI-ML/backend/utils/security.py) | bcrypt hash + verify |
| Frontend Auth State | [AuthContext.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/context/AuthContext.js) | React Context storing JWT in localStorage |
| Route Protection | [ProtectedRoute.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/components/ProtectedRoute.js) | Redirects unauthenticated users |

---

### Market Data Ingestion
| Concern | File | What It Does |
|---|---|---|
| Live Price (REST) | [market_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/market_service.py) | Fetches from Bybit REST API (`get_current_price`) |
| Historical Candles (REST) | [market_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/market_service.py) | Fetches klines from Bybit (`get_historical_price`) |
| Live Price (WebSocket) | [main.py:L93-L161](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L93-L161) | Connects to `wss://stream.bybit.com`, streams to frontend |
| In-Memory Price Cache | [state.py](file:///Users/JD-CODE-FULL-AI-ML/backend/core/state.py) | `live_prices = {}` — a simple Python dict |
| Candle Building | [candle_engine.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/candle_engine.py) | Builds OHLCV candles from tick data |
| Auto-Seed on Startup | [main.py:L57-L89](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L57-L89) | Seeds 200 BTCUSDT 1m candles on deploy |

> **Learning concept:** The current system uses a Python `dict` as a cache (`live_prices`). In production, this would be replaced by **Redis** — an in-memory database that survives server restarts and can be shared across multiple server instances.

---

### ML Models & Prediction
| Concern | File | What It Does |
|---|---|---|
| Basic Training | [model_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/model_service.py) | Trains a single RandomForest on `dataset.csv` |
| Multi-Algorithm Training | [enhanced_model_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/enhanced_model_service.py) | Trains RF + SVM + LR, saves `.pkl` files |
| Feature Engineering | [feature_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/feature_service.py) | Computes RSI, EMA fast/slow, momentum |
| Consensus Voting | [consensus_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/consensus_service.py) | Weighted voting across 3 models |
| Training Dataset | [dataset.csv](file:///Users/JD-CODE-FULL-AI-ML/backend/dataset.csv) | ~157KB CSV with RSI, EMA, momentum, labels |
| Serialized Models | `model_randomforest.pkl`, `model_svm.pkl`, `model_logisticregression.pkl` | Stored in backend root |

> **Learning concept:** The current models use `train_test_split` with `shuffle=True` — this is a **data leakage risk** for time-series data because future data can appear in the training set. Your plan to use **walk-forward validation** is the correct production approach.

---

### Paper Trading Engine
| Concern | File | What It Does |
|---|---|---|
| Trade Execution | [trade_services.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/trade_services.py) | Executes BUY/SELL/SHORT with slippage simulation |
| Position Management | [position_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/position_service.py) | Tracks open positions, avg price, P&L |
| Wallet/Balance | [wallet_routes.py](file:///Users/JD-CODE-FULL-AI-ML/backend/routes/wallet_routes.py) | Virtual wallet CRUD |
| Auto-Trading | [auto_trading_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/auto_trading_service.py) | Runs model → generates signal → executes trade |
| Background Scheduler | [scheduler_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/scheduler_service.py) | APScheduler: auto-trade every 5min, exit-check every 10s (**currently disabled**) |

---

### Content/Blog System
| Concern | File | What It Does |
|---|---|---|
| Post CRUD API | [post_routes.py](file:///Users/JD-CODE-FULL-AI-ML/backend/routes/post_routes.py) | Create, read, update, delete posts |
| Post Model | [post.py](file:///Users/JD-CODE-FULL-AI-ML/backend/models/post.py) | Sections: economics, strategy, insights |
| Admin Panel | [AdminPanel.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/pages/AdminPanel.js) | Admin UI for managing posts |

---

## Part 3: Migration Map for Planned Features

### Feature: Multi-Timeframe XGBoost Models
| Action | File | Details |
|---|---|---|
| **Replace** | [enhanced_model_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/enhanced_model_service.py) | Replace RF/SVM/LR with XGBoost. Load 4 models: `model_1m.pkl`, `model_5m.pkl`, `model_1h.pkl`, `model_1d.pkl` |
| **Expand** | [feature_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/feature_service.py) | Add ATR, VWAP, rolling volatility, volume ratio, hour_of_day, day_of_week, symbol_id |
| **New** | `backend/services/model_router.py` | New file: loads all 4 models at startup, routes prediction requests to the correct timeframe model |
| **Replace** | [dataset.csv](file:///Users/JD-CODE-FULL-AI-ML/backend/dataset.csv) | Replace with Parquet files stored on Cloudflare R2 |
| **Update** | [consensus_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/consensus_service.py) | Update to aggregate across timeframes instead of across algorithms |

> **Learning concept:** A **Model Router** is a design pattern where a single service acts as a gateway. Instead of each route loading its own model, the router holds all models in memory and dispatches requests. This is how ML systems at scale (like Uber's Michelangelo) work.

---

### Feature: Walk-Forward Backtesting
| Action | File | Details |
|---|---|---|
| **New** | `backend/services/backtest_engine.py` | Implement walk-forward loop: train on window → test on next period → slide window forward |
| **Expand** | [backtest_routes.py](file:///Users/JD-CODE-FULL-AI-ML/backend/routes/backtest_routes.py) | Currently minimal. Add endpoints for running backtests and retrieving results |
| **New** | `backend/models/backtest.py` | New SQLAlchemy model to store backtest runs, parameters, and metrics |
| **New** | `frontend/src/pages/BacktestResults.js` | New page to visualize equity curves, drawdowns, monthly returns |

> **Learning concept:** Walk-forward validation trains on data up to time T, tests on T+1 to T+N, then slides the window forward. This prevents **look-ahead bias** — the #1 reason academic backtests look profitable but fail in production.

---

### Feature: Cloudflare R2 Historical Data Storage
| Action | File | Details |
|---|---|---|
| **New** | `backend/services/data_ingestion.py` | Fetches historical candles from exchanges, converts to Parquet, uploads to R2 |
| **New** | `backend/services/r2_client.py` | S3-compatible client for Cloudflare R2 (using `boto3`) |
| **Modify** | [market_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/market_service.py) | Add function to load Parquet from R2 for training/backtesting (separate from live price fetching) |

> **Learning concept:** Storing terabytes of candle data in PostgreSQL is extremely expensive and slow for analytical queries. **Parquet** is a columnar file format designed for big data — it compresses 10x better than CSV and reads 100x faster for analytical workloads. Cloudflare R2 is S3-compatible object storage with zero egress fees.

---

### Feature: RAG Intelligence Layer
| Action | File | Details |
|---|---|---|
| **New** | `backend/services/rag_service.py` | Embed documents using `sentence-transformers`, store in ChromaDB/FAISS |
| **New** | `backend/services/explanation_service.py` | Query vector DB to explain why a signal was generated |
| **New** | `backend/routes/intelligence_routes.py` | `/api/explain-signal`, `/api/search-knowledge` |
| **New** | `backend/data/knowledge/` | Directory for indexable documents (RBI notes, strategy docs, your research) |

> **Learning concept:** RAG (Retrieval-Augmented Generation) does NOT predict prices. It retrieves relevant documents from a knowledge base and uses them to generate human-readable explanations. This is the exact architecture behind tools like Perplexity AI and Microsoft Copilot.

---

### Feature: NSE + NASDAQ Stock Support
| Action | File | Details |
|---|---|---|
| **Modify** | [market_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/market_service.py) | Add new functions: `get_nse_price()`, `get_nasdaq_price()`. Keep existing `get_current_price()` for crypto |
| **New** | `backend/services/data_vendors.py` | Abstraction layer for different data sources (Bybit for crypto, Yahoo Finance/Polygon for stocks, TrueData for NSE) |
| **Modify** | [feature_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/feature_service.py) | Add `market_session` and `symbol_id` features for multi-market models |

> **Learning concept:** The **Adapter Pattern** — you create a common interface (`get_price(symbol)`) and write separate adapters for each data source. Your code never talks to Bybit or Yahoo directly; it always goes through the adapter. This means adding a new exchange requires writing one small adapter file, not rewriting the entire system.

---

## Part 4: Technical Debt Review

### 🔴 Critical (Fix Before Any New Features)

| Issue | File | Problem | Risk |
|---|---|---|---|
| **Hardcoded DB credentials** | [database.py:L8](file:///Users/JD-CODE-FULL-AI-ML/backend/database.py#L8) | Full Neon connection string with password in source code, committed to GitHub | Anyone with repo access can read/write/delete your entire database |
| **Hardcoded JWT secret** | [auth.py:L7](file:///Users/JD-CODE-FULL-AI-ML/backend/core/auth.py#L7) | `SECRET_KEY = "journaldecoded_super_secret_key"` in source code | Anyone can forge authentication tokens for any user |
| **CORS allow all origins** | [main.py:L41](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L41) | `allow_origins=["*"]` | Any website on the internet can make API calls to your backend |

### 🟡 High (Architectural Issues)

| Issue | File | Problem |
|---|---|---|
| **Global mutable state** | [state.py](file:///Users/JD-CODE-FULL-AI-ML/backend/core/state.py) | `live_prices = {}` is an in-memory Python dict. Lost on every server restart. Cannot be shared if you scale to multiple server instances |
| **Blocking I/O in async context** | [main.py:L57-L89](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L57-L89) | `_seed_candles()` uses `requests.get()` (blocking) inside a thread, and creates its own DB session outside the request lifecycle |
| **Models stored in repo root** | `model_*.pkl` files | 9.5MB+ binary files in Git. Every clone downloads them. Should be in R2/S3 |
| **Debug prints everywhere** | [trade_services.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/trade_services.py), [feature_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/feature_service.py), [api.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/utils/api.js) | `print()` and `console.log()` statements with sensitive data (tokens, wallet balances) |
| **Duplicate balance tracking** | [user.py:L18](file:///Users/JD-CODE-FULL-AI-ML/backend/models/user.py#L18) + [wallet.py:L11](file:///Users/JD-CODE-FULL-AI-ML/backend/models/wallet.py#L11) | `User.balance` AND `Wallet.balance` both exist. Two sources of truth for the same data |
| **`train_test_split` with `shuffle=True`** | [enhanced_model_service.py:L77-L78](file:///Users/JD-CODE-FULL-AI-ML/backend/services/enhanced_model_service.py#L77-L78) | Shuffling time-series data causes future data to leak into the training set |

### 🟢 Medium (Code Quality)

| Issue | File | Problem |
|---|---|---|
| **Test/Debug pages in production** | [App.js](file:///Users/JD-CODE-FULL-AI-ML/frontend/src/App.js) | Routes like `/test-auth`, `/api-test`, `/test-login`, `/simple-dashboard` are accessible in production |
| **No input validation schemas** | [schemas/](file:///Users/JD-CODE-FULL-AI-ML/backend/schemas) | Only 1 Pydantic schema exists (`TradeRequest`). Most routes accept raw dicts |
| **Hardcoded model accuracies** | [enhanced_model_service.py:L49-L54](file:///Users/JD-CODE-FULL-AI-ML/backend/services/enhanced_model_service.py#L49-L54) | Accuracy values like `66.03` are hardcoded as fallback, not computed dynamically |
| **Scheduler disabled** | [main.py:L54-L55](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L54-L55) | Both `start_bot()` and `start_scheduler()` are commented out |
| **Hardcoded symbols** | [scheduler_service.py:L11](file:///Users/JD-CODE-FULL-AI-ML/backend/services/scheduler_service.py#L11) | `SYMBOLS = ["AAPL", "MSFT", "GOOGL"]` — hardcoded stock list that doesn't match the crypto-focused platform |

---

## Part 5: Future Scaling Architecture (Where Components Would Fit)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Tailwind (Vercel)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Home    │ │Dashboard │ │ Signals  │ │Backtest  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │             │            │             │              │
│       └─────────────┴────────────┴─────────────┘              │
│                         │                                     │
│                    REST + WebSocket                            │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │    LOAD BALANCER    │  ← Future: Nginx/Cloudflare
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───┴────┐         ┌────┴────┐         ┌────┴────┐
│ API    │         │ API     │         │ API     │  ← Future: Stateless replicas
│ Inst 1 │         │ Inst 2  │         │ Inst 3  │
└───┬────┘         └────┬────┘         └────┬────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
    │  Redis  │    │   Neon    │   │   R2      │
    │ (Cache  │    │ (Postgres)│   │ (Parquet) │
    │ + Queue)│    │           │   │           │
    └─────────┘    └───────────┘   └───────────┘
         │
    ┌────┴────┐
    │ Worker  │  ← Future: Background job processor
    │ Service │     (model training, data ingestion,
    └────┬────┘      backtest execution)
         │
    ┌────┴────┐
    │  Kafka  │  ← Future: Event streaming
    │         │     (tick data, trade events,
    └─────────┘      signal broadcasts)
```

### Where each component fits in the current code:

| Future Component | Replaces | Currently In |
|---|---|---|
| **Redis Cache** | `live_prices = {}` dict | [state.py](file:///Users/JD-CODE-FULL-AI-ML/backend/core/state.py) |
| **Redis Task Queue** | APScheduler threads | [scheduler_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/scheduler_service.py) |
| **Worker Service** | Inline model training | [enhanced_model_service.py](file:///Users/JD-CODE-FULL-AI-ML/backend/services/enhanced_model_service.py) |
| **Kafka** | Direct WebSocket relay | [main.py:L93-L161](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L93-L161) |
| **Load Balancer** | Single Render instance | Render dashboard config |

> **Learning concept:** The reason you make API servers **stateless** (no `live_prices` dict, no in-memory models) is so you can run 10 copies of the same server behind a load balancer. If one crashes, the others keep serving. If traffic spikes, you spin up more copies. This is called **horizontal scaling** and is the foundation of every production system at scale.

---

## Part 6: Data Ingestion — Current State & Separation Plan

### Where market data currently enters the system:

1. **WebSocket (Live):** [main.py:L93-L161](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L93-L161) — connects to Bybit, stores in `live_prices` dict, processes ticks into candles
2. **REST (Historical):** [market_service.py:L46-L68](file:///Users/JD-CODE-FULL-AI-ML/backend/services/market_service.py#L46-L68) — fetches klines from Bybit on demand
3. **Auto-Seed (Startup):** [main.py:L57-L89](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py#L57-L89) — seeds 200 candles into PostgreSQL on deploy

### How to separate into an independent ingestion service:

The goal is to extract all data-fetching logic out of `main.py` into a standalone service that can run independently.

1. Create `backend/services/data_ingestion.py` — this becomes your single source of truth for all market data
2. Move the WebSocket connection logic from `main.py` into this service
3. Move `market_service.py` functions into this service
4. The ingestion service writes to Redis (for live prices) and R2 (for historical Parquet files)
5. The API server only reads from Redis/R2 — it never talks to exchanges directly

> **Learning concept:** This is called **Separation of Concerns**. The API server's job is to serve HTTP requests. The ingestion service's job is to collect data. If Bybit's WebSocket goes down, your API server keeps running (serving cached data). If your API server crashes, data ingestion keeps running (no data loss).

---

This document is your complete map. Read it carefully, ask questions about anything that's unclear, and when you're ready to start making changes, work on the `next-gen-architecture` branch so `main` (production) stays untouched.
