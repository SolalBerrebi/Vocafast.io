import type { Deck, Word } from "./database";

export interface DeckWithWords extends Deck {
  words: Word[];
}

export interface DeckFormData {
  name: string;
  color: string;
  icon: string;
}

export interface WordFormData {
  word: string;
  translation: string;
}
