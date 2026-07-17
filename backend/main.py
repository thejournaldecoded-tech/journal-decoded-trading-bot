from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from fastapi.middleware.cors import CORSMiddleware
import asyncio
import websockets
import json
import ssl
import certifi


from routes import trade_routes, user_routes, market_routes, portfolio_routes,history_routes, backtest_routes, pnl_routes, analytics_routes, strategy_routes,feature_routes
from routes.bulk_seed_routes import router as bulk_seed_router
from routes.enhanced_train_routes import router as enhanced_train_router
from routes.candle_seed_routes import router as candle_seed_router
from routes.auto_trading_routes import router as auto_trading_router
from routes.wallet_routes import router as wallet_router
from routes.manual_trade_routes import router as manual_trade_router
# from bot.scheduler import start_bot # tempo disable

from models.base import Base
from database import engine, SessionLocal

# from services.scheduler_service import start_scheduler
from services.analytics_service import get_trade_analytics
from services.candle_service import save_candle
from services.candle_builder import update_candle,should_close_candle,reset_candle
from core.state import live_prices
from services.candle_engine import process_tick
from routes.train_routes import router as train_router

from models.candle import Candle

app = FastAPI()

#cors part for frt bck end communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create database tables
Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def startup_event():
    print("Starting background services...")
    # start_bot()
    # start_scheduler()



@app.websocket("/ws/market/{symbol}")
async def websocket_market(websocket: WebSocket, symbol: str):
    await websocket.accept()

    binance_symbol = symbol.lower()
    url = f"wss://stream.binance.com:9443/ws/{binance_symbol}@ticker"

    ssl_context = ssl.create_default_context(cafile=certifi.where())

    candle_data = {}

    try:
        async with websockets.connect(url, ssl=ssl_context) as ws:

            while True:
             
                    message = await ws.recv()
                    data = json.loads(message)

                    price = float(data["c"])
                    symbol_upper = symbol.upper()

                    print("Incoming price:", price)

                    # store live price
                    live_prices[symbol_upper] = price

                    #  candle logic 
                    process_tick(symbol_upper, price)

                    await websocket.send_json({
                        "symbol": symbol_upper,
                        "price": price
                    })


                    await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Client Disconnected safely")
    
    except Exception as e:
        print("ERROR: " , e)
            
        
            

@app.websocket("/ws/portfolio/{user_id}")
async def websocket_portfolio(websocket: WebSocket, user_id: int):
    await websocket.accept()
    try:
        while True:
            data= get_trade_analytics(user_id)
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except Exception as e:
        print(f"Portfolio WS closed: {e}")                                      


# routers
app.include_router(trade_routes.router)
app.include_router(user_routes.router)
app.include_router(market_routes.router)
app.include_router(portfolio_routes.router)
app.include_router(history_routes.router)
app.include_router(backtest_routes.router)
app.include_router(pnl_routes.router)
app.include_router(analytics_routes.router, prefix="/api")
app.include_router(strategy_routes.router)
app.include_router(feature_routes.router)
app.include_router(train_router)
app.include_router(bulk_seed_router, prefix="/api", tags=["bulk"])
app.include_router(enhanced_train_router, prefix="/api", tags=["enhanced"])
app.include_router(candle_seed_router, prefix="/api", tags=["candle"])
app.include_router(auto_trading_router, prefix="/api", tags=["auto-trading"])
app.include_router(wallet_router, prefix="/api", tags=["wallet"])
app.include_router(manual_trade_router, prefix="/api", tags=["manual-trade"])

@app.get("/")
def root():
    return {"message": "JournalDecoded Backend Running"}