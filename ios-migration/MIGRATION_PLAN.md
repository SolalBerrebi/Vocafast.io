# Vocafast iOS Migration Plan

## App Summary

Vocafast is a vocabulary learning app that emphasizes fast word capture (manual, photo, text paste, AI topics) combined with spaced repetition training (flashcards, multiple choice, typing). Users manage multiple language environments, track XP/levels/streaks, and review progress. The app supports 17 languages including RTL (Hebrew, Arabic).

## Confirmed iOS Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | SwiftUI (iOS 17+) |
| Architecture | MVVM + Repository pattern |
| Local Persistence | SwiftData |
| Backend | Supabase Swift SDK |
| Push Notifications | APNs + UNUserNotificationCenter (local) |
| Camera/Media | AVFoundation / UIImagePickerController |
| AI/ML | Groq API (direct HTTP calls) |
| Haptics | UIKit Feedback Generators |
| Auth Token Storage | Supabase SDK (Keychain-backed) |

## Xcode Project Folder Structure

```
Vocafast/
├── VocafastApp.swift
├── Config.swift                          // Supabase URL, keys, Groq config
├── Info.plist
│
├── Core/
│   ├── AppState.swift                    // Global auth + environment state
│   ├── RootView.swift                    // Auth/Onboarding/Main router
│   ├── SupabaseManager.swift             // Supabase client singleton
│   ├── KeychainHelper.swift              // Keychain utilities (if needed beyond SDK)
│   ├── HapticsManager.swift              // UIImpactFeedbackGenerator wrapper
│   ├── RTLHelper.swift                   // isRTL, textDirection for he/ar
│   └── NotificationScheduler.swift       // UNUserNotificationCenter scheduling
│
├── Models/
│   ├── Profile.swift
│   ├── LanguageEnvironment.swift
│   ├── Deck.swift
│   ├── Word.swift
│   ├── TrainingSession.swift
│   ├── ReviewLog.swift
│   ├── NotificationPreferences.swift
│   ├── Level.swift                       // Level definition + XP thresholds
│   └── TrainingTypes.swift               // TrainingMode, StudyScope, TrainingCard, SRSResult
│
├── Models/SwiftData/
│   ├── CachedDeck.swift                  // @Model for offline deck cache
│   ├── CachedWord.swift                  // @Model for offline word cache
│   ├── PendingReview.swift               // @Model for offline review queue
│   └── CachedStats.swift                 // @Model for offline progress cache
│
├── Repositories/
│   ├── AuthRepository.swift
│   ├── ProfileRepository.swift
│   ├── EnvironmentRepository.swift
│   ├── DeckRepository.swift
│   ├── WordRepository.swift
│   ├── TrainingRepository.swift
│   ├── NotificationPreferencesRepository.swift
│   └── ImportExportRepository.swift
│
├── Services/
│   ├── AIService.swift                   // Protocol definition
│   ├── GroqAIService.swift               // Groq API: text extraction, image, topics
│   ├── SRSEngine.swift                   // SM-2 algorithm + Levenshtein
│   ├── SRSScheduler.swift                // Due words, study scopes, queue building
│   ├── XPEngine.swift                    // Session XP calculation
│   ├── LevelSystem.swift                 // 16 levels, getLevelForXP, progress
│   ├── DeckImporter.swift                // Parse CSV/TSV/JSON files
│   └── DeckExporter.swift                // Generate TSV/JSON export files
│
├── Features/
│   ├── Auth/
│   │   ├── ViewModels/
│   │   │   └── AuthViewModel.swift
│   │   └── Views/
│   │       ├── LoginView.swift
│   │       ├── SignupView.swift
│   │       ├── ForgotPasswordView.swift
│   │       └── ResetPasswordView.swift
│   │
│   ├── Onboarding/
│   │   ├── ViewModels/
│   │   │   └── OnboardingViewModel.swift
│   │   └── Views/
│   │       ├── NativeLangView.swift
│   │       ├── TargetLangView.swift
│   │       └── FirstDeckView.swift
│   │
│   ├── Main/
│   │   └── Views/
│   │       ├── MainTabView.swift
│   │       └── HeaderView.swift
│   │
│   ├── Decks/
│   │   ├── ViewModels/
│   │   │   ├── DecksViewModel.swift
│   │   │   ├── NewDeckViewModel.swift
│   │   │   └── DeckDetailViewModel.swift
│   │   └── Views/
│   │       ├── DecksView.swift
│   │       ├── DeckCardView.swift
│   │       ├── NewDeckView.swift
│   │       ├── DeckDetailView.swift
│   │       ├── WordRowView.swift
│   │       └── EditWordSheet.swift
│   │
│   ├── AddWords/
│   │   ├── ViewModels/
│   │   │   └── AddWordsViewModel.swift
│   │   └── Views/
│   │       ├── AddWordsView.swift
│   │       ├── ManualEntrySection.swift
│   │       ├── PhotoCaptureSection.swift
│   │       ├── TextExtractionSection.swift
│   │       ├── TopicGenerationSection.swift
│   │       └── WordReviewList.swift
│   │
│   ├── Training/
│   │   ├── ViewModels/
│   │   │   ├── TrainingLauncherViewModel.swift
│   │   │   └── TrainingSessionViewModel.swift
│   │   └── Views/
│   │       ├── TrainingLauncherView.swift
│   │       ├── TrainingSessionView.swift
│   │       ├── FlashCardView.swift
│   │       ├── MultipleChoiceView.swift
│   │       ├── TypingChallengeView.swift
│   │       └── SessionSummaryView.swift
│   │
│   ├── Progress/
│   │   ├── ViewModels/
│   │   │   └── ProgressViewModel.swift
│   │   └── Views/
│   │       ├── ProgressView.swift
│   │       ├── StatsCardView.swift
│   │       └── StreakCalendarView.swift
│   │
│   └── Settings/
│       ├── ViewModels/
│       │   └── SettingsViewModel.swift
│       └── Views/
│           ├── SettingsView.swift
│           ├── LanguageManagementSection.swift
│           ├── NotificationSettingsSection.swift
│           └── ImportExportSection.swift
│
├── Components/
│   ├── EnvironmentSwitcherView.swift
│   ├── XPPillView.swift
│   ├── CoachMarkView.swift
│   └── ImagePicker.swift                 // UIImagePickerController wrapper
│
├── Extensions/
│   ├── Color+Hex.swift                   // Initialize Color from hex string
│   └── Date+Helpers.swift                // Date formatting utilities
│
└── Resources/
    ├── Assets.xcassets/
    │   ├── AppIcon.appiconset/
    │   └── Colors/
    └── Localizable.strings               // Empty — all text is inline English
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | PascalCase | `DeckDetailView.swift` |
| Types/Structs/Classes | PascalCase | `struct Deck: Codable` |
| Variables/Functions | camelCase | `func fetchDecks() async` |
| View files | Suffix `View` | `DecksView.swift` |
| ViewModel files | Suffix `ViewModel` | `DecksViewModel.swift` |
| Repository files | Suffix `Repository` | `DeckRepository.swift` |
| Protocols | PascalCase, no prefix | `protocol AIService` |
| SwiftData models | Prefix `Cached` | `CachedDeck` |
| Constants | UPPER_SNAKE_CASE in enums | `Level.LEVELS` |
| DB column mapping | snake_case in CodingKeys | `case environmentId = "environment_id"` |

## Swift Package Dependencies

| Package | URL | Use |
|---------|-----|-----|
| supabase-swift | `https://github.com/supabase/supabase-swift.git` | Backend: auth, database, realtime |

