# Vocafast iOS Requirements

## 1. Auth: Login Screen
- **Route:** `/login` → `LoginView`
- **What it does:** Email/password sign-in
- **User interactions:** Enter email, enter password, tap "Sign In", tap "Forgot Password?", tap "Sign Up" link
- **Business logic:** Call `supabase.auth.signInWithPassword()`. On success, check profile's `onboarding_completed` to route to either onboarding or main app.
- **Validation:** Email must not be empty. Password must not be empty.
- **Error states:** Invalid credentials → show red error banner. Network error → show error message.
- **Loading states:** "Signing in..." text on button, button disabled.
- **Empty states:** N/A
- **Offline behavior:** Does not work offline. Show error if no network.

## 2. Auth: Signup Screen
- **Route:** `/signup` → `SignupView`
- **What it does:** Create new account with display name, email, password
- **User interactions:** Enter display name, email, password. Tap "Sign Up". Tap "Sign In" link.
- **Business logic:** Call `supabase.auth.signUp()` with `data: { display_name }`. On success, show "check your email" confirmation screen (Supabase sends confirmation email). DB trigger auto-creates profile row.
- **Validation:** All fields must not be empty. Password minimum not enforced client-side (Supabase default is 6).
- **Error states:** Email already registered, weak password → show red error banner.
- **Loading states:** "Creating account..." text on button.
- **Empty states:** Success state shows email confirmation message with "Back to Login" button.
- **Offline behavior:** Does not work offline.

## 3. Auth: Forgot Password
- **Route:** `/forgot-password` → `ForgotPasswordView`
- **What it does:** Send password reset email
- **User interactions:** Enter email, tap "Send Reset Link", tap "Sign In" link.
- **Business logic:** Call `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`. On success, show confirmation.
- **Validation:** Email must not be empty.
- **Error states:** Invalid email → error banner.
- **Loading states:** "Sending..." on button.
- **Offline behavior:** Does not work offline.
- **iOS note:** The reset link in the email should use a deep link / universal link to open the app's reset password screen.

## 4. Auth: Reset Password
- **Route:** `/reset-password` → `ResetPasswordView`
- **What it does:** Set new password after clicking reset link
- **User interactions:** Enter new password, confirm password, tap "Update Password".
- **Business logic:** Call `supabase.auth.updateUser({ password })`.
- **Validation:** Password >= 6 chars. Passwords must match.
- **Error states:** Passwords don't match, password too short, update failed.
- **Loading states:** "Updating..." on button.
- **Offline behavior:** Does not work offline.

## 5. Onboarding: Native Language Selection
- **Route:** `/native-lang` → `NativeLangView`
- **What it does:** User selects their native language (step 1/3)
- **User interactions:** Tap a language from list of 17. Tap "Continue".
- **Business logic:** Update `profiles.native_lang` for current user.
- **Languages:** en, he, fr, es, ar, de, it, pt, ja, ko, zh, ru, hi, nl, sv, pl, tr (each with flag emoji and name)
- **Validation:** Must select a language before continuing.
- **Loading states:** "Saving..." on continue button.
- **Step indicator:** 3-step progress bar, step 1 highlighted.

## 6. Onboarding: Target Language Selection
- **Route:** `/target-lang` → `TargetLangView`
- **What it does:** User selects language to learn (step 2/3)
- **User interactions:** Tap a language, tap "Continue".
- **Business logic:** Create `language_environments` row with selected target language, `is_active: true`, default color `#007AFF`, language flag as icon.
- **Validation:** Must select. Cannot select same as native language (filtered out).
- **Step indicator:** Step 2 highlighted.

## 7. Onboarding: First Deck Creation
- **Route:** `/first-deck` → `FirstDeckView`
- **What it does:** Create first deck with optional AI-generated words (step 3/3)
- **User interactions:** Choose a preset topic (Basics, Travel, Food, Business, Daily Life) OR enter custom name. Select vocabulary level (Starter/Beginner/Intermediate/Advanced/Native). Select word count (slider 5-50). Tap "Create Deck".
- **Business logic:**
  1. Create deck in Supabase
  2. If preset topic selected: call Groq API to generate vocabulary, insert generated words
  3. Set `profiles.onboarding_completed = true`
  4. Navigate to main app
- **Error states:** Topic generation failure → create empty deck anyway, navigate forward.
- **Loading states:** "Creating..." or "Generating X words..." with spinner.
- **Step indicator:** Step 3 highlighted.

## 8. Decks List (Main Screen)
- **Route:** `/decks` → `DecksView`
- **What it does:** Shows all decks in the active language environment
- **User interactions:** Tap deck → navigate to deck detail. Tap FAB (+) → navigate to new deck. Switch environment via header dropdown.
- **Business logic:** Fetch `decks` where `environment_id = activeEnvironmentId`, ordered by `created_at DESC`.
- **Empty state:** Large book emoji + "No decks yet" + "Create your first vocabulary deck to start learning"
- **Loading state:** Centered spinner
- **Coach mark:** First visit shows tooltip: "Tap your deck to get started!"
- **Offline behavior:** Show cached decks from SwiftData.

