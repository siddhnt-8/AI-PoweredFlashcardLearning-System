/**
 * components/Footer.jsx — Global application footer.
 *
 * Displays:
 *   - App branding and tagline
 *   - Quick navigation links
 *   - Tech stack credits
 *   - Team information: 26_CS_CYS_4B_08
 *   - Copyright
 */

import { Link } from "react-router-dom";

const TEAM_MEMBERS = [
  "Team Lead",
  "Backend Dev",
  "Frontend Dev",
  "AI Integration",
];

const TECH_STACK = [
  { label: "FastAPI",     icon: "⚡" },
  { label: "React",       icon: "⚛️" },
  { label: "MiMo-v2-Flash", icon: "🤖" },
  { label: "SQLite",      icon: "🗄️" },
  { label: "Tailwind",    icon: "🎨" },
];

const NAV_LINKS = [
  { label: "Upload PDF",   to: "/"      },
  { label: "My Decks",     to: "/decks" },
  { label: "Login",        to: "/login" },
  { label: "Sign Up",      to: "/signup"},
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800/60 bg-gray-950 mt-auto">

      {/* Top section */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 gap-10
        md:grid-cols-4">

        {/* Brand column */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Flash<span className="text-violet-400">AI</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            AI-powered flashcard learning. Upload any PDF and let MiMo-v2-Flash
            generate smart study cards in seconds.
          </p>
          {/* Status dot */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Navigation
          </h3>
          <ul className="space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-gray-500 hover:text-violet-400 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech stack */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Built With
          </h3>
          <ul className="space-y-2">
            {TECH_STACK.map((tech) => (
              <li key={tech.label}
                className="flex items-center gap-2 text-sm text-gray-500">
                <span>{tech.icon}</span>
                <span>{tech.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Team info */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Our Team
          </h3>

          {/* Team badge */}
          <div className="inline-flex items-center gap-2 bg-violet-950/50 border
            border-violet-800/60 rounded-xl px-3 py-2">
            <span className="text-violet-400 text-lg">🎓</span>
            <div>
              <p className="text-violet-300 font-bold text-sm">26_CS_CYS_4B_08</p>
              <p className="text-violet-500 text-xs">Cybersecurity • Section 4B</p>
            </div>
          </div>

          <p className="text-gray-500 text-xs leading-relaxed">
            A group project developed as part of the Computer Science &
            Cybersecurity curriculum. Combining AI, security, and modern
            web development.
          </p>

          {/* Features list */}
          <ul className="space-y-1">
            {[
              "JWT Authentication",
              "AI Flashcard Generation",
              "Spaced Repetition (SM-2)",
              "Browser Notifications",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-violet-600">▸</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-gray-800/60" />

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2
        sm:flex-row sm:items-center sm:justify-between">

        {/* Copyright */}
        <p className="text-gray-600 text-xs">
          © {year} FlashAI — Team{" "}
          <span className="text-violet-500 font-semibold">26_CS_CYS_4B_08</span>
          . All rights reserved.
        </p>

        {/* Right side — powered by */}
        <div className="flex items-center gap-3 text-xs text-gray-700">
          <span>Powered by</span>
          <span className="text-violet-600 font-semibold">MiMo-v2-Flash</span>
          <span>•</span>
          <span className="text-violet-600 font-semibold">OpenRouter</span>
          <span>•</span>
          <span className="text-violet-600 font-semibold">FastAPI</span>
        </div>

      </div>

    </footer>
  );
}