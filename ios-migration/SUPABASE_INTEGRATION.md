# Vocafast Supabase Integration Map

## Auth Flow

### Sign Up
- **Web:** `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`
- **Swift:** `try await supabase.auth.signUp(email:password:data:)` with `["display_name": displayName]`
- **Post-signup:** DB trigger creates `profiles` and `notification_preferences` rows automatically
- **Email confirmation:** Supabase sends confirmation email. User must click to activate.

### Sign In
- **Web:** `supabase.auth.signInWithPassword({ email, password })`
- **Swift:** `try await supabase.auth.signIn(email:password:)`
- **Post-login:** Check `profiles.onboarding_completed` to route user

### Sign Out
- **Web:** `supabase.auth.signOut()`
- **Swift:** `try await supabase.auth.signOut()`

### Password Reset
- **Request:** `supabase.auth.resetPasswordForEmail(email, { redirectTo })` → `try await supabase.auth.resetPasswordForEmail(_:redirectTo:)`
- **Complete:** `supabase.auth.updateUser({ password })` → `try await supabase.auth.update(user: .init(password:))`

### Session Persistence
- **Web:** Cookie-based via `@supabase/ssr`
- **Swift:** Supabase Swift SDK auto-persists session in Keychain. On launch, check `supabase.auth.session`.

### Auth State Listening
- **Web:** `supabase.auth.onAuthStateChange(callback)` with subscription
- **Swift:** `for await (event, session) in supabase.auth.authStateChanges { ... }`

---

## Every Supabase Call in the Codebase

### profiles table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `onboarding_completed` | `.eq("id", userId)` `.single()` | middleware.ts | `ProfileRepository.getOnboardingStatus() async -> Bool` |
| SELECT `native_lang` | `.eq("id", userId)` `.single()` | AddWordsPage | `ProfileRepository.getNativeLang() async -> String` |
| SELECT `total_xp, level, streak_days, last_active_date, show_timer` | `.eq("id", userId)` `.single()` | useGamification | `ProfileRepository.getGamificationData() async -> GamificationData` |
| UPDATE `native_lang` | `.eq("id", userId)` | NativeLangPage | `ProfileRepository.updateNativeLang(_ lang: String) async` |
| UPDATE `onboarding_completed` | `.eq("id", userId)` | FirstDeckPage | `ProfileRepository.completeOnboarding() async` |
| UPDATE `total_xp, level, streak_days, last_active_date` | `.eq("id", userId)` | useGamification.awardXP | `ProfileRepository.updateGamification(xp:level:streak:date:) async` |
| UPDATE `show_timer` | `.eq("id", userId)` | useGamification.toggleTimer | `ProfileRepository.updateShowTimer(_ show: Bool) async` |

### language_environments table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `*` | `.order("created_at")` | useEnvironment.fetchEnvironments | `EnvironmentRepository.fetchAll() async -> [LanguageEnvironment]` |
| SELECT `target_lang` | `.eq("id", envId)` `.single()` | AddWordsPage, export | `EnvironmentRepository.getTargetLang(envId:) async -> String` |
| INSERT | `user_id, target_lang, is_active, color, icon` `.select()` `.single()` | useEnvironment.createEnvironment | `EnvironmentRepository.create(targetLang:color:icon:) async -> LanguageEnvironment` |
| UPDATE `is_active = false` | `.neq("id", selectedId)` | useEnvironment.switchEnvironment | `EnvironmentRepository.deactivateAll(except:) async` |
| UPDATE `is_active = true` | `.eq("id", envId)` | useEnvironment.switchEnvironment | `EnvironmentRepository.activate(id:) async` |
| DELETE | `.eq("id", envId)` | useEnvironment.deleteEnvironment | `EnvironmentRepository.delete(id:) async` |

