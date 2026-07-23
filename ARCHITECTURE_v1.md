Current Version: v1.0.0-stable
Next Branch: next-gen-architecture
Owner: Kartikay
Purpose: Living architecture document for JournalDecoded


# JOURNALDECODED — COMPLETE ARCHITECTURE & FILE REFERENCE

> **Last Updated:** July 2026  
> **Production URL:** https://journaldecoded.in  
> **This file lives in the project root so you can always reference it without going back to any chat.**

---

---

# **DEPLOYMENT & INFRASTRUCTURE**

| Service | Provider | Branch | Details |
|---|---|---|---|
| Backend API | Render (Web Service) | `main` | Auto-deploys on push. Runs `uvicorn main:app` |
| Frontend | Render (Static Site) | `main` | Auto-deploys on push. Builds with `npm run build` |
| Database | Neon PostgreSQL | N/A | Region: `ap-southeast-1` (Singapore) |
| Domain | journaldecoded.in | — | DNS points to Render |

### **GIT BACKUP VERSIONS**
- **Tag:** `v1.0.0-stable` → Frozen working version
- **Tag:** `v1-stable-deployed` → Create this before starting next-gen work
- **Branch:** `stable-backup` → Full backup branch on GitHub
- **Branch:** `next-gen-architecture` → Create this for all new development

### **ENVIRONMENT VARIABLES**
| Variable | Location | Status |
|---|---|---|
| `DATABASE_URL` | `backend/database.py` | ⚠️ Hardcoded as fallback. Should be env-only |
| `REACT_APP_API_URL` | `frontend/src/config.js` | Set in Render dashboard |
| `REACT_APP_WS_URL` | `frontend/src/config.js` | Auto-derived from API URL |
| `SECRET_KEY` (JWT) | `backend/core/auth.py` | ⚠️ Hardcoded. Must be moved to env |

---

---

# **BACKEND — FILE BY FILE**

All backend code lives in `/backend/`.

---

## **ENTRYPOINT & CONFIG**

### `main.py` — THE HEART OF THE BACKEND
- Creates the FastAPI app instance
- Configures CORS (currently allows all origins with `*`)
- Registers ALL route files (18 routers)
- Contains TWO WebSocket endpoints:
  - `/ws/market/{symbol}` → Connects to Bybit WebSocket, streams live crypto prices to the frontend
  - `/ws/portfolio/{user_id}` → Streams portfolio analytics every 5 seconds
- Contains startup event that auto-seeds 200 BTCUSDT candles into the database on every deploy
- **WHERE TO MAKE CHANGES:** If you add a new route file, register it here. If you add a new WebSocket, add it here.

### `database.py` — DATABASE CONNECTION
- Creates SQLAlchemy engine connected to Neon PostgreSQL
- Provides `SessionLocal` (database session factory) and `get_db()` dependency
- ⚠️ Contains hardcoded database URL with username/password
- **WHERE TO MAKE CHANGES:** When you move credentials to environment variables, edit line 8-9

### `requirements.txt` — PYTHON DEPENDENCIES
- All pip packages: FastAPI, SQLAlchemy, scikit-learn, pandas, numpy, bcrypt, websockets, APScheduler, etc.
- **WHERE TO MAKE CHANGES:** When you add XGBoost, sentence-transformers, chromadb, boto3, add them here

---

## **MODELS (DATABASE TABLES)**

All files in `/backend/models/`. Each file defines one PostgreSQL table.

### `base.py` — SQLALCHEMY BASE
- Single line: `Base = declarative_base()`
- Every other model imports from this

### `user.py` — USERS TABLE
- Fields: `id`, `username`, `email`, `password`, `balance`, `is_admin`
- ⚠️ Has a `balance` field that duplicates `Wallet.balance` (technical debt)
- **WHERE TO MAKE CHANGES:** If you add user preferences, trading settings, or API keys

### `trade.py` — TRADES TABLE
- Fields: `id`, `symbol`, `price`, `quantity`, `trade_type`, `stop_loss`, `take_profit`, `status`, `exit_price`, `pnl`, `created_at`, `closed_at`, `user_id`
- Every paper trade (manual or auto) creates a row here
- **WHERE TO MAKE CHANGES:** If you add fields like `timeframe`, `model_version`, `signal_source`

