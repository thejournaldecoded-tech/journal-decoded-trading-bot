import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

export default function APITest() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const testAPI = async () => {
    try {
      console.log("Testing API connection...");
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username: "kartikay",
        password: "123456"
      });
      console.log("API Response:", response.data);
      setResult(JSON.stringify(response.data, null, 2));
      setError("");
    } catch (err) {
      console.error("API Error:", err);
      setError(JSON.stringify(err.message, null, 2));
      setResult("");
    }
  };

  const testCORS = async () => {
    try {
      console.log("Testing CORS...");
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "kartikay",
          password: "123456"
        })
      });
      const data = await response.json();
      console.log("CORS Response:", data);
      setResult(JSON.stringify(data, null, 2));
      setError("");
    } catch (err) {
      console.error("CORS Error:", err);
      setError(JSON.stringify(err.message, null, 2));
      setResult("");
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={testAPI}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded mr-4"
        >
          Test with Axios
        </button>
        
        <button 
          onClick={testCORS}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded"
        >
          Test with Fetch
        </button>
      </div>

      {result && (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2 text-green-400">✅ Success:</h2>
          <pre className="text-sm text-gray-300">{result}</pre>
        </div>
      )}

      {error && (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2 text-red-400">❌ Error:</h2>
          <pre className="text-sm text-gray-300">{error}</pre>
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Open browser console (F12)</li>
          <li>Click "Test with Axios" and "Test with Fetch"</li>
          <li>Check console for detailed error messages</li>
          <li>Look for network errors or CORS issues</li>
        </ol>
      </div>
    </div>
  );
}
