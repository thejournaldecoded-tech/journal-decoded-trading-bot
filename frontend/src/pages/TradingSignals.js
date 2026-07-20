import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

function TradingSignals() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [algorithm, setAlgorithm] = useState('RandomForest');
  const [signal, setSignal] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparison, setComparison] = useState(null);

  const fetchSignal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (compareMode) {
        const response = await api.get(`/signal/${symbol}/compare`);
        setComparison(response.data);
      } else {
        // Use consensus endpoint for unified decision
        const response = await api.get(`/signal/${symbol}/consensus`);
        setSignal(response.data);
        setFeatures(response.data.features);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch signal');
    } finally {
      setLoading(false);
    }
  }, [symbol, compareMode]);

  // Initial fetch when component loads and when symbol changes
  useEffect(() => {
    fetchSignal();
  }, [fetchSignal]);

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      case 'HOLD': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Macro Trend Predictions</h1>
        
        {/* Symbol and Algorithm Selector */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Symbol</label>
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 w-full max-w-xs"
            >
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="ADAUSDT">ADA/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
              <option value="BNBUSDT">BNB/USDT</option>
              <option value="XRPUSDT">XRP/USDT</option>
              <option value="DOGEUSDT">DOGE/USDT</option>
              <option value="AVAXUSDT">AVAX/USDT</option>
              <option value="DOTUSDT">DOT/USDT</option>
              <option value="MATICUSDT">MATIC/USDT</option>
              <option value="LINKUSDT">LINK/USDT</option>
              <option value="UNIUSDT">UNI/USDT</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ML Algorithm</label>
            <select 
              value={algorithm} 
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 w-full max-w-xs"
            >
              <option value="RandomForest">Random Forest (66.03% Acc)</option>
              <option value="SVM">Support Vector Machine (60.16% Acc)</option>
              <option value="LogisticRegression">Logistic Regression (60.0% Acc)</option>
            </select>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-lg mr-4 ${
              compareMode ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {compareMode ? 'Single Mode' : 'Compare All Algorithms'}
          </button>
          
          <button
            onClick={() => setShowModelInfo(!showModelInfo)}
            className="px-4 py-2 rounded-lg bg-gray-700"
          >
            {showModelInfo ? 'Hide' : 'Show'} Model Info
          </button>
        </div>

        {/* Model Information */}
        {showModelInfo && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">ML Algorithm Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">Random Forest</h4>
                <p className="text-sm text-gray-300 mb-2">Ensemble method using multiple decision trees</p>
                <div className="text-xs text-gray-400">
                  <p>✅ Handles non-linear patterns</p>
                  <p>✅ Robust to outliers</p>
                  <p>❌ Can be slower</p>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Support Vector Machine</h4>
                <p className="text-sm text-gray-300 mb-2">Finds optimal hyperplane for classification</p>
                <div className="text-xs text-gray-400">
                  <p>✅ Effective in high dimensions</p>
                  <p>✅ Memory efficient</p>
                  <p>❌ Sensitive to parameters</p>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">Logistic Regression</h4>
                <p className="text-sm text-gray-300 mb-2">Linear model for classification</p>
                <div className="text-xs text-gray-400">
                  <p>✅ Fast training</p>
                  <p>✅ Highly interpretable</p>
                  <p>❌ Linear relationships only</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signal Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Signal */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Daily/4H Trend Forecast</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-blue-400 text-sm mb-2">
                  🔄 Calculating probabilities...
                </div>
                <p className="text-gray-400 text-xs">Forecasts updated based on Macro timeframes</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">⚠️ Error</div>
                <p className="text-gray-400">{error}</p>
              </div>
            ) : compareMode && comparison ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center mb-4">Algorithm Comparison</h3>
                
                {/* Consensus Result */}
                {comparison.consensus && (
                  <div className="bg-gray-900 rounded-xl p-6 border-2 border-blue-500">
                    <div className="text-center mb-4">
                      <div className={`text-3xl font-bold mb-2 ${getSignalColor(comparison.consensus.consensus_signal)}`}>
                        {comparison.consensus.consensus_signal}
                      </div>
                      <div className={`text-lg font-semibold ${
                        comparison.consensus.consensus_strength === 'STRONG' ? 'text-green-400' :
                        comparison.consensus.consensus_strength === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {comparison.consensus.consensus_strength} Consensus
                      </div>
                      <div className="text-sm text-gray-400">
                        Weighted Confidence: {comparison.consensus.weighted_confidence}%
                      </div>
                    </div>
                    
                    {/* Consensus Explanation */}
                    <div className="mt-4 p-3 bg-gray-800 rounded text-left">
                      <div className="text-sm font-semibold text-gray-300 mb-2">📊 Decision Analysis:</div>
                      <div className="text-xs text-gray-400 whitespace-pre-line">
                        {comparison.consensus.explanation}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Individual Model Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(comparison.predictions).map(([algo, pred]) => (
                    <div key={algo} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm truncate flex-1">{algo}</span>
                        <span className={`text-lg font-bold ml-2 ${getSignalColor(pred.signal)}`}>
                          {pred.signal}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Confidence: {pred.confidence}% | Accuracy: {pred.model_accuracy}%
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                        <span className="text-green-400 text-center">BUY: {pred.probabilities.BUY}%</span>
                        <span className="text-red-400 text-center">SELL: {pred.probabilities.SELL}%</span>
                        <span className="text-yellow-400 text-center">HOLD: {pred.probabilities.HOLD}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Traditional Strategy */}
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <div className="text-sm text-gray-400 mb-1">Traditional Strategy:</div>
                  <div className={`text-lg font-bold ${getSignalColor(comparison.strategy_signal)}`}>
                    {comparison.strategy_signal}
                  </div>
                  {comparison.consensus && comparison.consensus.consensus_signal !== comparison.strategy_signal && (
                    <div className="text-xs text-yellow-400 mt-1">
                      ⚠️ Consensus differs from Traditional - Follow consensus recommendation
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={fetchSignal}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  Refresh Comparison
                </button>
              </div>
            ) : !loading && !signal ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg">No signal loaded yet</p>
                  <p className="text-sm mt-2">Click "Refresh Now" to fetch trading signals</p>
                </div>
                <button 
                  onClick={fetchSignal}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  Refresh Now
                </button>
              </div>
            ) : signal ? (
              <div className="text-center py-8">
                <div className={`text-4xl font-bold mb-4 ${getSignalColor(signal.consensus_signal || signal.ai_signal)}`}>
                  {signal.consensus_signal || signal.ai_signal}
                </div>
                
                {/* Consensus Information */}
                {signal.consensus_strength && (
                  <div className="mb-4">
                    <div className={`text-lg font-semibold mb-2 ${
                      signal.consensus_strength === 'STRONG' ? 'text-green-400' :
                      signal.consensus_strength === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {signal.consensus_strength} Consensus
                    </div>
                    <div className="text-sm text-gray-400">
                      Weighted Confidence: {signal.weighted_confidence}%
                    </div>
                  </div>
                )}
                
                {/* Voting Breakdown */}
                {signal.voting_breakdown && (
                  <div className="mb-4 space-y-1">
                    <div className="text-sm font-semibold text-gray-300 mb-2">Model Voting:</div>
                    {Object.entries(signal.voting_breakdown).map(([model, vote]) => (
                      <div key={model} className="flex justify-between text-sm">
                        <span>{model}:</span>
                        <span className={getSignalColor(vote)}>{vote}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Consensus Explanation */}
                {signal.explanation && (
                  <div className="mb-4 p-3 bg-gray-800 rounded text-left">
                    <div className="text-sm font-semibold text-gray-300 mb-2">📊 Decision Analysis:</div>
                    <div className="text-xs text-gray-400 whitespace-pre-line">
                      {signal.explanation}
                    </div>
                  </div>
                )}
                
                {/* Strategy vs Consensus Comparison */}
                {signal.strategy_signal && signal.consensus_signal && (
                  <div className="mb-4 p-3 bg-gray-800 rounded">
                    <div className="text-sm text-gray-400 mb-1">Traditional Strategy:</div>
                    <div className={`text-lg font-bold ${getSignalColor(signal.strategy_signal)}`}>
                      {signal.strategy_signal}
                    </div>
                    {signal.consensus_signal !== signal.strategy_signal && (
                      <div className="text-xs text-yellow-400 mt-1">
                        ⚠️ Consensus differs from Traditional - Follow consensus recommendation
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-gray-400 mb-2">Symbol: {signal.symbol}</p>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
                <button 
                  onClick={fetchSignal}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  Refresh Now
                </button>
              </div>
            ) : null}
          </div>

          {/* Technical Indicators */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Technical Indicators</h2>
            {features && features.length > 0 ? (
              <div className="space-y-4">
                {features.slice(-1).map((feature, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Price:</span>
                      <span className="font-mono">${feature.close.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RSI (14):</span>
                      <span className={`font-mono ${feature.rsi > 70 ? 'text-red-500' : feature.rsi < 30 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {feature.rsi.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EMA Fast (10):</span>
                      <span className="font-mono">${feature.ema_fast.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EMA Slow (20):</span>
                      <span className="font-mono">${feature.ema_slow.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Momentum:</span>
                      <span className={`font-mono ${feature.momentum > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {feature.momentum > 0 ? '+' : ''}{feature.momentum.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EMA Signal:</span>
                      <span className={`font-mono ${feature.ema_signal > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {feature.ema_signal > 0 ? 'BULLISH' : 'BEARISH'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No technical data available
              </div>
            )}
          </div>
        </div>

        {/* Historical Features */}
        {features && features.length > 1 && (
          <div className="mt-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Recent Analysis (Last 5 periods)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4">Price</th>
                    <th className="text-left py-2 px-4">RSI</th>
                    <th className="text-left py-2 px-4">EMA Fast</th>
                    <th className="text-left py-2 px-4">EMA Slow</th>
                    <th className="text-left py-2 px-4">Momentum</th>
                    <th className="text-left py-2 px-4">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {features.slice(-5).reverse().map((feature, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-2 px-4 font-mono">${feature.close.toFixed(2)}</td>
                      <td className={`py-2 px-4 font-mono ${feature.rsi > 70 ? 'text-red-500' : feature.rsi < 30 ? 'text-green-500' : 'text-gray-400'}`}>
                        {feature.rsi.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 font-mono">${feature.ema_fast.toFixed(2)}</td>
                      <td className="py-2 px-4 font-mono">${feature.ema_slow.toFixed(2)}</td>
                      <td className={`py-2 px-4 font-mono ${feature.momentum > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {feature.momentum > 0 ? '+' : ''}{feature.momentum.toFixed(2)}
                      </td>
                      <td className={`py-2 px-4 font-mono ${feature.ema_signal > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {feature.ema_signal > 0 ? 'BULL' : 'BEAR'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Data Status */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">🟢 Stable</div>
              <p className="text-gray-400">Market Data Feed</p>
            </div>
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">🤖 Active</div>
              <p className="text-gray-400">Macro Models</p>
            </div>
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">📅 4H / 1D</div>
              <p className="text-gray-400">Timeframe Focus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingSignals;