### decks table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `*` | `.eq("environment_id", envId)` `.order("created_at", desc)` | DecksPage, useDeck.fetchDecks | `DeckRepository.fetchAll(environmentId:) async -> [Deck]` |
| SELECT `*` | `.eq("id", deckId)` `.single()` | DeckDetailPage, TrainLauncherPage | `DeckRepository.fetch(id:) async -> Deck?` |
| SELECT `id, word_count` | `.eq("environment_id", envId)` | ProgressPage | `DeckRepository.fetchSummaries(environmentId:) async -> [(id: UUID, wordCount: Int)]` |
| SELECT `environment_id` | `.eq("id", deckId)` `.single()` | AddWordsPage | `DeckRepository.getEnvironmentId(deckId:) async -> UUID?` |
| INSERT | `environment_id, name, color, icon` `.select()` `.single()` | NewDeckPage, FirstDeckPage, ImportRoute | `DeckRepository.create(environmentId:name:color:icon:) async -> Deck` |
| DELETE | `.eq("id", deckId)` | useDeck.deleteDeck | `DeckRepository.delete(id:) async` |

### words table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `*` | `.eq("deck_id", deckId)` `.order("created_at", desc)` | DeckDetailPage, useWords | `WordRepository.fetchAll(deckId:) async -> [Word]` |
| SELECT `word` | `.eq("deck_id", deckId)` | AddWordsPage (dedup) | `WordRepository.fetchExistingWords(deckId:) async -> [String]` |
| SELECT `*` | `.eq("deck_id", deckId)` `.lte("next_review_at", now)` `.order("next_review_at")` `.limit(n)` | scheduler.getDueWords | `WordRepository.fetchDue(deckId:limit:) async -> [Word]` |
| SELECT `*` | `.eq("deck_id", deckId)` `.eq("repetitions", 0)` `.order("created_at")` `.limit(n)` | scheduler.getNewWords | `WordRepository.fetchNew(deckId:limit:) async -> [Word]` |
| SELECT `*` | `.eq("deck_id", deckId)` `.order("created_at")` `.limit(n)` | scheduler.getAllWords | `WordRepository.fetchAllLimited(deckId:limit:) async -> [Word]` |
| SELECT `*` | `.eq("deck_id", deckId)` `.lt("ease_factor", 2.2)` `.gt("repetitions", 0)` | scheduler.getMistakeWords | `WordRepository.fetchMistakes(deckId:limit:) async -> [Word]` |
| SELECT `repetitions, next_review_at, interval_days` | `.eq("deck_id", deckId)` | scheduler.getDeckStats | `WordRepository.fetchStatsFields(deckId:) async -> [WordStatRow]` |
| SELECT count | `.in("deck_id", deckIds)` `.gte("repetitions", 3)` | ProgressPage | `WordRepository.countMastered(deckIds:) async -> Int` |
| INSERT (single) | `deck_id, word, translation, context_sentence, source_type` `.select()` `.single()` | AddWordsPage (manual) | `WordRepository.add(deckId:word:translation:context:sourceType:) async -> Word` |
| INSERT (batch) | Array of `{deck_id, word, translation, source_type}` `.select()` | AddWordsPage (photo/text/topic), ImportRoute | `WordRepository.addBatch(deckId:words:sourceType:) async -> [Word]` |
| UPDATE `word, translation, context_sentence` | `.eq("id", wordId)` `.select()` `.single()` | DeckDetailPage (edit) | `WordRepository.update(id:word:translation:context:) async -> Word` |
| UPDATE `ease_factor, interval_days, repetitions, next_review_at` | `.eq("id", wordId)` | TrainingSession | `WordRepository.updateSRS(id:easeFactor:interval:repetitions:nextReviewAt:) async` |
| DELETE (single) | `.eq("id", wordId)` | DeckDetailPage | `WordRepository.delete(id:) async` |
| DELETE (batch) | `.in("id", ids)` | DeckDetailPage (bulk) | `WordRepository.deleteBatch(ids:) async` |

