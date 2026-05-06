/**
 * components/Layout.jsx — Page layout wrapper.
 *
 * Wraps every page with:
 *   - Navbar (top) — with logout button, shown only when logged in
 *   - Page content (middle)
 *   - Footer (bottom)
 */

import Navbar  from "./Navbar";
import Footer  from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">

      {/* Sticky top navbar with logout */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}