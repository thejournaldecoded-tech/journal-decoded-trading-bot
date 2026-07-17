// Dynamic configuration for local development and production deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const getWsBaseUrl = () => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  try {
    const apiUri = new URL(API_BASE_URL);
    const wsProtocol = apiUri.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${apiUri.host}`;
  } catch (e) {
    // Fallback if URL parsing fails
    return API_BASE_URL.replace(/^http/, "ws");
  }
};

export const WS_BASE_URL = getWsBaseUrl();
export default API_BASE_URL;
