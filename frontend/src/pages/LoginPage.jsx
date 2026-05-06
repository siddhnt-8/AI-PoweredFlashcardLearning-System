/**
 * pages/LoginPage.jsx — Login page.
 * Authenticates user and stores JWT token in localStorage.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);
      // Store token and user info
      localStorage.setItem("token",    data.access_token);
      localStorage.setItem("user",     JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tight text-white">
            Flash<span className="text-violet-400">AI</span>
          </h1>
          <p className="text-gray-400 mt-2">Welcome back! Sign in to continue.</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                  text-white placeholder-gray-600 text-sm outline-none
                  focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                    text-white placeholder-gray-600 text-sm outline-none pr-12
                    focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                    hover:text-gray-300 transition-colors text-xs"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/40 border border-red-800 text-red-400
                rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                ${loading
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.01] active:scale-[0.99]"
                }`}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Signup link */}
          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}