### `wallet.py` — WALLETS TABLE
- Fields: `id`, `user_id`, `balance`, `created_at`, `updated_at`
- Separate from User.balance (this is the primary one used by trade execution)
- **WHERE TO MAKE CHANGES:** If you add multi-currency support

### `position.py` — POSITIONS TABLE
- Fields: `id`, `user_id`, `symbol`, `quantity`, `avg_price`, `last_updated`, `created_at`
- Tracks currently open positions (positive qty = long, negative = short)
- **WHERE TO MAKE CHANGES:** If you add margin tracking, leverage, or position tags

### `candle.py` — CANDLES TABLE
- Fields: `id`, `symbol`, `interval`, `open`, `high`, `low`, `close`, `volume`, `timestamp`
- Stores OHLCV candle data used for feature calculation and model prediction
- ⚠️ Currently stores ALL candle data in PostgreSQL. Your plan is to move historical data to Cloudflare R2 as Parquet files
- **WHERE TO MAKE CHANGES:** This table should eventually only hold recent candles (last 500 per symbol). Historical data goes to R2.

### `order.py` — ORDERS TABLE
- Fields: `id`, `user_id`, `symbol`, `trade_type`, `quantity`, `status`
- Represents pending orders before execution
- **WHERE TO MAKE CHANGES:** If you add limit orders, stop orders, or order queuing

### `post.py` — POSTS TABLE (BLOG/CMS)
- Fields: `id`, `title`, `summary`, `content`, `section`, `images`, `author`, `read_time`, `published`, `created_at`
- Sections: `economics`, `strategy`, `insights`
- **WHERE TO MAKE CHANGES:** If you add tags, categories, or user comments

### `strategy_log.py` — STRATEGY LOGS TABLE
- Fields: `id`, `user_id`, `symbol`, `signal`, `price`, `pnl`, `timestamp`
- Logs every strategy signal generated by the system

---

## **NEW TABLES YOU WILL NEED (FUTURE)**

| Table Name | Purpose |
|---|---|
| `model_runs` | Track each model training run (date, accuracy, hyperparameters, dataset version) |
| `backtests` | Store backtest results (strategy, metrics, equity curve data) |
| `signals` | Store every prediction signal with confidence, features used, and outcome |
| `feature_metadata` | Track which features were used for which model version |

---

## **SERVICES (BUSINESS LOGIC)**

All files in `/backend/services/`. This is where the real logic lives.

---

### `market_service.py` — LIVE PRICE FETCHING
- `get_current_price(symbol)` → First checks in-memory `live_prices` dict, falls back to Bybit REST API
- `get_historical_price(symbol, limit, interval)` → Fetches kline data from Bybit REST API with retry logic
- `seed_initial_data(symbol)` → Fetches 200 1-minute candles for initial seeding
- Currently ONLY supports Bybit (crypto)
- **WHERE TO MAKE CHANGES:** To add NSE stocks → add `get_nse_price()` using TrueData/Kite API. To add US stocks → add `get_nasdaq_price()` using Yahoo Finance or Polygon.io. Create a unified adapter interface so the rest of the code doesn't care which exchange it's talking to.

### `model_service.py` — BASIC ML MODEL (SINGLE ALGORITHM)
- Loads/trains a single RandomForest model
- Uses 4 features: `rsi`, `ema_fast`, `ema_slow`, `momentum`
- Trains on `dataset.csv` with `train_test_split(shuffle=True)` ⚠️ (data leakage for time-series)
- Returns: signal (BUY/SELL/HOLD), confidence %, class probabilities
- **WHERE TO MAKE CHANGES:** This file will be largely replaced when you build the XGBoost Model Router

