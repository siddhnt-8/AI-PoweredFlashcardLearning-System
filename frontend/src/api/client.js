/**
 * api/client.js — Axios instance and all API call functions.
 *
 * All backend communication goes through this file.
 * Base URL defaults to http://localhost:8000 (FastAPI dev server).
 */

import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 60000, // 60s — AI generation can take time
  headers: {
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — log outgoing requests in development
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Upload endpoints
// ---------------------------------------------------------------------------

/**
 * Upload a PDF and generate flashcards.
 *
 * @param {File}   file       - PDF file object
 * @param {string} mode       - "questions" | "notes"
 * @param {number} cardCount  - Number of cards to generate (1–30)
 * @returns {Promise<{ deck: DeckDetail, message: string }>}
 */
export const uploadPDF = async (file, mode = "questions", cardCount = 10) => {
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

/**
 * List all decks (paginated).
 *
 * @param {number} skip  - Records to skip (default 0)
 * @param {number} limit - Max records to return (default 20)
 * @returns {Promise<APIResponse<Deck[]>>}
 */
export const listDecks = (skip = 0, limit = 20) =>
  api.get("/flashcards/", { params: { skip, limit } });

/**
 * Get a single deck with all its flashcards.
 *
 * @param {number} deckId
 * @returns {Promise<APIResponse<DeckDetail>>}
 */
export const getDeck = (deckId) =>
  api.get(`/flashcards/${deckId}`);

/**
 * Delete a deck and all its cards.
 *
 * @param {number} deckId
 * @returns {Promise<APIResponse<null>>}
 */
export const deleteDeck = (deckId) =>
  api.delete(`/flashcards/${deckId}`);

/**
 * Get a single flashcard by ID.
 *
 * @param {number} cardId
 * @returns {Promise<APIResponse<Flashcard>>}
 */
export const getCard = (cardId) =>
  api.get(`/flashcards/card/${cardId}`);

/**
 * Delete a single flashcard.
 *
 * @param {number} cardId
 * @returns {Promise<APIResponse<null>>}
 */
export const deleteCard = (cardId) =>
  api.delete(`/flashcards/card/${cardId}`);

// ---------------------------------------------------------------------------
// Review / Spaced repetition endpoints
// ---------------------------------------------------------------------------

/**
 * Submit a SM-2 quality rating for a flashcard.
 *
 * @param {number} flashcardId
 * @param {number} quality     - 0 (blank) to 5 (perfect)
 * @returns {Promise<APIResponse<ReviewResult>>}
 */
export const submitReview = (flashcardId, quality) =>
  api.post("/review/", { flashcard_id: flashcardId, quality });

/**
 * Get all flashcards due for review today.
 *
 * @returns {Promise<APIResponse<DueCardsOut>>}
 */
export const getDueCards = () =>
  api.get("/review/due");

/**
 * Get overall review statistics.
 *
 * @returns {Promise<APIResponse<ReviewStats>>}
 */
export const getReviewStats = () =>
  api.get("/review/stats");

// ---------------------------------------------------------------------------
// Default export — raw axios instance (for custom calls if needed)
// ---------------------------------------------------------------------------
export default api;