/**
 * components/ProtectedRoute.jsx — Route guard for authenticated pages.
 *
 * Checks for a valid JWT token in localStorage.
 * If no token is found → redirects to /login.
 * If token exists     → renders the child component.
 *
 * Usage in App.jsx:
 *   <Route path="/" element={
 *     <ProtectedRoute>
 *       <UploadPage />
 *     </ProtectedRoute>
 *   } />
 */

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // No token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists → render the protected page
  return children;
}