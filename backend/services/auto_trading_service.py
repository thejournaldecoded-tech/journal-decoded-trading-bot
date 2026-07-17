import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional
from services.consensus_service import consensus_service
from services.trade_services import add_trade
from database import SessionLocal
from models.user import User
from models.wallet import Wallet
from schemas.trade_schema import TradeRequest

logger = logging.getLogger(__name__)

class AutoTradingService:
    """Service to handle automatic trading based on AI signals"""
    
    def __init__(self):
        self.is_running = False
        self.auto_traders = {}  # user_id: auto_trading_config
        self.last_signals = {}  # user_id: last_processed_signal
        
    def start_auto_trading(self, user_id: int, config: Dict):
        """Start auto trading for a user"""
        self.auto_traders[user_id] = {
            'enabled': True,
            'symbols': config.get('symbols', ['BTCUSDT']),
            'min_confidence': config.get('min_confidence', 60),
            'min_accuracy': config.get('min_accuracy', 60),
            'position_size': config.get('position_size', 5),  # percentage
            'max_trades_per_hour': config.get('max_trades_per_hour', 5),
            'risk_level': config.get('risk_level', 'medium'),
            'trade_count': 0,
            'last_trade_time': None
        }
        logger.info(f"Auto trading started for user {user_id}")
        
    def stop_auto_trading(self, user_id: int):
        """Stop auto trading for a user"""
        if user_id in self.auto_traders:
            self.auto_traders[user_id]['enabled'] = False
        logger.info(f"Auto trading stopped for user {user_id}")
        
    def get_auto_trading_status(self, user_id: int) -> Optional[Dict]:
        """Get auto trading status for a user"""
        return self.auto_traders.get(user_id)
        
    async def process_signals(self):
        """Process signals for all active auto traders"""
        if not self.is_running:
            return
            
        for user_id, config in self.auto_traders.items():
            if not config['enabled']:
                continue
                
            try:
                await self._process_user_signals(user_id, config)
            except Exception as e:
                logger.error(f"Error processing signals for user {user_id}: {e}")
                
    async def _process_user_signals(self, user_id: int, config: Dict):
        """Process signals for a specific user"""
        db = SessionLocal()
        try:
            # Check rate limiting
            if self._is_rate_limited(config):
                return
                
            # Get user wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            if not wallet or wallet.balance <= 0:
                return
                
            # Process each symbol
            for symbol in config['symbols']:
                await self._process_symbol_signal(user_id, symbol, config, wallet, db)
                
        except Exception as e:
            logger.error(f"Error in _process_user_signals: {e}")
        finally:
            db.close()
            
    async def _process_symbol_signal(self, user_id: int, symbol: str, config: Dict, wallet: Wallet, db):
        """Process signal for a specific symbol"""
        try:
            # Get consensus signal
            from services.enhanced_model_service import predict_with_model
            from services.feature_service import get_recent_candles, build_features
            
            candles = get_recent_candles(symbol, limit=50)
            if not candles:
                return
                
            features = build_features(candles)
            if not features or len(features) < 5:
                return
                
            last_5 = features[-5:]
            latest_feature = last_5[-1]
            
            # Get predictions from all algorithms
            algorithms = ["RandomForest", "SVM", "LogisticRegression"]
            predictions = {}
            
            for algo in algorithms:
                pred = predict_with_model(algo, latest_feature)
                predictions[algo] = pred
                
            # Get consensus decision
            consensus = consensus_service.get_consensus_signal(predictions)
            
            # Check if signal meets criteria
            if not self._should_trade(consensus, config):
                return
                
            # Execute trade
            await self._execute_auto_trade(user_id, symbol, consensus, config, wallet, db)
            
        except Exception as e:
            logger.error(f"Error processing signal for {symbol}: {e}")
            
    def _should_trade(self, consensus: Dict, config: Dict) -> bool:
        """Check if signal meets trading criteria"""
        # Check confidence threshold
        if consensus['weighted_confidence'] < config['min_confidence']:
            return False
            
        # Check model accuracy threshold
        if consensus['individual_predictions']:
            avg_accuracy = sum(pred.get('model_accuracy', 0) for pred in consensus['individual_predictions'].values()) / len(consensus['individual_predictions'])
            if avg_accuracy < config['min_accuracy']:
                return False
                
        # Check consensus strength
        if consensus['consensus_strength'] == 'WEAK' and config['risk_level'] == 'low':
            return False
            
        return True
        
    def _is_rate_limited(self, config: Dict) -> bool:
        """Check if user is rate limited"""
        if config['max_trades_per_hour'] <= 0:
            return False
            
        now = datetime.now()
        if config['last_trade_time']:
            time_diff = (now - config['last_trade_time']).total_seconds()
            if time_diff < 3600 / config['max_trades_per_hour']:  # Not enough time passed
                return True
                
        return False
        
    async def _execute_auto_trade(self, user_id: int, symbol: str, consensus: Dict, config: Dict, wallet: Wallet, db):
        """Execute automatic trade"""
        try:
            signal = consensus['consensus_signal']
            
            # Calculate position size
            position_value = wallet.balance * (config['position_size'] / 100)
            
            # Get current price
            from services.market_service import get_current_price
            current_price = get_current_price(symbol)
            if not current_price:
                return
                
            quantity = int(position_value / current_price)
            if quantity <= 0:
                return
                
            # Determine trade type
            if signal == 'BUY':
                trade_type = 'BUY'
            elif signal == 'SELL':
                trade_type = 'SHORT'  # Use short selling for SELL signals
            else:
                return  # Skip HOLD signals
                
            # Create trade request
            trade_data = TradeRequest(
                symbol=symbol,
                quantity=quantity,
                trade_type=trade_type
            )
            
            # Execute trade
            trade = add_trade(trade_data, user_id, db)
            
            # Update config
            config['trade_count'] += 1
            config['last_trade_time'] = datetime.now()
            
            logger.info(f"Auto trade executed: {trade_type} {quantity} {symbol} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error executing auto trade: {e}")

# Global auto trading service instance
auto_trading_service = AutoTradingService()
