import { PostGrid } from "../components/PostGrid";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

function StrategyLab() {
  return (
    <div className="space-y-12 w-full">
      {/* Strategy Lab Header */}
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Research Sandbox</h1>
        <p className="text-gray-400 max-w-3xl">
          Test swing trading ideas, overlay moving averages, and analyze daily macroeconomic trends before deploying capital.
        </p>
      </div>

      {/* TradingView Chart Sandbox */}
      <div className="max-w-6xl mx-auto px-4 h-[600px]">
        <div className="w-full h-full border border-gray-800 bg-[#131722] rounded overflow-hidden shadow-xl">
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
            container_id="strategy_lab_chart"
            autosize
            studies={[
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies"
            ]}
          />
        </div>
      </div>

      {/* Experimental Models / Posts */}
      <div className="pt-8 border-t border-gray-900">
        <PostGrid 
          section="strategy" 
          title="Experimental Models" 
          description="Read the latest research on systematic market participation and swing strategies." 
        />
      </div>
    </div>
  );
}

export default StrategyLab;