## 9. New Deck
- **Route:** `/decks/new` → `NewDeckView`
- **What it does:** Create a new empty deck
- **User interactions:** Enter name, pick color (8 options), pick icon (10 emoji options), tap "Create Deck".
- **Colors:** #007AFF, #FF3B30, #FF9500, #FFCC00, #34C759, #5856D6, #AF52DE, #FF2D55
- **Icons:** 📚, 🔤, ✈️, 🍕, 💼, 🏠, 🎵, 🎮, 💪, 🌍
- **Business logic:** Insert into `decks` table with `environment_id`. Navigate to deck detail on success.
- **Validation:** Name must not be empty.
- **Loading state:** "Creating..." on button.

## 10. Deck Detail
- **Route:** `/decks/[deckId]` → `DeckDetailView`
- **What it does:** Shows all words in a deck with search, edit, delete, bulk delete, export
- **User interactions:**
  - Tap "+ Add Words" → navigate to add words page
  - Tap word → open edit sheet
  - Tap select mode button → enter bulk selection
  - Tap export button (TSV or JSON) → share file
  - Search bar filters words (shows when >5 words)
  - Tap "Start Training" → navigate to training launcher
- **Business logic:**
  - Fetch deck + words in parallel
  - Validate deck belongs to active environment (redirect if not)
  - Search filters by word or translation (case-insensitive)
- **Edit sheet:** Edit word, translation, context sentence. Save or Delete.
- **Bulk delete:** Checkbox per word, select all/deselect all, "Delete X Words" red button
- **Export:** TSV format (word\ttranslation\tcontext) and Vocafast JSON format
- **Empty state:** List of capture methods (Manual, Photo, Text, Topics) as tappable cards
- **Loading state:** Centered spinner
- **Offline behavior:** Show cached words.

## 11. Add Words
- **Route:** `/decks/[deckId]/add` → `AddWordsView`
- **What it does:** Add vocabulary via 4 methods (tabbed interface)
- **Coach mark:** First visit shows tooltip about multiple methods

### 11a. Manual Entry Tab
- Enter word (target language), translation (native language), context sentence (optional)
- Tap "Add Word" → insert single word
- "Recently Added" list shows below

### 11b. Photo Capture Tab
- Two buttons: Camera (opens camera) and Gallery (opens photo picker)
- On photo selected: compress to JPEG 0.8 quality, max 1200px, convert to base64
- Send to Groq API (multimodal) for vocabulary extraction
- Show preview image + extracted word list with checkboxes
- "Save Selected" / "Retake" buttons
- **Error states:** No words found, API error
- **Loading:** "Preparing image..." → "Analyzing image with AI..."

### 11c. Text Extraction Tab
- Large textarea for pasting text
- "Extract & Translate" button → sends to Groq API
- Results shown as checkbox list
- "Save Selected" / "Clear" buttons
- **Error states:** No vocab found, API error

### 11d. Topics Tab
- Custom topic input with "Go" button
- Vocabulary level selector: Starter/Beginner/Intermediate/Advanced/Native (5 buttons)
- Word count slider: 5-50
- Quick topic grid: Greetings, Food, Travel, Technology, Work, Health, Home, Nature, Shopping, Time (10 topics with icons)
- Results shown as checkbox list
- "Save Selected" / "Back" buttons
- **Deduplication:** Client-side filtering against existing words in deck

### All tabs:
- "Recently Added" section shows words added this session across all tabs
- All bulk inserts use `source_type` matching the tab (manual/photo/text/topic)

## 12. Training Launcher
- **Route:** `/decks/[deckId]/train` → `TrainingLauncherView`
- **What it does:** Configure and start a training session
- **Stats display:** Due, New, Learning, Mastered (4 stat cards)
- **Study scope:** Smart Review (SRS), All Words, Difficult Words, New Only (radio buttons)
- **Training mode:** Flashcards, Multiple Choice, Typing (radio buttons)
- **Card front side** (flashcards only): Word or Translation toggle
- **Session size:** 5, 10, 15, 20 (4 buttons)
- **Business logic:**
  - Fetch deck stats (total, due, new, learning, mastered)
  - Auto-select scope: "smart" if due/new > 0, else "all"
  - Build training queue using SRS scheduler
  - Create `training_sessions` row
  - For multiple choice: generate 3 wrong options from other words in queue
  - Navigate to training session
- **Validation:** Cannot start if deck has 0 words.

