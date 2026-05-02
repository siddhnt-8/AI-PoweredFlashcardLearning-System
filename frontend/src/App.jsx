/**
 * App.jsx — Root component.
 * Sets up React Router with all application routes.
 *
 * Routes:
 *   /           → UploadPage    (PDF upload + mode selection)
 *   /decks      → DeckListPage  (all saved decks)
 *   /deck/:deckId → FlashcardPage (study a specific deck)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadPage    from "./pages/UploadPage";
import DeckListPage  from "./pages/DeckListPage";
import FlashcardPage from "./pages/FlashcardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — upload a PDF */}
        <Route path="/"              element={<UploadPage />}    />

        {/* All decks */}
        <Route path="/decks"         element={<DeckListPage />}  />

        {/* Study a deck */}
        <Route path="/deck/:deckId"  element={<FlashcardPage />} />

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}