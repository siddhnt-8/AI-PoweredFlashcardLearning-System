/**
 * App.jsx — Root component with routing, auth guards, global layout,
 * and shared notification hook instance.
 *
 * The useNotifications hook is instantiated ONCE here at the root level
 * and passed down to pages/components that need it — ensuring a single
 * shared pool state across the entire app.
 *
 * Public routes:
 *   /login   → LoginPage
 *   /signup  → SignupPage
 *
 * Protected routes:
 *   /              → UploadPage
 *   /decks         → DeckListPage  (needs notifHook for per-deck toggle)
 *   /deck/:deckId  → FlashcardPage (needs notifHook for per-deck toggle)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useNotifications }  from "./hooks/useNotifications";
import Layout                from "./components/Layout";
import ProtectedRoute        from "./components/ProtectedRoute";
import NotificationManager   from "./components/NotificationManager";
import LoginPage             from "./pages/LoginPage";
import SignupPage            from "./pages/SignupPage";
import UploadPage            from "./pages/UploadPage";
import DeckListPage          from "./pages/DeckListPage";
import FlashcardPage         from "./pages/FlashcardPage";

export default function App() {
  // Single shared notification hook instance for the entire app
  const notifHook = useNotifications();

  return (
    <BrowserRouter>

      {/* Global floating notification panel — never unmounts */}
      <NotificationManager notifHook={notifHook} />

      <Layout>
        <Routes>

          {/* ── Public routes ──────────────────────────────────────── */}
          <Route path="/login"  element={<LoginPage />}  />
          <Route path="/signup" element={<SignupPage />} />

          {/* ── Protected routes ───────────────────────────────────── */}
          <Route path="/" element={
            <ProtectedRoute><UploadPage /></ProtectedRoute>
          } />

          {/* DeckListPage needs notifHook for per-deck 🔔 toggles */}
          <Route path="/decks" element={
            <ProtectedRoute>
              <DeckListPage notifHook={notifHook} />
            </ProtectedRoute>
          } />

          {/* FlashcardPage needs notifHook for 🔔 toggle on current deck */}
          <Route path="/deck/:deckId" element={
            <ProtectedRoute>
              <FlashcardPage notifHook={notifHook} />
            </ProtectedRoute>
          } />

          {/* ── Fallback ───────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Layout>

    </BrowserRouter>
  );
}