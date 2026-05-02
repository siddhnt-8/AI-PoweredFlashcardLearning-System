/**
 * components/UploadForm.jsx — Drag-and-drop PDF upload form.
 *
 * Props:
 *   onUploadSuccess {fn} — Called with the returned deck data after successful upload
 *   onUploadError   {fn} — Called with error message string on failure
 */

import { useState, useRef } from "react";
import { uploadPDF } from "../api/client";
import ModeSelector from "./ModeSelector";

const MAX_SIZE_MB = 20;

export default function UploadForm({ onUploadSuccess, onUploadError }) {
  const fileRef = useRef(null);

  const [file,      setFile]      = useState(null);
  const [mode,      setMode]      = useState("questions");
  const [cardCount, setCardCount] = useState(10);
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");

  // ── File validation ────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f) return "No file selected.";
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File exceeds the ${MAX_SIZE_MB} MB size limit.`;
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError("");
  };

  // ── Drag & drop ────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const onFileChange = (e) => handleFile(e.target.files[0]);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateFile(file);
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    setProgress(10);

    // Simulated progress while AI works
    const timer = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 8 : p));
    }, 700);

    try {
      const data = await uploadPDF(file, mode, cardCount);
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        onUploadSuccess?.(data);
      }, 400);
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      setLoading(false);
      const msg = err.message || "Upload failed. Please try again.";
      setError(msg);
      onUploadError?.(msg);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-5">

      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && fileRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200
          ${file     ? "border-violet-600 bg-violet-950/20 cursor-default"
          : dragging ? "border-violet-400 bg-violet-950/30 scale-[1.01] cursor-copy"
          :            "border-gray-700 bg-gray-900 hover:border-gray-500 cursor-pointer"
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="p-10 text-center">
          {file ? (
            /* File selected state */
            <div className="space-y-3">
              <div className="text-5xl">📄</div>
              <div>
                <p className="text-violet-300 font-semibold text-lg leading-tight">
                  {file.name}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="text-xs text-gray-500 hover:text-red-400 underline transition-colors"
              >
                Remove file
              </button>
            </div>
          ) : (
            /* Empty state */
            <div className="space-y-3">
              <div className="text-5xl select-none">
                {dragging ? "📂" : "☁️"}
              </div>
              <div>
                <p className="text-gray-300 font-semibold text-lg">
                  {dragging ? "Drop it here!" : "Drag & drop your PDF"}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  or{" "}
                  <span className="text-violet-400 underline">browse files</span>
                  {" "}• max {MAX_SIZE_MB} MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector selected={mode} onChange={setMode} />

      {/* Card Count Slider */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-white font-semibold text-sm">Number of Flashcards</p>
            <p className="text-gray-500 text-xs mt-0.5">How many cards to generate</p>
          </div>
          <span className="text-2xl font-black text-violet-400">{cardCount}</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={cardCount}
          onChange={(e) => setCardCount(Number(e.target.value))}
          className="w-full accent-violet-500 cursor-pointer"
        />
        <div className="flex justify-between text-gray-600 text-xs mt-1.5">
          <span>1 card</span>
          <span>30 cards</span>
        </div>
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="space-y-1.5">
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-gray-500 text-xs">
            {progress < 30  && "Extracting text from PDF…"}
            {progress >= 30 && progress < 70  && "Sending to AI…"}
            {progress >= 70 && progress < 100 && "Generating flashcards…"}
            {progress === 100 && "Done! ✨"}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
          ${loading || !file
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white shadow-lg shadow-violet-900/30 hover:scale-[1.01]"
          }`}
      >
        {loading
          ? `⏳ Processing… ${progress}%`
          : !file
          ? "Select a PDF to continue"
          : "✨ Generate Flashcards"
        }
      </button>

    </div>
  );
}