### training_sessions table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `correct, incorrect, started_at` | `.eq("environment_id", envId)` `.not("finished_at", "is", null)` | ProgressPage | `TrainingRepository.fetchCompletedSessions(environmentId:) async -> [SessionSummaryRow]` |
| INSERT | `environment_id, deck_id, mode` `.select()` `.single()` | TrainLauncherPage | `TrainingRepository.createSession(environmentId:deckId:mode:) async -> TrainingSession` |
| UPDATE `correct, incorrect, finished_at, duration_seconds, avg_response_time_ms, xp_earned` | `.eq("id", sessionId)` | TrainingSessionPage | `TrainingRepository.finishSession(id:correct:incorrect:duration:avgTime:xp:) async` |

### review_logs table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| INSERT | `session_id, word_id, quality, was_correct` | TrainingSessionPage | `TrainingRepository.logReview(sessionId:wordId:quality:wasCorrect:) async` |

### notification_preferences table

| Operation | Filters/Params | Used In | Swift Repository Method |
|-----------|---------------|---------|------------------------|
| SELECT `*` | `.eq("user_id", userId)` `.single()` | useNotificationPreferences | `NotificationPreferencesRepository.fetch() async -> NotificationPreferences?` |
| UPSERT | All fields, `onConflict: "user_id"` | useNotificationPreferences.updatePrefs | `NotificationPreferencesRepository.upsert(_ prefs: NotificationPreferences) async` |

---

## Realtime Subscriptions

The web app does **NOT** use any Supabase Realtime subscriptions. All data is fetched on demand or on mount. The iOS app should follow the same pattern — no need for Realtime channels.

---

## Storage Buckets

The web app does **NOT** use any Supabase Storage buckets. Images are processed in-memory (compressed, converted to base64, sent to Groq API). The iOS app should follow the same pattern.

---

## API Routes → iOS Direct Calls

The web app's API routes (`/api/ai/*`) are server-side wrappers around the Groq API. In the iOS app, these calls go directly to Groq since the API key is available on-device.

| Web API Route | Purpose | iOS Implementation |
|--------------|---------|-------------------|
| `/api/ai/extract-text` | Text → vocabulary extraction via Groq | `GroqAIService.extractFromText(text:nativeLang:targetLang:) async -> [ExtractedWord]` |
| `/api/ai/extract-from-image` | Image → vocabulary extraction via Groq (multimodal) | `GroqAIService.extractFromImage(base64:mimeType:nativeLang:targetLang:) async -> [ExtractedWord]` |
| `/api/ai/generate-topic` | Topic → vocabulary generation via Groq | `GroqAIService.generateTopic(topic:nativeLang:targetLang:existingWords:wordCount:level:) async -> [ExtractedWord]` |
| `/api/ai/conversation` | Chat with AI language tutor | `GroqAIService.chat(messages:systemPrompt:) async -> (reply: String, words: [ExtractedWord])` |
| `/api/ai/transcribe` | Audio transcription (OpenAI Whisper) | Not implemented in iOS v1 (no audio UI exists) |
| `/api/ai/extract-vocabulary` | Generic extraction (text or image) | Covered by extractFromText + extractFromImage |
| `/api/deck/export` | Export deck as TSV or JSON | `DeckExporter` — runs locally, no API call |
| `/api/deck/import` | Import deck from file | `DeckImporter` — parses locally, then inserts via Supabase |

### Groq API Details

- **Base URL:** `https://api.groq.com/openai/v1/chat/completions`
- **Auth:** `Authorization: Bearer GROQ_API_KEY`
- **Model:** Configurable, default `meta-llama/llama-4-scout-17b-16e-instruct`
- **Text extraction:** temperature 0.2, max_tokens 4096
- **Image extraction:** temperature 0.1, max_tokens 4096, multimodal content array
- **Topic generation:** temperature 0.3, max_tokens 2048-4096 based on word count
- **Response parsing:** Strip ```json``` code fences, parse as JSON array of `{word, translation}`
