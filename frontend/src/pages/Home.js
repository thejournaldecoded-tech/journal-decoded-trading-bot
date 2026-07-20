import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Home() {
  const [typedText, setTypedText] = useState("");
  
  useEffect(() => {
    const text = "INITIALIZING SYSTEM... OK\nLOADING MACRO MODELS... OK\nESTABLISHING EXCHANGE CONNECTION... OK\nREADY FOR EXECUTION.";
    let i = 0;
    const timer = setInterval(() => {
      setTypedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-24 pb-12 w-full overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-5xl mx-auto mt-8 md:mt-16 px-4">
        {/* Glow effect behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-blue-600/20 blur-[100px] -z-10 rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight leading-tight mb-6 break-words">
          JournalDecoded
        </h1>
        
        <p className="mt-6 text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The institutional-grade platform for systematic traders. 
          Advanced algorithmic models, macroeconomic intelligence, and real-time risk architecture.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/strategy-lab" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-900/50 transition-all hover:scale-105 active:scale-95">
            Launch Strategy Lab
          </Link>
          <Link to="/insights" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-700 backdrop-blur-md px-8 py-3.5 rounded-xl font-medium transition-all">
            Market Insights
          </Link>
        </div>
      </section>

      {/* Mock Terminal Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-black">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-gray-500 font-mono">jd-core-engine ~ bash</span>
          </div>
          <div className="p-6 font-mono text-sm md:text-base text-green-400 min-h-[160px] whitespace-pre-wrap">
            {typedText}
            <span className="animate-pulse">_</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Core Infrastructure</h2>
          <p className="text-gray-400">Built for speed, accuracy, and systematic execution.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Strategy Lab
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Deploy and backtest dual moving average crossovers, breakout models, and mean reversion strategies with live market data.
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Macro Intelligence
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Understand the impact of central bank policies, inflation cycles, and interest rates on your portfolio.
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-green-500/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v-2H4v6h16v-6h-2v2h-2v-5h-2v5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Risk Architecture
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Systematic position sizing, dynamic stop-losses, and real-time P&L tracking to protect capital during volatility.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-gray-900 border-y border-gray-800 py-12 mt-16">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-800">
          <div>
            <div className="text-3xl font-bold text-white mb-1">05+</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Active Models</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">24/7</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Market Monitoring</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">&lt;50ms</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Execution Latency</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">100%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Systematic</div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
