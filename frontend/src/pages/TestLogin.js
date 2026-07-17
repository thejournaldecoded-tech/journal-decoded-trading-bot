import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TestLogin() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const fakeLogin = () => {
    // Simulate successful login without API call
    localStorage.setItem("jwt_token", "fake-token-for-testing");
    setMessage("Login successful! Redirecting to dashboard...");
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const checkToken = () => {
    const token = localStorage.getItem("jwt_token");
    setMessage(`Token in storage: ${token || "none"}`);
  };

  const clearToken = () => {
    localStorage.removeItem("jwt_token");
    setMessage("Token cleared from storage");
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Test Login (No API)</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={fakeLogin}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded mr-4"
        >
          Fake Login (No API)
        </button>
        
        <button 
          onClick={checkToken}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded mr-4"
        >
          Check Token
        </button>
        
        <button 
          onClick={clearToken}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded"
        >
          Clear Token
        </button>
      </div>

      {message && (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">Status:</h2>
          <p className="text-sm text-gray-300">{message}</p>
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Test Steps:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Click "Fake Login" to simulate login without API</li>
          <li>See if it redirects to dashboard</li>
          <li>If this works, the issue is with the API call</li>
          <li>If this doesn't work, the issue is with routing/auth</li>
        </ol>
      </div>
    </div>
  );
}
