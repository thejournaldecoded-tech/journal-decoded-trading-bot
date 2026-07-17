function StrategyLab() {
  return (
    <div className="space-y-12">

      <div>
        <h2 className="text-4xl font-bold mb-3">
          Strategy Lab
        </h2>
        <p className="text-gray-400 max-w-2xl">
          Experimental and rule-based algorithmic models designed 
          for systematic market participation.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition">
          <h3 className="text-xl font-semibold mb-4">MA Crossover</h3>
          <p className="text-gray-400 text-sm">
            Trend-following system using dual moving average logic.
          </p>
          <div className="mt-6 text-sm text-blue-400">
            View Details →
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition">
          <h3 className="text-xl font-semibold mb-4">Breakout Model</h3>
          <p className="text-gray-400 text-sm">
            Volatility expansion-based entry framework.
          </p>
          <div className="mt-6 text-sm text-blue-400">
            View Details →
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition">
          <h3 className="text-xl font-semibold mb-4">Mean Reversion</h3>
          <p className="text-gray-400 text-sm">
            Statistical deviation capture model.
          </p>
          <div className="mt-6 text-sm text-blue-400">
            View Details →
          </div>
        </div>

      </div>

    </div>
  );
}

export default StrategyLab;
