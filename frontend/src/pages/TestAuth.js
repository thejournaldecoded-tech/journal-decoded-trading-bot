import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function TestAuth() {
  const { user, login, logout } = useAuth();
  const [testResult, setTestResult] = useState("");

  const testLogin = async () => {
    const result = await login("kartikay", "123456");
    setTestResult(result ? "Login Successful" : "Login Failed");
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Current User State:</h2>
          <pre className="text-sm text-gray-300">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage Token:</h2>
          <p className="text-sm text-gray-300">
            {localStorage.getItem("jwt_token") || "No token found"}
          </p>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testLogin}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Test Login
          </button>
          
          <button 
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {testResult && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Test Result:</h2>
            <p className="text-sm">{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
