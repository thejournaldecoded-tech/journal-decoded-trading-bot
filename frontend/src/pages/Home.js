import { Link } from "react-router-dom";
import { AdvancedRealTimeChart, Screener } from "react-ts-tradingview-widgets";

function Home() {
  return (
    <div className="space-y-16 pb-12 w-full overflow-hidden font-sans">
      
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto mt-8 md:mt-12 px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-tight mb-5">
          JournalDecoded
        </h1>
        
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
          Institutional-grade platform for systematic traders. 
          Advanced algorithmic models, macroeconomic intelligence, and real-time risk architecture.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/strategy-lab" className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-2.5 rounded font-medium transition-colors">
            Launch Strategy Lab
          </Link>
          <Link to="/insights" className="bg-transparent hover:bg-gray-800 text-white border border-gray-700 px-6 py-2.5 rounded font-medium transition-colors">
            Market Insights
          </Link>
        </div>
      </section>

      {/* TradingView Chart Section */}
      <section className="max-w-6xl mx-auto px-4 h-[550px]">
        <div className="w-full h-full border border-gray-800 bg-[#131722] rounded overflow-hidden">
          <AdvancedRealTimeChart 
            theme="dark"
            symbol="BINANCE:BTCUSDT"
            interval="D"
            timezone="Etc/UTC"
            style="1"
            locale="en"
            enable_publishing={false}
            hide_top_toolbar={false}
            hide_legend={false}
            save_image={false}
            container_id="tradingview_chart"
            autosize
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <div className="border-t border-gray-800 pt-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-2">Strategy Lab</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Deploy and backtest dual moving average crossovers, breakout models, and mean reversion strategies using institutional market data.
              </p>
            </div>

            <div className="p-6 md:border-l border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">Macro Intelligence</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Analyze the impact of central bank policies, inflation cycles, and shifting interest rates on portfolio construction.
              </p>
            </div>

            <div className="p-6 md:border-l border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">Risk Architecture</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Systematic position sizing, dynamic stop-losses, and real-time P&L tracking to protect capital during peak volatility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TradingView Screener Section */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="text-xl font-medium text-white mb-4">Market Screener</h2>
        <div className="h-[600px] w-full border border-gray-800 bg-[#131722] rounded overflow-hidden">
          <Screener 
            colorTheme="dark" 
            defaultColumn="overview"
            defaultScreen="general"
            market="crypto"
            showToolbar={true}
            locale="en"
            width="100%"
            height="100%"
          />
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-6xl mx-auto px-4 py-8 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-gray-800 py-8">
          <div>
            <div className="text-2xl font-medium text-white mb-1">05+</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Active Models</div>
          </div>
          <div>
            <div className="text-2xl font-medium text-white mb-1">24/7</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Monitoring</div>
          </div>
          <div>
            <div className="text-2xl font-medium text-white mb-1">&lt;50ms</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Latency</div>
          </div>
          <div>
            <div className="text-2xl font-medium text-white mb-1">100%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Systematic</div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
