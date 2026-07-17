import { createContext, useContext, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
  const token = localStorage.getItem("jwt_token");
  return token ? { authenticated: true } : null;
});


  const login = async (username, password) => {
    try {
      // Make direct axios call to bypass interceptor issues
      const res = await axios.post(`${API_BASE_URL}/login`, { username, password });
      console.log("LOGIN RESPONSE:", res.data); // 👈 DEBUG

    // 🔥 IMPORTANT: adjust this based on response
    const token =
      res.data.access_token || res.data.token || res.data.jwt;

    if (!token) {
      console.log("No token received");
      return false;
    }

    localStorage.setItem("jwt_token", res.data.access_token);
    const newUser = { authenticated: true, username };
    setUser(newUser);
    console.log("Login successful, user state updated:", newUser);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", err.response?.data);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
