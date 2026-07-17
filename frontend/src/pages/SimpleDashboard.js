import React from "react";

export default function SimpleDashboard() {
  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Simple Dashboard Test</h1>
      <p className="text-lg">If you can see this page, navigation is working!</p>
      <div className="mt-8 space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold">Test Components</h2>
          <p>Dashboard components would go here</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold">Trading Features</h2>
          <p>Trading signals and features would go here</p>
        </div>
      </div>
    </div>
  );
}
