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
      className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 active:scale-[0.98] transition-all active:bg-gray-50"
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: deck.color + "15" }}
        >
          {deck.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] truncate">{deck.name}</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {deck.word_count} {deck.word_count === 1 ? "word" : "words"}
          </p>
        </div>
        <svg
          className="w-4.5 h-4.5 text-gray-300 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
