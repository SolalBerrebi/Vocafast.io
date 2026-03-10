# Vocafast Data Models

## Supabase Tables

### 1. profiles
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | — | References `auth.users` ON DELETE CASCADE |
| display_name | text | YES | NULL | |
| native_lang | text | NO | 'en' | ISO 639-1 code |
| onboarding_completed | boolean | NO | false | |
| total_xp | integer | NO | 0 | Gamification |
| level | integer | NO | 1 | |
| streak_days | integer | NO | 0 | |
| last_active_date | date | YES | NULL | YYYY-MM-DD |
| show_timer | boolean | NO | true | Training timer visibility pref |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**RLS:** Users can SELECT/UPDATE/INSERT own profile (auth.uid() = id).
**Trigger:** `handle_new_user()` auto-creates profile + notification_preferences on signup.

### 2. language_environments
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| user_id | uuid (FK→profiles) | NO | — | ON DELETE CASCADE |
| target_lang | text | NO | — | ISO 639-1 code |
| is_active | boolean | NO | false | Only one active per user |
| color | text | NO | '#007AFF' | Hex color |
| icon | text | NO | '🌍' | Flag emoji |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**RLS:** Users can CRUD where auth.uid() = user_id.

### 3. decks
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| environment_id | uuid (FK→language_environments) | NO | — | ON DELETE CASCADE |
| name | text | NO | — | |
| color | text | NO | '#007AFF' | |
| icon | text | NO | '📚' | |
| word_count | integer | NO | 0 | Auto-maintained by trigger |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**RLS:** Users can CRUD via join to language_environments.user_id = auth.uid().
**Trigger:** `update_deck_word_count()` auto-increments/decrements on word INSERT/DELETE.

### 4. words
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| deck_id | uuid (FK→decks) | NO | — | ON DELETE CASCADE |
| word | text | NO | — | Target language |
| translation | text | NO | — | Native language |
| context_sentence | text | YES | NULL | Optional context |
| source_type | text | NO | 'manual' | CHECK: manual, photo, audio, conversation, text, topic |
| ease_factor | real | NO | 2.5 | SM-2 ease factor |
| interval_days | integer | NO | 0 | Days until next review |
| repetitions | integer | NO | 0 | Successful review count |
| next_review_at | timestamptz | NO | now() | When to review next |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**RLS:** Users can CRUD via join decks→language_environments→user_id = auth.uid().

### 5. training_sessions
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| environment_id | uuid (FK→language_environments) | NO | — | ON DELETE CASCADE |
| deck_id | uuid (FK→decks) | YES | — | ON DELETE SET NULL |
| mode | text | NO | — | CHECK: flashcard, multiple_choice, typing |
| correct | integer | NO | 0 | |
| incorrect | integer | NO | 0 | |
| started_at | timestamptz | NO | now() | |
| finished_at | timestamptz | YES | NULL | |
| duration_seconds | integer | YES | NULL | |
| avg_response_time_ms | integer | YES | NULL | |
| xp_earned | integer | NO | 0 | |

**RLS:** Users can SELECT/INSERT/UPDATE via join to language_environments.user_id = auth.uid().

### 6. review_logs
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| session_id | uuid (FK→training_sessions) | NO | — | ON DELETE CASCADE |
| word_id | uuid (FK→words) | NO | — | ON DELETE CASCADE |
| quality | integer | NO | — | CHECK: 0-5 (SM-2 quality) |
| was_correct | boolean | NO | — | |
| created_at | timestamptz | NO | now() | |

**RLS:** Users can SELECT/INSERT via join training_sessions→language_environments→user_id = auth.uid().

### 7. notification_preferences
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid (PK) | NO | gen_random_uuid() | |
| user_id | uuid (FK→profiles, UNIQUE) | NO | — | ON DELETE CASCADE |
| notifications_enabled | boolean | NO | true | |
| daily_goal_enabled | boolean | NO | true | |
| daily_goal_words | integer | NO | 20 | |
| daily_goal_sessions | integer | NO | 1 | |
| reminder_enabled | boolean | NO | true | |
| reminder_time | time | NO | '09:00' | |
| reminder_days | boolean[] | NO | all true | [Mon..Sun] |
| streak_reminder_enabled | boolean | NO | true | |
| streak_reminder_time | time | NO | '20:00' | |
| review_due_enabled | boolean | NO | true | |
| achievements_enabled | boolean | NO | true | |
| inactivity_nudge_enabled | boolean | NO | true | |
| inactivity_nudge_days | integer | NO | 3 | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**RLS:** Users can SELECT/INSERT/UPDATE where auth.uid() = user_id.

---

## Swift Structs

### Profile.swift
```swift
struct Profile: Codable, Identifiable {
    let id: UUID
    var displayName: String?
    var nativeLang: String
    var onboardingCompleted: Bool
    var totalXp: Int
    var level: Int
    var streakDays: Int
    var lastActiveDate: String?  // "YYYY-MM-DD"
    var showTimer: Bool
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case nativeLang = "native_lang"
        case onboardingCompleted = "onboarding_completed"
        case totalXp = "total_xp"
        case level
        case streakDays = "streak_days"
        case lastActiveDate = "last_active_date"
        case showTimer = "show_timer"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

### LanguageEnvironment.swift
```swift
struct LanguageEnvironment: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var targetLang: String
    var isActive: Bool
    var color: String
    var icon: String
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case targetLang = "target_lang"
        case isActive = "is_active"
        case color, icon
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

### Deck.swift
```swift
struct Deck: Codable, Identifiable {
    let id: UUID
    let environmentId: UUID
    var name: String
    var color: String
    var icon: String
    var wordCount: Int
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case environmentId = "environment_id"
        case name, color, icon
        case wordCount = "word_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

### Word.swift
```swift
enum WordSourceType: String, Codable {
    case manual, photo, audio, conversation, text, topic
}

