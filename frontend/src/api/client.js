/**
 * api/client.js — Axios instance and all API call functions.
 *
 * Automatically attaches JWT Bearer token to every request.
 * Handles 401 responses by clearing token and redirecting to /login.
 */

import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 60000,
  headers: { Accept: "application/json" },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token to every request
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors + handle 401
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Token expired or invalid — clear session and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";

    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ access_token, token_type, user, message }>}
 */
export const signupUser = (email, password) =>
  api.post("/auth/signup", { email, password });

/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ access_token, token_type, user, message }>}
 */
export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

/**
 * Get the currently authenticated user.
 * @returns {Promise<{ id, email }>}
 */
export const getCurrentUser = () =>
  api.get("/auth/me");

// ---------------------------------------------------------------------------
// Upload endpoints
// ---------------------------------------------------------------------------

/**
 * Upload a PDF and generate flashcards.
 * @param {File}   file
 * @param {string} mode      — "questions" | "notes"
 * @param {number} cardCount — 1-30
 */
export const uploadPDF = (file, mode = "questions", cardCount = 10) => {
  const formData = new FormData();
  formData.append("file",       file);
  formData.append("mode",       mode);
  formData.append("card_count", cardCount);
  return api.post("/upload/pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ---------------------------------------------------------------------------
// Flashcard / Deck endpoints
// ---------------------------------------------------------------------------

/** List all decks for current user. */
export const listDecks = (skip = 0, limit = 20) =>
  api.get("/flashcards/", { params: { skip, limit } });

/** Get a single deck with all its flashcards. */
export const getDeck = (deckId) =>
  api.get(`/flashcards/${deckId}`);

/** Delete a deck and all its cards. */
export const deleteDeck = (deckId) =>
  api.delete(`/flashcards/${deckId}`);

/** Get a single flashcard by ID. */
export const getCard = (cardId) =>
  api.get(`/flashcards/card/${cardId}`);

/** Delete a single flashcard. */
export const deleteCard = (cardId) =>
  api.delete(`/flashcards/card/${cardId}`);

// ---------------------------------------------------------------------------
// Review / Spaced repetition endpoints
// ---------------------------------------------------------------------------

/** Submit a SM-2 quality rating (0–5) for a flashcard. */
export const submitReview = (flashcardId, quality) =>
  api.post("/review/", { flashcard_id: flashcardId, quality });

/** Get all flashcards due for review today. */
export const getDueCards = () =>
  api.get("/review/due");

/** Get overall review statistics for current user. */
export const getReviewStats = () =>
  api.get("/review/stats");

// ---------------------------------------------------------------------------
// Default export — raw axios instance
// ---------------------------------------------------------------------------
export default api;