import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import StrategyLab from "./pages/StrategyLab";
import Insights from "./pages/Insights";
import Economics from "./pages/Economics";
import AdminPanel from "./pages/AdminPanel";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TradingSignals from "./pages/TradingSignals";
import TestAuth from "./pages/TestAuth";
import SimpleDashboard from "./pages/SimpleDashboard";
import APITest from "./pages/APITest";
import TestLogin from "./pages/TestLogin";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/strategy-lab" element={<StrategyLab />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/economics" element={<Economics />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path="/signals" element={<TradingSignals />} />
          <Route path="/test-auth" element={<TestAuth />} />
          <Route path="/simple-dashboard" element={<SimpleDashboard />} />
          <Route path="/api-test" element={<APITest />} />
          <Route path="/test-login" element={<TestLogin />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
