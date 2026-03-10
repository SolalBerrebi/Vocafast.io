# Migration Decisions Log

## 1. Supabase Auth API Shape
- **Decision:** Used `supabase.auth.signIn(email:password:)` and `supabase.auth.signUp(email:password:data:)` per Supabase Swift SDK v2 API.
- **Alternatives:** v1 API with different parameter names.
- **Reason:** The v2 API is current and matches the `supabase-swift` package from `2.0.0`.

## 2. AnyJSON for Supabase Insert/Update
- **Decision:** Used `AnyJSON` enum (`.string()`, `.integer()`, `.bool()`, `.double()`) for dynamic dictionary inserts/updates.
- **Alternatives:** Typed `Encodable` structs for every DB operation.
- **Reason:** `AnyJSON` is more flexible for mixed-type dictionaries and matches how the SDK handles heterogeneous data. Used typed `Codable` structs for reads.

## 3. ProgressView naming conflict
- **Decision:** Named the progress screen `ProgressStatsView` instead of `ProgressView` to avoid conflict with SwiftUI's built-in `ProgressView`.
- **Alternatives:** Keep `ProgressView` and use `SwiftUI.ProgressView` everywhere else.
- **Reason:** Avoiding the name collision prevents subtle bugs and makes code clearer.

## 4. Timer in Training Session
- **Decision:** Used a `Timer.scheduledTimer` for the elapsed time counter in `TrainingSessionView`.
- **Alternatives:** SwiftUI `TimelineView`.
- **Reason:** `Timer` is simpler for a basic seconds counter and avoids unnecessary view redraws from `TimelineView`.

## 5. Word model `Identifiable` conformance via existing `id` field
- **Decision:** All models use their Supabase `id: UUID` as the `Identifiable` requirement.
- **Alternatives:** Synthetic IDs.
- **Reason:** The UUID primary keys from Supabase are perfect for SwiftUI list identifiers.

## 6. ExtractedWord ID generation
- **Decision:** `ExtractedWord` uses a client-side `UUID()` as its `id` since it's a temporary model before persistence.
- **Alternatives:** Use array index.
- **Reason:** SwiftUI `ForEach` works best with stable `Identifiable` items. Using index-based ID causes animation glitches when toggling selection.

## 7. Offline caching deferred
- **Decision:** SwiftData models (`CachedDeck`, `CachedWord`, `PendingReview`, `CachedStats`) are defined but not actively populated/read in v1.
- **Alternatives:** Full offline-first architecture with sync engine.
- **Reason:** The web app is online-only. Adding offline caching is a v2 enhancement. The models are ready for it.

## 8. No KeychainHelper file needed
- **Decision:** Omitted `KeychainHelper.swift` from the final output since Supabase Swift SDK handles Keychain storage automatically.
- **Alternatives:** Write a manual Keychain wrapper.
- **Reason:** The SDK's `AuthClient` stores/refreshes tokens in Keychain by default. No manual management needed.

## 9. Conversation AI feature excluded
- **Decision:** The AI conversation endpoint (chat with language tutor) is not implemented in this migration.
- **Alternatives:** Port it.
- **Reason:** The web app's conversation feature uses the pluggable AI provider (not Groq directly) and there's no dedicated UI page for it. It can be added later.

## 10. Package.swift included for reference
- **Decision:** Included a `Package.swift` for SPM dependency reference, but the actual Xcode project should be created in Xcode with "Add Package Dependency" pointing to `supabase-swift`.
- **Alternatives:** Full `.xcodeproj` generation.
- **Reason:** Xcode project files are binary/XML and best created by Xcode itself. The `Package.swift` documents the single dependency.
