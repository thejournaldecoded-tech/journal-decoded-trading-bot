import axios from "axios";
import API_BASE_URL from "../config";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach JWT token in EVERY request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    console.log("Token found:", token ? "yes" : "no");
    console.log("Authorization header:", config.headers.Authorization);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 Error on:", error.config?.url);
      console.log("401 Response:", error.response?.data);
      console.log("Token expired, redirecting...");

      localStorage.removeItem("jwt_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);