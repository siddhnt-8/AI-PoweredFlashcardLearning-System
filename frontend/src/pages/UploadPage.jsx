/**
 * UploadPage.jsx — PDF upload page with mode selection.
 * Users drag-and-drop or select a PDF, pick a mode, and generate flashcards.
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPDF } from "../api/client";

const MODES = [
  {
    id: "questions",
    label: "Q&A Flashcards",
    icon: "❓",
    desc: "Generate question & answer pairs perfect for active recall and exam prep.",
  },
  {
    id: "notes",
    label: "Short Notes",
    icon: "📝",
    desc: "Generate concise topic summaries ideal for quick review and reference.",
  },
];

export default function UploadPage() {
  const navigate   = useNavigate();
  const fileRef    = useRef(null);

  const [file,       setFile]       = useState(null);
  const [mode,       setMode]       = useState("questions");
  const [cardCount,  setCardCount]  = useState(10);
  const [dragging,   setDragging]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [progress,   setProgress]   = useState(0);

  // ── Drag & drop handlers ───────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setError("");
    } else {
      setError("Only PDF files are accepted.");
    }
  };

  const onFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setError(""); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) { setError("Please select a PDF file first."); return; }

    setLoading(true);
    setError("");
    setProgress(0);

    // Fake progress bar while waiting for AI
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 600);

    try {
      const data = await uploadPDF(file, mode, cardCount);
      clearInterval(interval);
      setProgress(100);

      // Navigate to flashcard viewer with the new deck
      setTimeout(() => {
        navigate(`/deck/${data.deck.id}`, { state: { deck: data.deck } });
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black tracking-tight text-white mb-2">
          Flash<span className="text-violet-400">AI</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Upload a PDF. Get flashcards powered by AI.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
            ${dragging
              ? "border-violet-400 bg-violet-950/30 scale-[1.01]"
              : file
              ? "border-violet-500 bg-violet-950/20"
              : "border-gray-700 bg-gray-900 hover:border-gray-500"
            }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />

          {file ? (
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              <p className="text-violet-300 font-semibold text-lg">{file.name}</p>
              <p className="text-gray-500 text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl">☁️</div>
              <p className="text-gray-300 font-semibold text-lg">
                Drag & drop your PDF here
              </p>
              <p className="text-gray-500 text-sm">or click to browse • max 20 MB</p>
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-widest">
            Generation Mode
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-xl p-4 text-left border transition-all duration-150
                  ${mode === m.id
                    ? "border-violet-500 bg-violet-950/40 shadow-lg shadow-violet-900/30"
                    : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="font-bold text-white text-sm">{m.label}</div>
                <div className="text-gray-400 text-xs mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Count Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
              Number of Flashcards
            </p>
            <span className="text-violet-400 font-bold text-lg">{cardCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
          <div className="flex justify-between text-gray-600 text-xs mt-1">
            <span>1</span>
            <span>30</span>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
            ${loading || !file
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40 hover:scale-[1.01] active:scale-[0.99]"
            }`}
        >
          {loading
            ? `Generating flashcards… ${progress}%`
            : "✨ Generate Flashcards"}
        </button>

        {/* Link to decks */}
        <p className="text-center text-gray-600 text-sm">
          Already have flashcards?{" "}
          <button
            onClick={() => navigate("/decks")}
            className="text-violet-400 hover:text-violet-300 underline"
          >
            View all decks
          </button>
        </p>

      </div>
    </div>
  );
}