import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/strategy-lab", label: "Strategy Lab" },
    { to: "/insights", label: "Insights" },
    { to: "/economics", label: "Blog" },
  ];

  const authLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/signals", label: "AI Signals" },
      ]
    : [];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 md:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-white tracking-tight">
            JournalDecoded
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-blue-400 ${
                  isActive(link.to) ? "text-blue-400 font-medium" : "text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {authLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-blue-400 ${
                  isActive(link.to) ? "text-blue-400 font-medium" : "text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={logout}
                className="bg-red-600 px-4 py-1.5 rounded-lg text-white hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 px-4 py-1.5 rounded-lg text-white hover:bg-blue-700 transition-colors text-sm"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-gray-300 transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-gray-300 transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-gray-300 transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col space-y-1 pb-4 border-t border-gray-800 pt-4">
            {[...navLinks, ...authLinks].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive(link.to)
                    ? "bg-blue-600/20 text-blue-400 font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              {user ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full bg-red-600 py-2.5 rounded-lg text-white hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center bg-blue-600 py-2.5 rounded-lg text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="px-4 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 px-4 md:px-10 py-8 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p>© 2026 JournalDecoded</p>
          <p>Systematic Thinking. Structured Execution.</p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
