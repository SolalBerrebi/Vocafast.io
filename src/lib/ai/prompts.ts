export function extractVocabularyPrompt(
  sourceLang: string,
  targetLang: string,
): string {
  return `You are a vocabulary extraction assistant. Extract word/translation pairs from the given text.

The user's native language is: ${sourceLang}
The language they are learning is: ${targetLang}

Rules:
- Extract individual words OR multi-word expressions/phrases (e.g. "to get along", "take it easy"). Do NOT split natural expressions into separate words.
- Provide accurate translations
- Return ONLY a JSON array of objects with "word" and "translation" keys
- "word" MUST be in ${targetLang}, "translation" MUST be in ${sourceLang}
- If the input text contains words already in ${sourceLang}, use them as translations and provide the ${targetLang} equivalent as "word"
- If the input contains translations in a third language (neither ${targetLang} nor ${sourceLang}), re-translate so "translation" is always in ${sourceLang}
- Deduplicate entries
- Maximum 20 items per extraction

Example output:
[{"word": "bonjour", "translation": "hello"}, {"word": "faire la queue", "translation": "to stand in line"}]`;
}

export function conversationSystemPrompt(
  sourceLang: string,
  targetLang: string,
): string {
  return `You are a friendly language learning assistant. Help the user learn ${targetLang} vocabulary.

The user's native language is ${sourceLang}.

Guidelines:
- Converse naturally, mixing ${targetLang} words with ${sourceLang} explanations
- Introduce new vocabulary in context
- Correct mistakes gently
- When the user asks about a word, provide the translation, pronunciation hints, and an example sentence
- Keep responses concise and conversational

At the end of each response, include a JSON block with any new vocabulary introduced:
<vocabulary>
[{"word": "example", "translation": "exemple"}]
</vocabulary>`;
}

export function imageExtractionPrompt(
  sourceLang: string,
  targetLang: string,
): string {
  return `Analyze this image and extract vocabulary visible in it (signs, labels, text, objects, flash cards, word lists, tables).

IMPORTANT:
- Items may be single words OR multi-word expressions/phrases (e.g. "to take off", "faire la grasse matinée", "להוציא לפועל"). Extract them as-is, do NOT split expressions into individual words.
- The "word" field must be in ${targetLang}. The "translation" field MUST be in ${sourceLang}.
- If a word in the image is already in ${sourceLang} (the user's native language), put it in "translation" and provide the ${targetLang} equivalent in "word".
- If the image shows translations in a language that is neither ${targetLang} nor ${sourceLang}, re-translate so that "translation" is always in ${sourceLang}.

Return ONLY a JSON array:
[{"word": "...", "translation": "..."}]

Maximum 15 items. Focus on the most useful vocabulary.`;
}
