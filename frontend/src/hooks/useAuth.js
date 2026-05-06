/**
 * hooks/useAuth.js — Authentication state management.
 *
 * Provides:
 *   - Current user state
 *   - login()   — authenticate and store token
 *   - signup()  — register and store token
 *   - logout()  — clear token and redirect to /login
 *   - isAuthenticated — boolean
 *
 * Usage:
 *   const { user, isAuthenticated, login, signup, logout } = useAuth();
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../api/client";

// ---------------------------------------------------------------------------
// Helpers — read initial state from localStorage
// ---------------------------------------------------------------------------
const getStoredToken = () => localStorage.getItem("token") || null;

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const navigate = useNavigate();

  const [token,   setToken]   = useState(getStoredToken);
  const [user,    setUser]    = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Persist helpers ────────────────────────────────────────────────
  const _storeSession = (accessToken, userData) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user",  JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const _clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);
      _storeSession(data.access_token, data.user);
      navigate("/");
      return { success: true };
    } catch (err) {
      const msg = err.message || "Login failed.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Signup ─────────────────────────────────────────────────────────
  const signup = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const data = await signupUser(email, password);
      _storeSession(data.access_token, data.user);
      navigate("/");
      return { success: true };
    } catch (err) {
      const msg = err.message || "Signup failed.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    _clearSession();
    navigate("/login");
  }, [navigate]);

  // ── Clear error ────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(""), []);

  return {
    user,                            // { id, email } | null
    token,                           // JWT string | null
    isAuthenticated: !!token,        // boolean
    loading,                         // boolean — API call in progress
    error,                           // string — last error message
    login,                           // (email, password) => Promise<{success}>
    signup,                          // (email, password) => Promise<{success}>
    logout,                          // () => void
    clearError,                      // () => void
  };
}