### `enhanced_model_service.py` — MULTI-ALGORITHM ML
- Manages 3 models: RandomForest, SVM, LogisticRegression
- `train_all_models()` → Trains all 3 on `dataset.csv`, saves as `.pkl` files
- `predict_with_model(algorithm_name, feature)` → Makes prediction with a specific model
- `load_model(algorithm_name)` → Loads a `.pkl` file into memory
- ⚠️ Hardcoded accuracy fallback values (66.03%, 60.16%, 60.0%)
- ⚠️ Uses `shuffle=True` in train/test split (time-series data leakage)
- **WHERE TO MAKE CHANGES:** Replace all 3 models with XGBoost. Implement per-timeframe models. Remove hardcoded accuracies. Use walk-forward validation instead of random split.

### `consensus_service.py` — MODEL VOTING ENGINE
- Takes predictions from all 3 models, counts votes (BUY/SELL/HOLD)
- Calculates consensus strength (STRONG/MODERATE/WEAK)
- Uses model accuracy as weight for tie-breaking
- Generates human-readable explanation of the decision
- Tracks dynamic model performance over time
- **WHERE TO MAKE CHANGES:** When you switch to per-timeframe models, update this to aggregate across timeframes (1m, 5m, 1h, 1d) instead of across algorithms

### `feature_service.py` — TECHNICAL INDICATOR CALCULATION
- `calculate_rsi(closes, period=14)` → Relative Strength Index
- `calculate_ema(prices, period=10)` → Exponential Moving Average
- `build_features(candles)` → Combines RSI + EMA fast + EMA slow + momentum into feature dicts
- `get_recent_candles(symbol, limit=50)` → Fetches latest candles from PostgreSQL
- Currently only 4 features: RSI, EMA fast (10), EMA slow (20), momentum
- **WHERE TO MAKE CHANGES:** Add ATR (14), VWAP distance, rolling volatility, volume ratio, hour_of_day, day_of_week, symbol_id. These are the features your new XGBoost models will need.

### `trade_services.py` — TRADE EXECUTION ENGINE (LARGEST FILE: 404 LINES)
- `add_trade()` → Main trade execution. Gets live price, applies random slippage (0.1%-0.5%), handles BUY/SELL/SHORT, deducts from wallet, creates Trade record, updates Position
- `get_user_trades()` → Fetch all trades for a user
- `get_trades_with_pnl()` → Fetch trades with real-time P&L calculation
- `get_performance()` → Calculate win rate, total profit/loss, best/worst trade
- `get_portfolio()` → Group trades by symbol, calculate portfolio value
- `close_trade()` → Close an open trade at exit price, calculate P&L
- `get_account_summary()` → Overall account statistics
- `create_order()` → Create a pending order (not yet executed)
- **WHERE TO MAKE CHANGES:** Add trading fees simulation, add realistic slippage models, add trade logging to `strategy_logs`

### `position_service.py` — POSITION MANAGEMENT
- `update_position()` → Handles BUY (add to position), SELL (reduce/close position), SHORT (create negative position)
- `calculate_pnl_for_position()` → Unrealized P&L for open positions
- `get_portfolio_summary()` → Complete portfolio with realized + unrealized P&L
- **WHERE TO MAKE CHANGES:** If you add margin requirements, leverage limits, or position size rules

### `auto_trading_service.py` — AUTOMATED TRADING ENGINE
- `start_auto_trading(user_id, config)` → Stores trading config for a user
- `stop_auto_trading(user_id)` → Disables auto trading
- `process_signals()` → Loops through all active auto-traders, fetches candles, computes features, gets consensus signal, checks thresholds, executes trade
- Rate limiting: `max_trades_per_hour` configurable
- ⚠️ Currently runs in-process (dies when server restarts or tab closes)
- **WHERE TO MAKE CHANGES:** Move the execution loop to a background worker. Add the symbol selector from the frontend config. Add timeframe-aware signal generation.

### `scheduler_service.py` — BACKGROUND JOB SCHEDULER
- Uses APScheduler to run jobs at intervals
- `auto_trade()` → Runs every 5 minutes (currently disabled)
- `check_exit_conditions()` → Runs every 10 seconds (currently disabled)
- ⚠️ Both jobs are commented out in `main.py`
- ⚠️ Hardcoded symbols: `["AAPL", "MSFT", "GOOGL"]` — doesn't match the crypto platform
- **WHERE TO MAKE CHANGES:** Re-enable with correct symbols. Later replace APScheduler with Redis-based task queue (Celery or ARQ) for production reliability.

