import PaperTradeForm from "../components/PaperTradeForm";
import SignalPanel from "../components/SignalPanel";
import LiveMarket from "../components/LiveMarket";
import { useEffect, useState } from "react";
import { api } from "../utils/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [pnlData, setPnlData] = useState([]);
  const [tradingMode, setTradingMode] = useState('manual');
  const [autoTradingStatus, setAutoTradingStatus] = useState('stopped');
  const [accountBalance, setAccountBalance] = useState(10000);
  const [autoTradingConfig, setAutoTradingConfig] = useState({
    enabled: false,
    symbols: ['BTCUSDT'],
    min_confidence: 60,
    min_accuracy: 60,
    position_size: 5,
    max_trades_per_hour: 5,
    risk_level: 'medium'
  });

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get("/api/wallet");
      if (res.data.status === "success") {
        setAccountBalance(res.data.wallet.balance);
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await api.get("/portfolio/");
      if (res.data.status === "success") {
        setAccountBalance(res.data.wallet_balance);
        setPnlData([{
          trade: "Current P&L",
          pnl: res.data.total_unrealized_pnl + res.data.total_realized_pnl
        }]);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    }
  };

  const fetchTrades = async () => {
    try {
      const res = await api.get("/trades");
      const data = res.data.data;
      setTrades(data);

      let cumulative = 0;
      const chartData = data.map((trade, index) => {
        cumulative += trade.pnl || 0;
        return {
          trade: `Trade ${index + 1}`,
          pnl: cumulative,
        };
      });
      setPnlData(chartData);
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  };

  const startAutoTrading = async () => {
    try {
      const config = { ...autoTradingConfig, enabled: true };
      const res = await api.post("/api/auto-trading/start", config);
      setAutoTradingStatus('running');
      setAutoTradingConfig(config);
      console.log("Auto trading started:", res.data);
    } catch (err) {
      console.error("Failed to start auto trading:", err);
    }
  };

  const stopAutoTrading = async () => {
    try {
      const res = await api.post("/api/auto-trading/stop");
      setAutoTradingStatus('stopped');
      setAutoTradingConfig(prev => ({ ...prev, enabled: false }));
      console.log("Auto trading stopped:", res.data);
    } catch (err) {
      console.error("Failed to stop auto trading:", err);
    }
  };

  const getAutoTradingStatus = async () => {
    try {
      const res = await api.get("/api/auto-trading/status");
      console.log("Auto trading status:", res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to get auto trading status:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchWalletBalance();
    fetchPortfolio();
  }, []);

  const totalTrades = trades.length;
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winRate =
    totalTrades > 0
      ? (
          (trades.filter((t) => t.pnl > 0).length / totalTrades) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="max-w-7xl mx-auto mt-12 space-y-10">

      {/* TRADING MODE CONTROLS */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Trading Control Panel</h2>
          <div className="text-2xl font-bold text-green-400">
            Balance: ${accountBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trading Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trading Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTradingMode('manual')}
                className={`px-4 py-2 rounded-lg ${
                  tradingMode === 'manual' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setTradingMode('auto')}
                className={`px-4 py-2 rounded-lg ${
                  tradingMode === 'auto' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Auto Trading Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Auto Trading</label>
            <div className="flex gap-2">
              <button
                onClick={startAutoTrading}
                className={`px-4 py-2 rounded-lg ${
                  autoTradingStatus === 'running' ? 'bg-green-600' : 'bg-gray-700'
                }`}
                disabled={tradingMode !== 'auto'}
              >
                Start
              </button>
              <button
                onClick={() => setAutoTradingStatus('paused')}
                className={`px-4 py-2 rounded-lg ${
                  autoTradingStatus === 'paused' ? 'bg-yellow-600' : 'bg-gray-700'
                }`}
                disabled={tradingMode !== 'auto'}
              >
                Pause
              </button>
              <button
                onClick={stopAutoTrading}
                className={`px-4 py-2 rounded-lg ${
                  autoTradingStatus === 'stopped' ? 'bg-red-600' : 'bg-gray-700'
                }`}
                disabled={tradingMode !== 'auto'}
              >
                Stop
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className={`px-4 py-2 rounded-lg text-center font-semibold ${
              tradingMode === 'auto' && autoTradingStatus === 'running' ? 'bg-green-800 text-green-300' :
              tradingMode === 'auto' && autoTradingStatus === 'paused' ? 'bg-yellow-800 text-yellow-300' :
              'bg-gray-800 text-gray-300'
            }`}>
              {tradingMode === 'auto' ? `Auto Trading: ${autoTradingStatus.toUpperCase()}` : 'Manual Trading'}
            </div>
          </div>
        </div>

        {/* Algorithm Settings for Auto Mode */}
        {tradingMode === 'auto' && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">🤖 Algorithm Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
              <div>• Min Confidence: 60%</div>
              <div>• Min Model Accuracy: 60%</div>
              <div>• Risk Level: Medium</div>
              <div>• Position Size: 5%</div>
            </div>
          </div>
        )}
      </div>

      {/* TOP GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        <LiveMarket />
        <PaperTradeForm 
          onTradeSuccess={() => {
            fetchTrades();
            fetchWalletBalance();
            fetchPortfolio();
          }} 
          onBalanceUpdate={setAccountBalance}
          disabled={tradingMode === 'auto'} 
        />
      </div>

      {/* SIGNAL */}
      <SignalPanel />

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-8">
        <StatCard title="Total Trades" value={totalTrades} />
        <StatCard
          title="Total P&L"
          value={totalPnL}
          color={totalPnL >= 0 ? "green" : "red"}
        />
        <StatCard title="Win Rate" value={`${winRate}%`} color="blue" />
      </div>

      {/* CHART */}
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">
          Equity Curve
        </h2>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">
          Trade History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-800 text-gray-400">
              <tr>
                <th className="py-3">Symbol</th>
                <th>Type</th>
                <th>Price</th>
                <th>Qty</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-gray-800 hover:bg-gray-800"
                >
                  <td className="py-3">{trade.symbol}</td>
                  <td>{trade.trade_type}</td>
                  <td>{trade.price}</td>
                  <td>{trade.quantity}</td>
                  <td
                    className={
                      trade.pnl >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {trade.pnl || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* 🔹 Reusable Stat Card */
function StatCard({ title, value, color = "white" }) {
  const colors = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    white: "text-white",
  };

  return (
    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
      <h3 className="text-gray-400">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}