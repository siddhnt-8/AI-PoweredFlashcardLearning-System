/**
 * pages/SignupPage.jsx — Signup page.
 * Creates a new user account and stores JWT token in localStorage.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../api/client";

export default function SignupPage() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Password strength ────────────────────────────────────────────────
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { label: "",         color: ""                },
      { label: "Weak",     color: "bg-red-500"      },
      { label: "Fair",     color: "bg-orange-500"   },
      { label: "Good",     color: "bg-yellow-500"   },
      { label: "Strong",   color: "bg-green-500"    },
      { label: "Very Strong", color: "bg-emerald-500" },
    ];
    return { score, ...levels[score] };
  };

  const strength = getStrength(password);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirm) {
      setError("Please fill in all fields."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); return;
    }

    setLoading(true);
    try {
      const data = await signupUser(email, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
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
          <p className="text-gray-400 mt-2">Create your free account to get started.</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Create Account</h2>

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
                  placeholder="Min. 6 characters"
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

              {/* Password strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all duration-300
                          ${i <= strength.score ? strength.color : "bg-gray-700"}`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-gray-500">
                      Strength:{" "}
                      <span className={`font-medium
                        ${strength.score <= 1 ? "text-red-400"
                        : strength.score <= 2 ? "text-orange-400"
                        : strength.score <= 3 ? "text-yellow-400"
                        : "text-green-400"}`}
                      >
                        {strength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3
                  text-white placeholder-gray-600 text-sm outline-none transition-all
                  ${confirm && confirm !== password
                    ? "border-red-700 focus:ring-red-700"
                    : confirm && confirm === password
                    ? "border-green-700 focus:ring-green-700"
                    : "border-gray-700 focus:border-violet-500 focus:ring-violet-500"
                  } focus:ring-1`}
              />
              {confirm && confirm !== password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {confirm && confirm === password && (
                <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
              )}
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
              {loading ? "Creating account…" : "Create Account →"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Login link */}
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms note */}
        <p className="text-center text-gray-700 text-xs mt-4">
          By signing up you agree to our terms of service.
        </p>

      </div>
    </div>
  );
}