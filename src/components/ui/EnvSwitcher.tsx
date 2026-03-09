"use client";

import { useState, useRef, useEffect } from "react";
import { useEnvironment } from "@/hooks/useEnvironment";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  he: "Hebrew",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ru: "Russian",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  pl: "Polish",
  tr: "Turkish",
};

export function getLangName(code: string) {
  return LANG_NAMES[code] ?? code;
}

export default function EnvSwitcher() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeEnvironment, environments, switchEnvironment } =
    useEnvironment();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!activeEnvironment) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <span className="text-lg">{activeEnvironment.icon}</span>
        <span className="font-semibold text-sm">
          {getLangName(activeEnvironment.target_lang)}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-[9999]">
          <div className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
            Learning
          </div>
          {environments.map((env) => {
            const isActive = env.id === activeEnvironment.id;
            return (
              <button
                key={env.id}
                onClick={() => {
                  switchEnvironment(env.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-blue-50"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <span className="text-xl">{env.icon}</span>
                <span
                  className={`flex-1 text-sm ${isActive ? "font-semibold text-blue-600" : "font-medium text-gray-900"}`}
                >
                  {getLangName(env.target_lang)}
                </span>
                {isActive && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
