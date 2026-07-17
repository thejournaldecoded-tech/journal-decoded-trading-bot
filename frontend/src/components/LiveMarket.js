import { useEffect, useState } from "react";
import { WS_BASE_URL } from "../config";

export default function LiveMarket() {
  const [symbol, setSymbol] = useState("btcusdt");
  const [input, setInput] = useState("btcusdt");
  const [price, setPrice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    setPrice(null);
    setError(null);

    const ws = new WebSocket(`${WS_BASE_URL}/ws/market/${symbol}`);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        setError(data.error);
        setPrice(null);
        setConnected(false);
      } else {
        setPrice(data.price);
        setError(null);
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  // 🔥 handle symbol submit
  const handleSubmit = () => {
    if (!input) return;

    setSymbol(input.toLowerCase());
  };

  return (
    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-white">

      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-6">
        Live Market Feed 🚀
      </h2>

      {/* INPUT */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter symbol (e.g. btcusdt, ethusdt)"
          className="border p-2 rounded text-black"
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Load
        </button>

        {/* STATUS */}
        <div
          className={`px-4 py-2 rounded text-sm ${
            connected ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* SYMBOL */}
      <h3 className="text-lg mb-2">
        Symbol: <span className="font-bold">{symbol.toUpperCase()}</span>
      </h3>

      {/* ERROR */}
      {error && (
        <p className="text-red-400 mb-4">{error}</p>
      )}

      {/* PRICE */}
      {!price && !error && (
        <p className="text-gray-400">Loading price...</p>
      )}

      {price && (
        <div className="text-4xl font-bold text-blue-400">
          ₹ {price}
        </div>
      )}
    </div>
  );
}