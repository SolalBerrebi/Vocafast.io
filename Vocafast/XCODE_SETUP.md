# Vocafast iOS — Xcode Project Setup Guide

## Prerequisites

- **Xcode 15.0+** (required for iOS 17 + SwiftData)
- **macOS Sonoma 14.0+** (required for Xcode 15)
- **Apple Developer account** (free works for simulator; paid for device testing)
- Your **Supabase project URL** and **anon key** (same as the web app)
- A **Groq API key** from [console.groq.com](https://console.groq.com)

---

## Step 1: Create the Xcode Project

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App** → Next
3. Configure:
   - **Product Name:** `Vocafast`
   - **Team:** Your Apple Developer team (or Personal Team)
   - **Organization Identifier:** `com.yourname` (e.g., `com.solal`)
   - **Bundle Identifier:** will auto-fill as `com.yourname.Vocafast`
   - **Interface:** **SwiftUI**
   - **Language:** **Swift**
   - **Storage:** **None** (we configure SwiftData manually in code)
4. Save the project **outside** the `Vocafast.io` repo (e.g., `~/Desktop/Vocafast-iOS/`)

> **Why outside?** The generated Swift files live in `Vocafast.io/Vocafast/` for version control, but the `.xcodeproj` is best managed separately to avoid polluting the web repo with Xcode metadata.

---

## Step 2: Delete the Default Files

Xcode creates starter files you don't need. In the Project Navigator, delete:
- `ContentView.swift`
- `VocafastApp.swift` (we have our own)
- `Assets.xcassets` — **keep this one**, you'll add the app icon here later

---

## Step 3: Add the Supabase Swift SDK

1. In Xcode: **File → Add Package Dependencies...**
2. In the search field, paste: `https://github.com/supabase/supabase-swift.git`
3. Set **Dependency Rule** to **Up to Next Major Version**, starting from `2.0.0`
4. Click **Add Package**
5. In the product selection dialog, check **Supabase** and click **Add Package**

This pulls in Auth, PostgREST, Realtime, Storage, and Functions.

---

## Step 4: Copy the Swift Source Files

Copy the entire contents of `Vocafast.io/Vocafast/` (excluding `Package.swift` and `XCODE_SETUP.md`) into your Xcode project:

### Option A: Drag & Drop (Recommended)

1. In Finder, open `Vocafast.io/Vocafast/`
2. Select all folders and files:
   - `VocafastApp.swift`
   - `Config.swift`
   - `Core/`
   - `Models/`
   - `Repositories/`
   - `Services/`
   - `Features/`
   - `Components/`
   - `Extensions/`
3. Drag them into the Xcode Project Navigator, dropping them under the `Vocafast` group
4. In the dialog:
   - Check **"Copy items if needed"**
   - Select **"Create groups"** (not folder references)
   - Make sure your `Vocafast` target is checked
   - Click **Finish**

### Option B: Add Files Manually

1. Right-click the `Vocafast` group → **Add Files to "Vocafast"...**
2. Navigate to `Vocafast.io/Vocafast/`
3. Select all folders/files (except `Package.swift` and this guide)
4. Check **"Copy items if needed"** and **"Create groups"**
5. Click **Add**

**Do NOT copy:** `Package.swift` (it's a reference for SPM dependencies only — you already added Supabase via Xcode in Step 3).

---

## Step 5: Configure Your Credentials

Open `Config.swift` and replace the placeholder values:

```swift
// MARK: - Supabase
static let supabaseURL = URL(string: "https://YOUR-PROJECT.supabase.co")!
static let supabaseAnonKey = "eyJ..."  // Your Supabase anon key

// MARK: - Groq AI
static let groqAPIKey = "gsk_..."  // Your Groq API key
```

You can find these values in:
- **Supabase:** Dashboard → Settings → API → Project URL & `anon` key (same values as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your web `.env.local`)
- **Groq:** [console.groq.com](https://console.groq.com) → API Keys

> **Security note:** For production, move these to a `.xcconfig` file excluded from git. For development/testing, hardcoding is fine.

---

## Step 6: Configure Info.plist Permissions

The app uses the camera and photo library. Add these keys to your `Info.plist`:

1. Select your project in the navigator → select the **Vocafast** target
2. Go to the **Info** tab
3. Under **Custom iOS Target Properties**, click `+` and add:

| Key | Type | Value |
|-----|------|-------|
| `NSCameraUsageDescription` | String | `Vocafast uses the camera to capture text and images for vocabulary extraction.` |
| `NSPhotoLibraryUsageDescription` | String | `Vocafast accesses your photo library to select images for vocabulary extraction.` |

If you also plan to enable notifications, you don't need an Info.plist entry — the app requests permission at runtime via `UNUserNotificationCenter`.

---

## Step 7: Set the Deployment Target

1. Select your project in the navigator → select the **Vocafast** target
2. Go to the **General** tab
3. Set **Minimum Deployments → iOS** to **17.0**

---

## Step 8: Build & Run

1. Select an iPhone simulator (iPhone 15 Pro recommended) or connect a physical device
2. Press **Cmd+B** to build
3. If it builds successfully, press **Cmd+R** to run

---

## Troubleshooting

### "No such module 'Supabase'"
- Xcode hasn't finished resolving the package. Wait for the package resolution to complete (check the status bar at the top).
- Try: **File → Packages → Resolve Package Versions**
- If it persists: **File → Packages → Reset Package Caches**, then build again.

### "No such module 'SwiftData'"
- Make sure your deployment target is iOS 17.0+ and you're using Xcode 15+.

### Duplicate symbol / "VocafastApp" already defined
- You forgot to delete the default `VocafastApp.swift` that Xcode created (Step 2). Delete it — we use our own.

### "'@main' attribute can only apply to one type"
- Same as above — two files have `@main`. Delete Xcode's auto-generated app entry point.

### Build errors in Supabase SDK
- Make sure you're on Xcode 15.0+ and the package version is 2.x. If you accidentally added 1.x, remove the package and re-add with `from: "2.0.0"`.

### Camera doesn't work on Simulator
- The iOS Simulator doesn't support the camera. Use a physical device, or test the photo library picker instead.

### "Missing return in closure" or type errors
- Clean the build folder: **Product → Clean Build Folder** (Cmd+Shift+K), then rebuild.

---

## Project Structure (What You Should See)

After setup, your Project Navigator should look like:

```
Vocafast/
├── VocafastApp.swift          ← App entry point
├── Config.swift               ← Supabase + Groq credentials
├── Core/
│   ├── AppState.swift         ← Global auth/environment state
│   ├── RootView.swift         ← Auth/Onboarding/Main router
│   ├── SupabaseManager.swift  ← Supabase client singleton
│   ├── HapticsManager.swift
│   ├── RTLHelper.swift
│   └── NotificationScheduler.swift
├── Models/                    ← Codable structs + SwiftData
├── Repositories/              ← Supabase CRUD operations
├── Services/                  ← SRS engine, AI, import/export
├── Features/
│   ├── Auth/                  ← Login, Signup, Forgot/Reset Password
│   ├── Onboarding/            ← Language selection + first deck
│   ├── Main/                  ← Tab bar shell
│   ├── Decks/                 ← Deck list, detail, word management
│   ├── AddWords/              ← Manual, Photo, Text, Topic capture
│   ├── Training/              ← Flashcard, MCQ, Typing + SRS
│   ├── Progress/              ← Stats + streak calendar
│   └── Settings/              ← Account, languages, import, notifications
├── Components/                ← Shared UI (XPPill, ImagePicker, etc.)
├── Extensions/                ← Color+Hex, Date+Helpers
└── Assets.xcassets/           ← App icon + colors (add your own)
```

---

## Optional: App Icon

1. Prepare a 1024x1024px PNG of your app icon (no transparency, no rounded corners — iOS applies them automatically)
2. In Xcode, open `Assets.xcassets`
3. Select `AppIcon`
4. Drag your 1024x1024 image into the `All Sizes` slot (Xcode 15+ only needs one size)

---

## Next Steps After First Build

1. **Run on Simulator** — create an account, go through onboarding, add a deck
2. **Test on physical device** — camera capture, haptics, and notifications only work on real hardware
3. **Add your app icon** and launch screen
4. **Move credentials to .xcconfig** before shipping to TestFlight/App Store