struct Word: Codable, Identifiable {
    let id: UUID
    let deckId: UUID
    var word: String
    var translation: String
    var contextSentence: String?
    var sourceType: WordSourceType
    var easeFactor: Double
    var intervalDays: Int
    var repetitions: Int
    var nextReviewAt: String
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case deckId = "deck_id"
        case word, translation
        case contextSentence = "context_sentence"
        case sourceType = "source_type"
        case easeFactor = "ease_factor"
        case intervalDays = "interval_days"
        case repetitions
        case nextReviewAt = "next_review_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

### TrainingSession.swift
```swift
enum TrainingMode: String, Codable {
    case flashcard, multiple_choice, typing
}

struct TrainingSession: Codable, Identifiable {
    let id: UUID
    let environmentId: UUID
    var deckId: UUID?
    var mode: TrainingMode
    var correct: Int
    var incorrect: Int
    let startedAt: String
    var finishedAt: String?
    var durationSeconds: Int?
    var avgResponseTimeMs: Int?
    var xpEarned: Int

    enum CodingKeys: String, CodingKey {
        case id
        case environmentId = "environment_id"
        case deckId = "deck_id"
        case mode, correct, incorrect
        case startedAt = "started_at"
        case finishedAt = "finished_at"
        case durationSeconds = "duration_seconds"
        case avgResponseTimeMs = "avg_response_time_ms"
        case xpEarned = "xp_earned"
    }
}
```

### ReviewLog.swift
```swift
struct ReviewLog: Codable, Identifiable {
    let id: UUID
    let sessionId: UUID
    let wordId: UUID
    var quality: Int  // 0-5
    var wasCorrect: Bool
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case sessionId = "session_id"
        case wordId = "word_id"
        case quality
        case wasCorrect = "was_correct"
        case createdAt = "created_at"
    }
}
```

### NotificationPreferences.swift
```swift
struct NotificationPreferences: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var notificationsEnabled: Bool
    var dailyGoalEnabled: Bool
    var dailyGoalWords: Int
    var dailyGoalSessions: Int
    var reminderEnabled: Bool
    var reminderTime: String       // "HH:MM:SS" from DB
    var reminderDays: [Bool]       // [Mon..Sun]
    var streakReminderEnabled: Bool
    var streakReminderTime: String  // "HH:MM:SS"
    var reviewDueEnabled: Bool
    var achievementsEnabled: Bool
    var inactivityNudgeEnabled: Bool
    var inactivityNudgeDays: Int
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case notificationsEnabled = "notifications_enabled"
        case dailyGoalEnabled = "daily_goal_enabled"
        case dailyGoalWords = "daily_goal_words"
        case dailyGoalSessions = "daily_goal_sessions"
        case reminderEnabled = "reminder_enabled"
        case reminderTime = "reminder_time"
        case reminderDays = "reminder_days"
        case streakReminderEnabled = "streak_reminder_enabled"
        case streakReminderTime = "streak_reminder_time"
        case reviewDueEnabled = "review_due_enabled"
        case achievementsEnabled = "achievements_enabled"
        case inactivityNudgeEnabled = "inactivity_nudge_enabled"
        case inactivityNudgeDays = "inactivity_nudge_days"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

---

## Relationships

```
auth.users (1) ──→ (1) profiles
profiles (1) ──→ (N) language_environments
profiles (1) ──→ (1) notification_preferences
language_environments (1) ──→ (N) decks
language_environments (1) ──→ (N) training_sessions
decks (1) ──→ (N) words
decks (1) ──→ (N) training_sessions (nullable, SET NULL on delete)
training_sessions (1) ──→ (N) review_logs
words (1) ──→ (N) review_logs
```

---

## SwiftData @Model Counterparts

These models are used for offline caching only. They mirror the Supabase structs but are persisted locally.

### CachedDeck.swift
```swift
@Model
class CachedDeck {
    @Attribute(.unique) var id: UUID
    var environmentId: UUID
    var name: String
    var color: String
    var icon: String
    var wordCount: Int
    var lastSynced: Date
}
```

### CachedWord.swift
```swift
@Model
class CachedWord {
    @Attribute(.unique) var id: UUID
    var deckId: UUID
    var word: String
    var translation: String
    var contextSentence: String?
    var sourceType: String
    var easeFactor: Double
    var intervalDays: Int
    var repetitions: Int
    var nextReviewAt: Date
    var lastSynced: Date
}
```

### PendingReview.swift
```swift
@Model
class PendingReview {
    var id: UUID = UUID()
    var sessionId: UUID
    var wordId: UUID
    var quality: Int
    var wasCorrect: Bool
    var newEaseFactor: Double
    var newInterval: Int
    var newRepetitions: Int
    var nextReviewAt: Date
    var createdAt: Date = Date()
}
```

### CachedStats.swift
```swift
@Model
class CachedStats {
    @Attribute(.unique) var environmentId: UUID
    var totalWords: Int
    var masteredWords: Int
    var totalSessions: Int
    var totalCorrect: Int
    var totalIncorrect: Int
    var sessionDates: [String]  // ["YYYY-MM-DD"]
    var lastSynced: Date
}
```

---

## Auth-Scoped Queries

All Supabase queries are automatically scoped by RLS policies. The iOS app must:
1. Always have a valid auth session before making queries
2. Never manually filter by user_id in queries — RLS handles it
3. Filter by `environment_id` for environment-specific data (decks, sessions)
4. Access to words and review_logs is controlled via chain: words→decks→environments→user_id
