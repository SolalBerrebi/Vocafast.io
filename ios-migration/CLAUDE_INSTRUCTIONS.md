# Claude Code Migration Instructions for Vocafast iOS

## App Summary

Vocafast is a vocabulary learning iOS app built with SwiftUI. Users sign up, choose their native and target languages, create vocabulary decks, and add words via manual entry, photo capture (camera/gallery + AI OCR), text paste (AI extraction), or AI topic generation. Users train with three modes (flashcards, multiple choice, typing) powered by the SM-2 spaced repetition algorithm. The app tracks XP, levels, streaks, and detailed progress statistics. It supports 17 languages with RTL support for Hebrew and Arabic.

---

## Absolute Rules

1. **Do not ask the user any questions during migration.** Make the best decision based on this document and the companion files. Document any decision in `DECISIONS.md`.

2. **Generate every file completely.** Never use placeholders, TODO comments, `// implement later`, or stub implementations. Every View must render real UI. Every ViewModel must contain real logic. Every Repository must make real Supabase calls.

3. **Follow the exact folder structure defined in MIGRATION_PLAN.md.** Do not deviate, rename, or reorganize unless you document the change in DECISIONS.md.

4. **Every View must have its ViewModel. Every ViewModel must use its Repository.** No exceptions. Views never call Supabase directly.

5. **All user-visible text must be hardcoded in English** (matching the current web app). The app does not use localization files — text is inline in Views.

6. **Use the Supabase Swift SDK (`supabase-swift`)** for all backend operations. Do not use REST calls or URLSession for Supabase operations.

---

## Migration Sequence

Follow this exact order when generating the app. Each step must be fully complete before moving to the next:

### Wave 1: Foundation
1. Xcode project setup (Package.swift / SPM dependencies)
2. `VocafastApp.swift` — App entry point with Supabase initialization
3. `AppState.swift` — Global observable state (auth, active environment)
4. `SupabaseManager.swift` — Singleton Supabase client
5. All data models (`Models/`)
6. `KeychainHelper.swift` — For storing auth tokens

### Wave 2: Auth & Onboarding
7. `AuthRepository.swift`
8. `AuthViewModel.swift`
9. Auth Views: `LoginView`, `SignupView`, `ForgotPasswordView`, `ResetPasswordView`
10. `OnboardingRepository.swift` + `OnboardingViewModel.swift`
11. Onboarding Views: `NativeLangView`, `TargetLangView`, `FirstDeckView`
12. `RootView.swift` — Router that switches between auth, onboarding, and main app

### Wave 3: Core Data Layer
13. `EnvironmentRepository.swift`
14. `DeckRepository.swift`
15. `WordRepository.swift`
16. `TrainingRepository.swift`
17. `ProfileRepository.swift`
18. `NotificationPreferencesRepository.swift`

### Wave 4: Main App Shell
19. `MainTabView.swift` — Tab bar with Decks, Progress, Settings
20. `EnvironmentSwitcherView.swift` — Header environment dropdown
21. `XPPillView.swift` — XP/level display in header
22. `HeaderView.swift` — Combines XP pill + env switcher

### Wave 5: Decks Feature
23. `DecksViewModel.swift`
24. `DecksView.swift` — Deck list with FAB
25. `DeckCardView.swift` — Individual deck card
26. `NewDeckViewModel.swift` + `NewDeckView.swift`
27. `DeckDetailViewModel.swift` + `DeckDetailView.swift` — Word list, search, edit, bulk delete
28. `WordRowView.swift` — Individual word row
29. `EditWordSheet.swift` — Word editing bottom sheet

### Wave 6: Add Words Feature
30. `AddWordsViewModel.swift`
31. `AddWordsView.swift` — Tab-based: Manual, Photo, Text, Topics
32. `ManualEntrySection.swift`
33. `PhotoCaptureSection.swift` — Camera + gallery + AI extraction
34. `TextExtractionSection.swift` — Paste text + AI extraction
35. `TopicGenerationSection.swift` — Topic picker + AI generation
36. `WordReviewList.swift` — Shared component for reviewing extracted words

### Wave 7: Training Feature
37. SRS Engine: `SRSEngine.swift` (SM-2 algorithm, Levenshtein distance)
38. SRS Scheduler: `SRSScheduler.swift` (due words, study scopes, queue building)
39. XP Engine: `XPEngine.swift` (session XP calculation)
40. Levels: `LevelSystem.swift` (16 levels, XP thresholds)
41. `TrainingLauncherViewModel.swift` + `TrainingLauncherView.swift`
42. `TrainingSessionViewModel.swift`
43. `TrainingSessionView.swift` — Progress bar, timer, card display
44. `FlashCardView.swift` — Flip animation, 3-button answer (Again/Hard/Good)
45. `MultipleChoiceView.swift` — 4-option quiz
46. `TypingChallengeView.swift` — Text input with fuzzy matching
47. `SessionSummaryView.swift` — XP breakdown, level-up animation