### `strategy_services.py` — STRATEGY LOGIC
- `compute_sma()`, `compute_ema()`, `compute_rsi()` → Duplicate implementations of indicators (also exist in `feature_service.py`)
- `generate_signal()` → Old EMA crossover strategy (marked as not used)
- `generate_signal_from_features()` → Current strategy: averages last 10 features, checks bullish/bearish conditions
- `log_strategy()` → Logs strategy decisions
- ⚠️ Contains duplicate indicator functions that also exist in `feature_service.py`
- **WHERE TO MAKE CHANGES:** Remove duplicate indicator functions. Keep strategy logic here but use `feature_service.py` for all indicator calculations.

### `analytics_service.py` — TRADE ANALYTICS
- Provides analytics data for the portfolio WebSocket endpoint

### `paper_trading_services.py` — PAPER TRADING HELPERS
- Additional paper trading utility functions

### `candle_builder.py` / `candle_engine.py` / `candle_service.py` — CANDLE PROCESSING
- `candle_engine.py` → `process_tick()`: processes incoming price ticks into OHLCV candles
- `candle_builder.py` → `update_candle()`, `should_close_candle()`, `reset_candle()`: manages candle lifecycle
- `candle_service.py` → `save_candle()`: persists completed candles to PostgreSQL

### `portfolio_service.py` — PORTFOLIO CALCULATIONS
- Portfolio value tracking and calculations

### `pnl_service.py` — P&L CALCULATIONS
- Profit and loss computation utilities

### `execution_engine.py` — ORDER EXECUTION
- Order execution logic

### `dataset_service.py` — DATASET MANAGEMENT
- Manages the training dataset

### `indicator_service.py` — INDICATOR CALCULATIONS
- Yet another set of indicator calculations (⚠️ duplication)

### `history_service.py` — TRADE HISTORY
- Historical trade data retrieval

### `alert_service.py` — NOTIFICATIONS
- Currently a placeholder (70 bytes)

### `trade_monitor.py` — TRADE MONITORING
- Monitors active trades for exit conditions

### `user_service.py` — USER MANAGEMENT
- User-related business logic

---

## **ROUTES (API ENDPOINTS)**

All files in `/backend/routes/`. Each file exposes a set of HTTP endpoints.

| Route File | Prefix | Key Endpoints |
|---|---|---|
| `user_routes.py` | `/` | `POST /register`, `POST /login` |
| `trade_routes.py` | `/` | `GET /trades`, `GET /signal/{symbol}`, `GET /signal/{symbol}/compare`, `GET /signal/{symbol}/consensus` |
| `market_routes.py` | `/` | `GET /market/{symbol}`, `GET /market/history/{symbol}` |
| `portfolio_routes.py` | `/` | `GET /portfolio` |
| `manual_trade_routes.py` | `/api` | `POST /api/manual-trade` |
| `wallet_routes.py` | `/api` | `GET /api/wallet`, `POST /api/wallet/reset` |
| `auto_trading_routes.py` | `/api` | `POST /api/auto-trading/start`, `POST /api/auto-trading/stop`, `GET /api/auto-trading/status` |
| `post_routes.py` | `/api` | `GET /api/posts`, `POST /api/posts`, `DELETE /api/posts/{id}` |
| `train_routes.py` | `/` | `POST /train` |
| `enhanced_train_routes.py` | `/api` | `POST /api/enhanced-train` |
| `bulk_seed_routes.py` | `/api` | `POST /api/bulk-seed` |
| `candle_seed_routes.py` | `/api` | `POST /api/seed-candles` |
| `analytics_routes.py` | `/api` | `GET /api/analytics` |
| `backtest_routes.py` | `/` | `POST /backtest` |
| `pnl_routes.py` | `/` | `GET /pnl` |
| `history_routes.py` | `/` | `GET /history` |
| `strategy_routes.py` | `/` | `GET /strategy` |
| `feature_routes.py` | `/` | `GET /features` |

---

## **CORE & UTILS**

