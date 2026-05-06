/**
 * components/Navbar.jsx — Top navigation bar.
 *
 * Shows:
 *   - FlashAI logo (links to home)
 *   - Navigation links (Upload, My Decks)
 *   - Logged-in user email
 *   - Logout button
 *
 * Only rendered for authenticated users via Layout.jsx
 */

import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Get user from localStorage
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  const isLoggedIn = !!localStorage.getItem("token");

  // Don't show navbar on login/signup pages
  if (!isLoggedIn) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear notification state too
    localStorage.removeItem("notif_active");
    localStorage.removeItem("notif_pool");
    localStorage.removeItem("notif_card_index");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm
      sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tight text-white
          hover:text-violet-400 transition-colors">
          Flash<span className="text-violet-400">AI</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive("/")
                ? "bg-violet-950/50 text-violet-400 border border-violet-800/50"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
          >
            ✨ Upload
          </Link>
          <Link
            to="/decks"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive("/decks")
                ? "bg-violet-950/50 text-violet-400 border border-violet-800/50"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
          >
            🃏 My Decks
          </Link>
        </div>

        {/* Right side — user + logout */}
        <div className="flex items-center gap-3">
          {/* User email */}
          {user?.email && (
            <div className="hidden sm:flex items-center gap-2 bg-gray-900
              border border-gray-800 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center
                justify-center text-white text-xs font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <span className="text-gray-400 text-xs max-w-32 truncate">
                {user.email}
              </span>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
              font-semibold border border-gray-700 text-gray-400
              hover:border-red-700 hover:text-red-400 hover:bg-red-950/20
              transition-all duration-200"
          >
            <span>→</span>
            <span>Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
}