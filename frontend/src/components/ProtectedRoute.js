import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  console.log("ProtectedRoute - Current user state:", user);

  // TEMPORARY BYPASS - Check if user is authenticated OR has token in localStorage
  const token = localStorage.getItem("jwt_token");
  const isAuthenticated = user || token;
  
  console.log("ProtectedRoute - Token check:", token ? "found" : "not found");
  console.log("ProtectedRoute - Is authenticated:", isAuthenticated);

  if (!isAuthenticated) {
    console.log("ProtectedRoute - No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute - User authenticated, rendering children");
  return children;
}
