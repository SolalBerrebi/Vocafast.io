"use client";

import { useState } from "react";
import { Actions, ActionsGroup, ActionsButton, ActionsLabel } from "konsta/react";
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
  const { activeEnvironment, environments, switchEnvironment } =
    useEnvironment();

  if (!activeEnvironment) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <span className="text-lg">{activeEnvironment.icon}</span>
        <span className="font-semibold text-sm">
          {getLangName(activeEnvironment.target_lang)}
        </span>
        <svg
          className="w-3 h-3 text-gray-400"
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

      <Actions opened={open} onBackdropClick={() => setOpen(false)}>
        <ActionsGroup>
          <ActionsLabel>Switch Language</ActionsLabel>
          {environments.map((env) => (
            <ActionsButton
              key={env.id}
              bold={env.id === activeEnvironment.id}
              onClick={() => {
                switchEnvironment(env.id);
                setOpen(false);
              }}
            >
              <span className="mr-2">{env.icon}</span>
              {getLangName(env.target_lang)}
              {env.id === activeEnvironment.id && " ✓"}
            </ActionsButton>
          ))}
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton onClick={() => setOpen(false)}>Cancel</ActionsButton>
        </ActionsGroup>
      </Actions>
    </>
  );
}
