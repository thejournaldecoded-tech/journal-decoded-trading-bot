import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function PaperTradeForm({ onTradeSuccess, disabled = false, onBalanceUpdate }) {
  const [symbol, setSymbol] = useState("");
  const [tradeType, setTradeType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [accountBalance, setAccountBalance] = useState(10000);

  const fetchBalance = async () => {
    try {
      const res = await api.get("/api/wallet");
      if (res.data.status === "success") {
        setAccountBalance(res.data.wallet.balance);
        if (onBalanceUpdate) onBalanceUpdate(res.data.wallet.balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/manual-trade", {
        symbol: symbol.toUpperCase(),
        trade_type: tradeType,
        quantity: parseFloat(quantity)
      });

      if (response.data.status === "success") {
        setSymbol("");
        setQuantity("");
        
        // Refresh balance after successful trade
        await fetchBalance();
        
        if (onTradeSuccess) onTradeSuccess();
        
        // Show success message with P&L if available
        const trade = response.data.trade;
        if (trade.pnl !== undefined) {
          const pnlText = trade.pnl >= 0 ? `Profit: $${trade.pnl.toFixed(2)}` : `Loss: $${Math.abs(trade.pnl).toFixed(2)}`;
          alert(`Trade executed successfully!\n${trade.trade_type} ${trade.quantity} ${trade.symbol}\n${pnlText}`);
        } else {
          alert(`Trade executed successfully!\n${trade.trade_type} ${trade.quantity} ${trade.symbol}`);
        }
      } else {
        alert(response.data.message || "Trade execution failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Trade execution failed");
    }
  };

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Execute Paper Trade
        </h2>
        <div className="text-lg md:text-xl font-bold text-green-400">
          Balance: ${accountBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
        </div>
      </div>
      
      {disabled && (
        <div className="mb-4 p-3 bg-yellow-800 rounded-lg text-yellow-300 text-sm">
          ⚠️ Manual trading disabled - Switch to Manual mode to enable
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-6">

        <p className="text-gray-400 text-sm md:col-span-4">
          Price will be executed at live market rate
        </p>

        <input
          type="text"
          placeholder="Symbol (e.g. AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="p-3 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
          required
          disabled={disabled}
        />

        <select
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          className="p-3 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
          disabled={disabled}
        >
          <option value="BUY">BUY (Long)</option>
          <option value="SELL">SELL (Close Position)</option>
          <option value="SHORT">SHORT (Short Sell)</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="p-3 w-full rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
          required
          disabled={disabled}
        />

        <button
          type="submit"
          className={`md:col-span-4 py-3 rounded-lg font-medium ${
            disabled 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={disabled}
        >
          {disabled ? 'Auto Trading Active' : 'Execute Trade'}
        </button>
      </form>
    </div>
  );
}
