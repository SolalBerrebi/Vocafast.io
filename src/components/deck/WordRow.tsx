"use client";

import { useState } from "react";
import { ListItem, Actions, ActionsGroup, ActionsButton, ActionsLabel } from "konsta/react";
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
  text: "📋",
  topic: "📚",
};

export default function WordRow({ word, onDelete, onClick }: WordRowProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <>
      <ListItem
        title={word.word}
        after={word.translation}
        subtitle={
          word.context_sentence
            ? `${SOURCE_ICONS[word.source_type] ?? ""} ${word.context_sentence}`
            : SOURCE_ICONS[word.source_type] ?? ""
        }
        link
        onClick={onClick ?? (() => setActionsOpen(true))}
      />

      <Actions opened={actionsOpen} onBackdropClick={() => setActionsOpen(false)}>
        <ActionsGroup>
          <ActionsLabel>{word.word}</ActionsLabel>
          {onClick && (
            <ActionsButton
              onClick={() => {
                setActionsOpen(false);
                onClick();
              }}
            >
              Edit
            </ActionsButton>
          )}
          {onDelete && (
            <ActionsButton
              bold
              className="text-red-500"
              onClick={() => {
                setActionsOpen(false);
                onDelete();
              }}
            >
              Delete
            </ActionsButton>
          )}
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton onClick={() => setActionsOpen(false)}>
            Cancel
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </>
  );
}
