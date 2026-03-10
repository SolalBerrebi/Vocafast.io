# Gaps and Risks Report

## Web Features with No Direct iOS Native Equivalent

### 1. "Add to Homescreen" Onboarding Step
- **Web feature:** PWA installation prompt with platform-specific instructions
- **iOS solution:** Skip entirely. Native iOS app is installed from App Store. Remove this step from onboarding flow (go directly from target language to first deck).

### 2. Service Worker / Offline Caching
- **Web feature:** Service worker registration for PWA offline support
- **iOS solution:** Use SwiftData for local caching. More capable and reliable than service worker caching.

### 3. Navigator.vibrate() Haptics
- **Web feature:** `navigator.vibrate()` with duration patterns
- **iOS solution:** `UIImpactFeedbackGenerator` and `UINotificationFeedbackGenerator`. iOS haptics are superior — more precise and more feedback types. Direct mapping: light→light, medium→medium, heavy→heavy, success→.success, error→.error.

### 4. Web Notifications API
- **Web feature:** `Notification.requestPermission()` and `Notification.permission`
- **iOS solution:** `UNUserNotificationCenter.requestAuthorization()`. Works identically in concept but uses APNs infrastructure. Local notifications for reminders/nudges work without a server.

### 5. Konsta UI Sheet Component
- **Web feature:** Bottom sheet with backdrop click dismissal
- **iOS solution:** SwiftUI `.sheet()` modifier with `@Binding` for presentation state. Native iOS sheets are more polished (interactive dismiss gesture, detent support in iOS 16+).

### 6. File Download via Blob URL
- **Web feature:** `fetch() + URL.createObjectURL(blob) + <a>.click()` for file exports
- **iOS solution:** Generate file data in memory, present `UIActivityViewController` via `.sheet` for sharing. More native and offers more share targets (AirDrop, Files, email, etc.).

### 7. File Input for Import
- **Web feature:** `<input type="file">` for CSV/JSON import
- **iOS solution:** `UIDocumentPickerViewController` wrapped in `UIViewControllerRepresentable`. Supports Files app, iCloud Drive, etc.

### 8. HTML Canvas for Image Compression
- **Web feature:** Canvas-based image resize and JPEG compression
- **iOS solution:** `UIImage` with `jpegData(compressionQuality: 0.8)` after resizing via `UIGraphicsImageRenderer`. More efficient and simpler.

### 9. CSS-based Animations / Framer Motion
- **Web feature:** Framer Motion for card flip, progress bars, transitions
- **iOS solution:** SwiftUI `.animation()`, `.transition()`, `withAnimation {}`, and `rotation3DEffect` for card flips. SwiftUI animations are GPU-accelerated and feel more native.

---

## Supabase Calls That May Behave Differently on Mobile

### 1. Network Interruptions During Training
- **Risk:** User answers a card, SRS update + review_log insert fires, but network drops mid-request.
- **Mitigation:** Queue pending reviews in SwiftData (`PendingReview` model). Process queue when connectivity returns. Apply SRS updates locally immediately for instant UI feedback.

### 2. Auth Token Expiry
- **Risk:** User leaves app backgrounded for hours, token expires.
- **Mitigation:** Supabase Swift SDK handles token refresh automatically. If refresh fails (e.g., refresh token also expired), catch the error and redirect to login screen.

### 3. Large Batch Inserts (Import)
- **Risk:** Importing 500 words in batches of 100 could timeout on slow mobile connections.
- **Mitigation:** Keep the existing batching strategy (100 per request). Show progress indicator. If a batch fails, report partial success.

### 4. Image Upload Size
- **Risk:** Base64-encoded images in JSON body could exceed Groq's payload limit on some images.
- **Mitigation:** Already handled — image compression to 1200px max dimension at 0.8 JPEG quality caps size at ~200-400KB base64. Same logic applies on iOS.

### 5. Concurrent Supabase Writes
- **Risk:** `switchEnvironment` does two sequential updates (deactivate all, activate one). If interrupted between, could leave no active environment.
- **Mitigation:** Consider combining into a single RPC call, or accept the race and handle "no active environment" gracefully by selecting the first available.

---

## Third-Party Web Libraries Needing iOS Replacement

| Web Library | Purpose | iOS Replacement |
|------------|---------|-----------------|
| `@supabase/ssr` + `@supabase/supabase-js` | Supabase client (browser + server) | `supabase-swift` (single package) |
| `konsta` (Konsta UI) | iOS-style UI components | Native SwiftUI (no library needed) |
| `framer-motion` | Animations | SwiftUI native animations |
| `zustand` | State management | SwiftUI `@Observable` / `@ObservableObject` |
| `zod` | Schema validation | Not needed — Swift's type system handles this |
| `tailwind-merge` / `clsx` | CSS class merging | Not applicable |
| `next` (Next.js) | Framework, routing, SSR | Not applicable — native app |

---

## Assumptions to Validate Before Migration

### 1. Supabase Project Configuration
- **Assumption:** The Supabase project's auth settings allow email/password sign-up with email confirmation enabled.
- **Validate:** Check Supabase dashboard → Auth → Settings.

### 2. Groq API Key Scope
- **Assumption:** The same Groq API key works from iOS client-side (no IP/origin restrictions).
- **Validate:** Groq API keys are typically unrestricted, but confirm there are no CORS-like restrictions for non-browser clients.

### 3. Groq Model Availability
- **Assumption:** `meta-llama/llama-4-scout-17b-16e-instruct` supports multimodal (image) input.
- **Validate:** The web app uses this model for both text and image extraction. Confirm the model accepts image_url content type.

### 4. Supabase RLS Compatibility with Swift SDK
- **Assumption:** All RLS policies work identically with the Supabase Swift SDK as they do with the JavaScript SDK.
- **Validate:** RLS is server-side and transport-agnostic, so this should work. But test with a simple query first.

### 5. Notification Preferences Table
- **Assumption:** The `notification_preferences` table exists in the production Supabase database (migration 003 has been run).
- **Validate:** Check if all 4 migrations have been applied.

### 6. Gamification Columns
- **Assumption:** The `profiles` table has `total_xp`, `level`, `streak_days`, `last_active_date`, `show_timer` columns and `training_sessions` has `duration_seconds`, `avg_response_time_ms`, `xp_earned` (migration 004).
- **Validate:** Confirm migration 004 has been applied.

### 7. Deep Links for Password Reset
- **Assumption:** Supabase password reset emails can be configured to use a custom URL scheme or universal link pointing to the iOS app.
- **Validate:** Configure Supabase auth redirect URLs to include the iOS app's URL scheme. May need an Associated Domains setup for universal links.

### 8. Audio Transcription Feature
- **Assumption:** Audio transcription (Whisper API route + AudioRecorder) is infrastructure-only — no UI exists to trigger it. The iOS app can skip this feature.
- **Validate:** Confirmed by code analysis — no page or component renders an audio recording button.

---

## Estimated Swift File Count

| Category | Count |
|----------|-------|
| App entry + Config | 2 |
| Core utilities | 5 |
| Data models (Supabase) | 8 |
| Data models (SwiftData) | 4 |
| Repositories | 8 |
| Services (AI, SRS, XP, Levels) | 8 |
| Auth views + viewmodel | 5 |
| Onboarding views + viewmodel | 4 |
| Main shell views | 2 |
| Decks views + viewmodels | 8 |
| Add Words views + viewmodel | 7 |
| Training views + viewmodels | 8 |
| Progress views + viewmodel | 4 |
| Settings views + viewmodel | 5 |
| Shared components | 4 |
| Extensions | 2 |
| **Total** | **~84 Swift files** |