**No other external dependencies.** The app uses only Apple frameworks:
- SwiftUI
- SwiftData
- AVFoundation (camera)
- PhotosUI (photo picker)
- UserNotifications (APNs + local)
- UIKit (haptics, image picker wrapper)

## Migration Sequencing

The files will be generated in 10 waves as defined in CLAUDE_INSTRUCTIONS.md:

1. **Wave 1: Foundation** (7 files) — App entry, config, Supabase client, models
2. **Wave 2: Auth & Onboarding** (10 files) — Login, signup, password reset, onboarding flow
3. **Wave 3: Core Data Layer** (6 files) — All repository implementations
4. **Wave 4: Main App Shell** (4 files) — Tab view, header, environment switcher
5. **Wave 5: Decks Feature** (8 files) — Deck list, creation, detail, word management
6. **Wave 6: Add Words Feature** (7 files) — Manual, photo, text, topics
7. **Wave 7: Training Feature** (11 files) — SRS engine, training modes, session flow
8. **Wave 8: Progress & Settings** (8 files) — Stats, calendar, all settings
9. **Wave 9: AI Integration** (3 files) — Groq service, AI protocol
10. **Wave 10: Polish & Platform** (5 files) — Haptics, RTL, coach marks, notifications

**Total estimated files: ~69 Swift files**