### `core/auth.py` — JWT AUTHENTICATION
- Decodes JWT token, extracts `user_id`
- ⚠️ Secret key hardcoded: `"journaldecoded_super_secret_key"`

### `core/state.py` — GLOBAL STATE
- Single line: `live_prices = {}`
- In-memory dictionary storing latest prices from WebSocket
- ⚠️ Lost on every server restart. Replace with Redis in production.

### `core/config.py` — CONFIGURATION
- Currently empty

### `utils/security.py` — PASSWORD HASHING
- bcrypt hash and verify functions

### `utils/dependencies.py` — FASTAPI DEPENDENCIES
- Dependency injection helpers for routes

### `utils/logger.py` — LOGGING
- Basic logging configuration

### `schemas/trade_schema.py` — PYDANTIC SCHEMAS
- `TradeRequest`: validates `symbol`, `quantity`, `trade_type`
- ⚠️ Only 1 schema exists. Most routes accept raw dicts without validation.

---

---

# **FRONTEND — FILE BY FILE**

All frontend code lives in `/frontend/src/`.

---

## **CORE FILES**

### `App.js` — ROUTER
- Defines ALL page routes using React Router
- Wraps everything in `<MainLayout>`
- ⚠️ Contains test/debug routes accessible in production: `/test-auth`, `/api-test`, `/test-login`, `/simple-dashboard`

### `config.js` — API CONFIGURATION
- `API_BASE_URL` → from `REACT_APP_API_URL` env variable (falls back to `localhost:8000`)
- `WS_BASE_URL` → auto-derived: converts `https://` to `wss://`

### `utils/api.js` — AXIOS HTTP CLIENT
- Creates Axios instance with base URL
- Request interceptor: attaches JWT token from localStorage to every request
- Response interceptor: on 401 error, clears token and redirects to `/login`
- ⚠️ Contains `console.log()` statements that print tokens and request details in production

---

## **LAYOUTS**

### `layouts/MainLayout.js` — GLOBAL LAYOUT
- Sticky top navigation bar with links (Home, Strategy Lab, Insights, Blog)
- Auth-dependent links (Dashboard, AI Signals, Login/Logout)
- Mobile hamburger menu with animated transitions
- TradingView TickerTape widget (scrolling live prices)
- Footer

---

## **PAGES**

### `pages/Home.js` — LANDING PAGE
- Hero section with "JournalDecoded" headline
- TradingView Advanced Real-Time Chart (BTC/USDT, Daily candles)
- Feature grid: Strategy Lab, Macro Intelligence, Risk Architecture
- TradingView Screener widget (crypto market)
- Metrics banner (Active Models, Monitoring, Latency, Systematic)

### `pages/Dashboard.js` — TRADING ENGINE (PROTECTED)
- "Swing Trading Engine" control panel with balance display
- Trading mode selector: Manual / Auto
- Auto-Trading controls: symbol dropdown (BTC, ETH, SOL, BNB, ADA), Start/Pause/Stop buttons
- Macro Strategy Settings panel (shows timeframe, target asset, risk level)
- Local Execution Mode warning banner
- LiveMarket component (WebSocket price feed)
- PaperTradeForm component (manual trade execution)
- SignalPanel component
- Stat cards: Total Trades, Total P&L, Win Rate
- Equity Curve chart (Recharts LineChart)
- Trade History table

### `pages/TradingSignals.js` — MACRO TREND PREDICTIONS
- Symbol selector dropdown (12 crypto pairs)
- Algorithm selector (RandomForest, SVM, LogisticRegression)
- Compare All Algorithms mode with consensus display
- Daily/4H Trend Forecast display with voting breakdown
- Technical Indicators panel (Price, RSI, EMA, Momentum)
- Recent Analysis table (last 5 periods)
- System Status panel (Market Feed, Macro Models, Timeframe Focus)

### `pages/StrategyLab.js` — STRATEGY RESEARCH SANDBOX
- TradingView Advanced Chart with Moving Average and RSI pre-loaded
- PostGrid component showing "strategy" section posts below the chart

### `pages/Login.js` — AUTHENTICATION
- Login form with username/password
- Register form toggle
- JWT token stored in localStorage on success

