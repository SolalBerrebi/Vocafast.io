# Vocafast iOS UI Map

## Complete Screen Inventory

| # | Screen Name | Web Route | SwiftUI View | Parent Container | Notes |
|---|------------|-----------|-------------|-----------------|-------|
| 1 | Login | `/login` | `LoginView` | NavigationStack (Auth) | Full screen |
| 2 | Signup | `/signup` | `SignupView` | NavigationStack (Auth) | Full screen |
| 3 | Forgot Password | `/forgot-password` | `ForgotPasswordView` | NavigationStack (Auth) | Full screen |
| 4 | Reset Password | `/reset-password` | `ResetPasswordView` | NavigationStack (Auth) | Full screen, deep link entry |
| 5 | Native Language | `/native-lang` | `NativeLangView` | NavigationStack (Onboarding) | Step 1/3 |
| 6 | Target Language | `/target-lang` | `TargetLangView` | NavigationStack (Onboarding) | Step 2/3 |
| 7 | First Deck | `/first-deck` | `FirstDeckView` | NavigationStack (Onboarding) | Step 3/3 |
| 8 | Decks List | `/decks` | `DecksView` | TabView > NavigationStack | Tab 1 |
| 9 | New Deck | `/decks/new` | `NewDeckView` | NavigationStack (pushed) | |
| 10 | Deck Detail | `/decks/[deckId]` | `DeckDetailView` | NavigationStack (pushed) | |
| 11 | Add Words | `/decks/[deckId]/add` | `AddWordsView` | NavigationStack (pushed) | Tabbed content |
| 12 | Training Launcher | `/decks/[deckId]/train` | `TrainingLauncherView` | NavigationStack (pushed) | |
| 13 | Training Session | `/train/[sessionId]` | `TrainingSessionView` | Full screen cover | No tab bar |
| 14 | Session Summary | (inline) | `SessionSummaryView` | Full screen cover | Replaces training session |
| 15 | Progress | `/progress` | `ProgressView` | TabView > NavigationStack | Tab 2 |
| 16 | Settings | `/settings` | `SettingsView` | TabView > NavigationStack | Tab 3 |

## Navigation Hierarchy Tree

```
RootView
├── AuthFlow (NavigationStack)
│   ├── LoginView
│   │   ├── → SignupView (push)
│   │   └── → ForgotPasswordView (push)
│   ├── SignupView
│   │   └── → LoginView (push)
│   ├── ForgotPasswordView
│   │   └── → LoginView (push)
│   └── ResetPasswordView (deep link)
│       └── → MainTabView (on success)
│
├── OnboardingFlow (NavigationStack)
│   ├── NativeLangView
│   │   └── → TargetLangView (push)
│   ├── TargetLangView
│   │   └── → FirstDeckView (push)
│   └── FirstDeckView
│       └── → MainTabView (on complete)
│
└── MainTabView (TabView)
    ├── Tab 1: Decks (NavigationStack)
    │   ├── DecksView
    │   │   ├── → NewDeckView (push)
    │   │   └── → DeckDetailView (push)
    │   │       ├── → AddWordsView (push)
    │   │       └── → TrainingLauncherView (push)
    │   │           └── → TrainingSessionView (fullScreenCover)
    │   │               └── SessionSummaryView (inline replacement)
    │   └── Header: [XPPillView] [EnvironmentSwitcherView]
    │
    ├── Tab 2: Progress (NavigationStack)
    │   └── ProgressView
    │       └── Header: [XPPillView] [EnvironmentSwitcherView]
    │
    └── Tab 3: Settings (NavigationStack)
        └── SettingsView
            └── Header: [XPPillView] [EnvironmentSwitcherView]
```

## Tab Bar Structure

| Tab | Label | Icon (SF Symbol) | View |
|-----|-------|-------------------|------|
| 1 | Decks | `rectangle.stack` | DecksView |
| 2 | Progress | `chart.bar` | ProgressView |
| 3 | Settings | `gearshape` | SettingsView |

The tab bar is visible on all 3 main screens and their child views (pushed into NavigationStack), EXCEPT during training sessions which use `.fullScreenCover()`.

## Header Component

Present on all 3 main tab screens (between navigation bar and content):
- **Left:** `XPPillView` — Shows level emoji + level name + XP progress bar
- **Right:** `EnvironmentSwitcherView` — Dropdown showing active language flag + name, tappable to switch

## All Modals, Sheets, and Overlays

| Sheet/Modal | Triggered From | Type | Contents |
|------------|---------------|------|----------|
| Edit Word | DeckDetailView (tap word) | `.sheet` | Edit word, translation, context. Save/Delete buttons. |
| Add Language | SettingsView | `.sheet` | Language list with radio selection + "Add" button |
| Delete Language | SettingsView | `.sheet` or `.confirmationDialog` | Warning message + Cancel/Delete buttons |
| Change Password | SettingsView | `.sheet` | New password + confirm + Save |
| Daily Goal Edit | SettingsView | `.sheet` | Words/day slider + sessions/day picker |
| Environment Switcher | HeaderView (all tabs) | `.menu` or popover | List of environments to switch |
| Training Session | TrainingLauncherView | `.fullScreenCover` | Full training experience |
| Coach Mark | DecksView, AddWordsView | Overlay | Dismissable tooltip (first visit only) |

## Shared/Reusable Components

| Component | SwiftUI View | Used By |
|-----------|-------------|---------|
| Deck Card | `DeckCardView` | DecksView |
| Word Row | `WordRowView` | DeckDetailView |
| Stats Card | `StatsCardView` | ProgressView, TrainingLauncherView |
| Streak Calendar | `StreakCalendarView` | ProgressView |
| XP Pill | `XPPillView` | HeaderView (all tabs) |
| Environment Switcher | `EnvironmentSwitcherView` | HeaderView (all tabs) |
| Coach Mark | `CoachMarkView` | DecksView, AddWordsView |
| Word Review List | `WordReviewList` | PhotoCaptureSection, TextExtractionSection, TopicGenerationSection |
| Image Picker | `ImagePicker` | PhotoCaptureSection |
| Flash Card | `FlashCardView` | TrainingSessionView |
| Multiple Choice | `MultipleChoiceView` | TrainingSessionView |
| Typing Challenge | `TypingChallengeView` | TrainingSessionView |
| Session Summary | `SessionSummaryView` | TrainingSessionView |