### Wave 8: Progress & Settings
48. `ProgressViewModel.swift` + `ProgressView.swift`
49. `StatsCardView.swift`
50. `StreakCalendarView.swift` — GitHub-style activity grid
51. `SettingsViewModel.swift` + `SettingsView.swift`
52. `NotificationSettingsSection.swift`
53. `LanguageManagementSection.swift`
54. `ImportExportSection.swift`
55. `DeckImporter.swift` + `DeckExporter.swift` — File handling utilities

### Wave 9: AI Integration
56. `AIService.swift` — Protocol for AI operations
57. `GroqAIService.swift` — Groq API implementation (text extraction, image extraction, topic generation)
58. `AIConversationService.swift` — Chat functionality (placeholder-ready, depends on AI_PROVIDER config)

### Wave 10: Polish & Platform
59. `HapticsManager.swift` — UIImpactFeedbackGenerator for iOS native haptics
60. `RTLHelper.swift` — RTL text direction for Hebrew/Arabic
61. `CoachMarkView.swift` — First-use tooltips with UserDefaults persistence
62. Push notification registration + APNs token handling
63. `NotificationScheduler.swift` — Local notification scheduling

---

## Handling Uncertainty

When you encounter an ambiguous decision point:
1. Choose the option that most closely matches iOS native patterns
2. Document the decision in `/ios-migration/DECISIONS.md` with:
   - What the decision was
   - What alternatives existed
   - Why you chose this option
3. Continue generating code without stopping

---

## SwiftData Offline Strategy

### Offline-capable screens (cache with SwiftData):
- **Decks list** — Cache deck metadata for instant display
- **Word list** — Cache words per deck
- **Training session** — Cache words needed for active session; queue SRS updates
- **Progress stats** — Cache latest stats snapshot

### Online-only screens:
- **Add Words (Photo/Text/Topics)** — Requires API calls to Groq
- **Import/Export** — Requires Supabase access
- **Auth screens** — Requires network

### Sync behavior on reconnect:
- Pending SRS updates (review logs + word updates) are queued locally and synced when connectivity returns
- Deck/word modifications are written to Supabase immediately when online, queued when offline
- Profile/XP updates sync on reconnect

---

## Push Notification Setup

1. Enable Push Notifications capability in Xcode
2. Register for remote notifications in `VocafastApp.swift`
3. Implement `UNUserNotificationCenterDelegate` for foreground handling
4. Store APNs device token in Supabase `profiles` table (add `device_token` column)
5. Schedule local notifications for:
   - Daily reminders (configurable time and days)
   - Streak reminders (evening)
   - Review due alerts
   - Inactivity nudges
6. Use `UNUserNotificationCenter` for all local scheduling

---

## Camera/Device Feature Implementation

### Camera (Photo Capture):
- Use `UIImagePickerController` wrapped in `UIViewControllerRepresentable`
- Support both `.camera` and `.photoLibrary` source types
- Compress captured image to JPEG at 0.8 quality, max 1200px dimension
- Convert to base64 for API submission to Groq

### Haptics:
- Use `UIImpactFeedbackGenerator` (light, medium, heavy)
- Use `UINotificationFeedbackGenerator` for success/error
- Replace web `navigator.vibrate()` patterns

---

## Supabase Auth Token Persistence

- Use the Supabase Swift SDK's built-in auth persistence (it uses Keychain by default on iOS)
- The SDK's `AuthClient` automatically stores and refreshes tokens
- On app launch, call `supabase.auth.session` to check for existing session
- Listen to auth state changes via `supabase.auth.authStateChanges` (AsyncStream)
- Sign out clears the Keychain-stored session automatically
- No manual Keychain management needed for auth tokens

---

## Environment Variables / Configuration

The iOS app needs these values configured (use a `Config.plist` or compile-time constants):
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `GROQ_API_KEY` — Groq API key for AI features
- `GROQ_MODEL` — Model identifier (default: `meta-llama/llama-4-scout-17b-16e-instruct`)

**Important:** In the iOS app, AI API calls (text extraction, image extraction, topic generation) should go directly to Groq from the device. The web app's server-side API routes are not needed — the iOS app calls Groq directly since the API key is compiled into the app.

---

## Key Behavioral Notes

- The web app uses Konsta UI (iOS-style components). The iOS app should use native SwiftUI components that will look identical or better.
- All sheets in the web app (edit word, add language, delete confirmation, change password, daily goal) should use SwiftUI `.sheet()` or `.confirmationDialog()`.
- The web app's tabbar has 3 tabs: Decks, Progress, Settings. Replicate with SwiftUI `TabView`.
- Training sessions are fullscreen (no tab bar). Use `NavigationStack` with `.navigationBarBackButtonHidden()`.
- The "Add to Homescreen" onboarding step is web-only — skip it in the iOS app.
- The deck export uses TSV and Vocafast JSON formats — implement both using `UIActivityViewController` for sharing.
- The deck import accepts CSV, TSV, JSON — use `UIDocumentPickerViewController`.