### `pages/AdminPanel.js` — CONTENT MANAGEMENT
- Create new posts with title, summary, content, section, images
- Section selector: Economics, Strategy Lab, Insights
- Lists all existing posts with delete functionality

### `pages/PostDetail.js` — INDIVIDUAL POST VIEW
- Displays full post content with images
- Admin-only delete button with confirmation state

### `pages/Economics.js` — BLOG SECTION
- PostGrid filtered to `section="economics"`

### `pages/Insights.js` — BLOG SECTION
- PostGrid filtered to `section="insights"`

### `pages/APITest.js`, `TestAuth.js`, `TestLogin.js`, `SimpleDashboard.js`
- Debug/test pages. Should be removed from production routes.

---

## **COMPONENTS**

### `components/LiveMarket.js` — WEBSOCKET PRICE DISPLAY
- Connects to backend WebSocket `/ws/market/{symbol}`
- Shows live price, connection status
- Symbol input with Load button
- **WHERE TO MAKE CHANGES:** Add support for multiple symbols simultaneously

### `components/PaperTradeForm.js` — MANUAL TRADE FORM
- Symbol input, trade type dropdown (BUY/SELL/SHORT), quantity input
- Executes via `POST /api/manual-trade`
- Shows current wallet balance
- Disabled state when Auto Trading is active

### `components/SignalPanel.js` — SIGNAL SUMMARY WIDGET
- Displays latest AI signal in a compact card

### `components/PostGrid.js` — POST LISTING
- Fetches posts by section from `/api/posts?section=X`
- Displays in responsive grid with uniform 16:9 image containers

### `components/ProtectedRoute.js` — AUTH GUARD
- Checks for JWT token in localStorage
- Redirects to `/login` if not authenticated

---

---

# **KNOWN TECHNICAL DEBT (PRIORITIZED)**

## 🔴 **CRITICAL — FIX FIRST**
1. **Hardcoded database credentials** in `backend/database.py` line 8
2. **Hardcoded JWT secret** in `backend/core/auth.py` line 7
3. **CORS allows all origins** in `backend/main.py` line 41

## 🟡 **HIGH — FIX BEFORE SCALING**
4. **Duplicate balance fields** — `User.balance` and `Wallet.balance` both exist
5. **In-memory state** — `live_prices = {}` lost on restart, can't scale horizontally
6. **ML models stored in Git** — 9.5MB+ binary files in every clone
7. **`shuffle=True` for time-series** — causes data leakage in model training
8. **Blocking I/O in async context** — startup seeding uses `requests.get()` in threads
9. **Debug prints with sensitive data** — tokens and balances printed to server logs

## 🟢 **MEDIUM — CLEAN UP WHEN POSSIBLE**
10. **Test pages in production** — `/test-auth`, `/api-test`, `/test-login`
11. **Only 1 Pydantic schema** — most routes lack input validation
12. **Duplicate indicator functions** — `strategy_services.py` and `feature_service.py` both compute RSI/EMA
13. **Hardcoded symbols** in scheduler — `["AAPL", "MSFT", "GOOGL"]`
14. **Scheduler disabled** — both background jobs are commented out

---

---

# **NEXT-GEN FEATURES — WHERE TO ADD THEM**

| Feature | New Files to Create | Existing Files to Modify |
|---|---|---|
| **XGBoost Models** | `services/model_router.py` | `enhanced_model_service.py`, `feature_service.py` |
| **Walk-Forward Backtest** | `services/backtest_engine.py`, `models/backtest.py` | `routes/backtest_routes.py` |
| **Cloudflare R2 Storage** | `services/r2_client.py`, `services/data_ingestion.py` | `market_service.py` |
| **NSE/NASDAQ Support** | `services/data_vendors.py` | `market_service.py`, `feature_service.py` |
| **RAG Intelligence** | `services/rag_service.py`, `services/explanation_service.py`, `routes/intelligence_routes.py` | — |
| **Redis Cache** | — (install redis-py) | `core/state.py` → replace dict with Redis |
| **Background Workers** | — (install celery or arq) | `scheduler_service.py`, `auto_trading_service.py` |
