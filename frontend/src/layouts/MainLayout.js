import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function MainLayout({ children }) {
  const {user, logout}=useAuth();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold text-white">
          JournalDecoded
        </Link>
        <div className="space-x-6 text-sm flex items-center">
          <Link to="/" className="hover:text-blue-400">Home</Link>
<Link to="/strategy-lab" className="hover:text-blue-400">Strategy Lab</Link>
<Link to="/insights" className="hover:text-blue-400">Insights</Link>
<Link to="/economics" className="hover:text-blue-400">Economics</Link>

{user ? (
  <>
    <Link to="/dashboard" className="hover:text-blue-400">
      Dashboard
    </Link>
    <Link to="/signals" className="hover:text-blue-400">
      AI Signals
    </Link>
    <button
      onClick={logout}
      className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
    >
      Logout
    </button>
  </>
) : (
  <Link to="/login" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">
    Login
  </Link>
)}

        </div>
      </nav>

      {/* Page Content */}
      <div className="px-10 py-12">
        {children}
      </div>
      <footer className="border-t border-gray-800 mt-20 px-10 py-8 text-sm text-gray-500">
      <div className="flex justify-between">
        <p>© 2026 JournalDecoded</p>
        <p>Systematic Thinking. Structured Execution.</p>
  </div>
</footer>

    </div>
  );
}

export default MainLayout;
