import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Please check your username and password.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        // Auto-login immediately after signup
        const ok = await login(username, password);
        setLoading(false);
        if (ok) {
          navigate("/dashboard");
        } else {
          setIsLogin(true);
          setError("Account created! Please log in.");
        }
      } else {
        setLoading(false);
        setError(data.detail || data.message || "Signup failed. Username or email may already exist.");
      }
    } catch (err) {
      setLoading(false);
      setError("Could not connect to server. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-900 rounded-xl shadow-lg">
      {/* Toggle */}
      <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => { setIsLogin(true); setError(""); }}
          className={`flex-1 py-2 rounded-l font-medium transition-colors ${
            isLogin ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(""); }}
          className={`flex-1 py-2 rounded-r font-medium transition-colors ${
            !isLogin ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Sign Up
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>

      {error && <p className="text-red-400 mb-4 text-sm bg-red-900/30 p-3 rounded">{error}</p>}

      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Username" required
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" required
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded font-medium text-white transition-colors">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" placeholder="Username" required
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="email" placeholder="Email" required
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded font-medium text-white transition-colors">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      )}
    </div>
  );
}
