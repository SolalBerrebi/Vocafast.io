"use client";

import type { Deck } from "@/types/database";

interface DeckCardProps {
  deck: Deck;
  onClick: () => void;
}

export default function DeckCard({ deck, onClick }: DeckCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: deck.color + "20" }}
        >
          {deck.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{deck.name}</h3>
          <p className="text-sm text-gray-500">
            {deck.word_count} {deck.word_count === 1 ? "word" : "words"}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
