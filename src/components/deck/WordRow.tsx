"use client";

import { ListItem } from "konsta/react";
import type { Word } from "@/types/database";

interface WordRowProps {
  word: Word;
  onDelete?: () => void;
  onClick?: () => void;
}

const SOURCE_ICONS: Record<string, string> = {
  manual: "✏️",
  photo: "📷",
  audio: "🎤",
  conversation: "💬",
};

export default function WordRow({ word, onClick }: WordRowProps) {
  return (
    <ListItem
      title={word.word}
      after={word.translation}
      subtitle={SOURCE_ICONS[word.source_type] ?? ""}
      link
      onClick={onClick}
    />
  );
}
