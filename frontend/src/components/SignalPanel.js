import { useState } from "react";
import { api } from "../utils/api";

export default function SignalPanel() {
  const [symbol, setSymbol] = useState("");
  const [signalData, setSignalData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSignal = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const res = await api.get(`/signal/${symbol}`);
      setSignalData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch signal");
    }
    setLoading(false);
  };

  const getSignalColor = (signal) => {
    if (signal === "BUY") return "text-green-400";
    if (signal === "SELL") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">
        Strategy Signal Engine
      </h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter Symbol (e.g. AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="flex-1 p-3 rounded bg-gray-800 border border-gray-700"
        />

        <button
          onClick={fetchSignal}
          className="bg-blue-600 hover:bg-blue-700 px-6 rounded-lg font-medium"
        >
          {loading ? "Analyzing..." : "Get Signal"}
        </button>
      </div>

      {signalData && (
        <div className="grid md:grid-cols-3 gap-6 mt-6">

          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400 text-sm">Signal</p>
            <p className={`text-3xl font-bold mt-2 ${getSignalColor(signalData.signal)}`}>
              {signalData.signal}
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400 text-sm">Confidence</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {signalData.confidence || 0}%
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400 text-sm">Risk Level</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {signalData.risk || "Moderate"}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
