import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      const success = await login(username, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } else {
      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        if (response.ok) {
          setIsLogin(true);
          setError("Signup successful! Please login.");
        } else {
          setError("Signup failed. Please try again.");
        }
      } catch (err) {
        setError("Server error during signup.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-900 rounded-xl">
      {/* Toggle between Login and Signup */}
      <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 rounded-l font-medium ${
            isLogin ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 rounded-r font-medium ${
            !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Sign Up
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        {isLogin ? 'Login' : 'Sign Up'}
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <form onSubmit={handleAuth} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-medium">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
