function Home() {
  return (
    <div className="space-y-20">

      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white leading-tight">
          JournalDecoded
        </h1>
        <p className="mt-6 text-lg text-gray-400">
          A structured research platform focused on algorithmic trading,
          macroeconomic intelligence, and systematic risk frameworks.
        </p>

        <div className="mt-8 flex justify-center gap-6">
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
            Explore Strategy Lab
          </button>
          <button className="border border-gray-700 hover:border-gray-500 px-6 py-3 rounded-lg font-medium">
            View Insights
          </button>
        </div>
      </section>


      {/* Metrics Section */}
      <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <h3 className="text-3xl font-bold text-blue-400">05+</h3>
          <p className="text-gray-400 mt-2">Strategies Under Development</p>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <h3 className="text-3xl font-bold text-blue-400">Macro</h3>
          <p className="text-gray-400 mt-2">Economic Intelligence Modules</p>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <h3 className="text-3xl font-bold text-blue-400">Risk</h3>
          <p className="text-gray-400 mt-2">Systematic Risk Architecture</p>
        </div>
      </section>

    </div>
  );
}

export default Home;