## 13. Training Session
- **Route:** `/train/[sessionId]` → `TrainingSessionView`
- **What it does:** Full-screen training with progress tracking
- **UI elements:**
  - Top bar: "Quit" button, optional timer (toggleable), card counter "X / Y"
  - Progress bar (blue, animated)
  - Card display area (mode-specific)
- **No tab bar** — full screen experience

### 13a. Flashcard Mode
- Show word or translation on front (based on frontSide setting)
- Tap to flip (reveal answer)
- 3 answer buttons: "Again" (red), "Hard" (orange), "Good" (green)
- Quality mapping: Again→1, Hard→3, Good→5

### 13b. Multiple Choice Mode
- Show word at top
- 4 option buttons (1 correct + 3 random from session)
- Correct → green highlight, incorrect → red highlight + show correct
- Auto-advance after answer

### 13c. Typing Mode
- Show word at top
- Text input field
- "Check" button
- Fuzzy matching: Levenshtein distance <= 2 counts as correct
- Show correct/incorrect result with correct answer

### All modes:
- Each answer: update word's SRS factors + insert review_log
- Track response times per card (for XP speed bonus)
- On session finish: calculate XP, award XP, update streak, show summary

## 14. Session Summary
- **What it does:** Show training results after session
- **Displays:**
  - Correct / Hard / Incorrect counts with colored bars
  - Duration (mm:ss)
  - Average response time
  - XP breakdown: Base XP + Speed Bonus + Completion Bonus × Streak Multiplier = Total
  - Level-up animation if applicable (emoji + level name)
- **"Done" button:** Persist session results to DB, navigate to decks
- **Business logic:**
  - Calculate XP: correct×10 + hard×5 + incorrect×2 + speed bonus + completion bonus (20) × streak multiplier
  - Speed bonus: up to 50% extra for avg < 5s
  - Streak multiplier: 1.0 (0-1 days), 1.1 (2-3), 1.2 (4-6), 1.5 (7+)
  - Update profile: total_xp, level, streak_days, last_active_date
  - Update training_session: correct, incorrect, finished_at, duration_seconds, avg_response_time_ms, xp_earned

## 15. Progress Screen
- **Route:** `/progress` → `ProgressView`
- **What it does:** Show learning statistics for active environment
- **Stats cards (2×2 grid):** Total Words, Mastered (rep >= 3), Sessions, Accuracy %
- **Streak calendar:** GitHub-style activity grid showing days with training sessions
- **Business logic:**
  - Fetch all decks for active environment, sum word_counts
  - Count mastered words (repetitions >= 3)
  - Fetch completed training sessions, compute accuracy
  - Extract unique session dates for calendar
- **Empty state:** "No progress yet — Complete a training session to see your stats"
- **Loading state:** Centered spinner
- **Offline behavior:** Show cached stats.

## 16. Settings Screen
- **Route:** `/settings` → `SettingsView`
- **Sections:**

### Account
- Email display (read-only)
- Change Password → opens sheet with new password + confirm

### Languages
- List of current language environments with flag emoji + name
- Tap to set as default (green "Default" badge)
- Delete button (red trash icon) — confirmation sheet: "This will permanently delete all decks, words, and training history for this language"
- "Add Language" button → opens sheet with available languages (radio list)
- Cannot delete last remaining language

### Import & Export
- "Import Deck" → opens file picker (CSV, TSV, JSON, txt)
  - Creates new deck with imported words (up to 500)
  - Shows success message with word count + "Go to Decks" link
- "Export Deck" → instruction text "Open a deck and tap the export button"

### Notifications
- Master toggle: Enable Notifications (requests permission)
- Daily Goal: toggle + "Edit" → sheet with words/day slider (5-100) + sessions/day picker (1-5)
- Daily Reminder: toggle + time picker + day-of-week toggles (Mon-Sun)
- Streak Reminder: toggle + time picker ("Evening reminder to keep your streak")
- Review Due: toggle ("Notify when cards are ready for review")
- Achievements: toggle ("Celebrate milestones and progress")
- Inactivity Nudge: toggle + days slider (1-14) ("Remind if inactive for X days")
- All sub-toggles disabled when master toggle is off

### Sign Out
- Red "Sign Out" button → signs out, navigates to login

## Required iOS Permissions

| Permission | Info.plist Key | Usage Description |
|-----------|---------------|-------------------|
| Camera | `NSCameraUsageDescription` | "Vocafast needs camera access to capture photos of vocabulary from textbooks and documents." |
| Photo Library | `NSPhotoLibraryUsageDescription` | "Vocafast needs photo library access to select images containing vocabulary." |
| Notifications | Requested at runtime | "Vocafast would like to send you reminders to practice vocabulary and maintain your learning streak." |

No other permissions are required. The app does not use:
- Location
- Microphone (audio transcription exists in API routes but is not used in any UI — the web app has no audio recording UI either, only the infrastructure)
- Contacts
- Bluetooth
- Health
