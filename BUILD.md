# Building the Android APK

The APK can't be produced inside the Claude Code sandbox (its network policy
blocks the Android SDK download, and cloud builds need *your* Expo login). Both
paths below run on your machine and are pre-configured — no setup beyond an Expo
account (free).

---

## Option A — EAS cloud build (recommended, no Android tooling needed)

Builds on Expo's servers and gives you a downloadable `.apk` link. You don't need
Android Studio or the SDK installed.

```bash
# 1. From the project root, log in to your (free) Expo account
npx eas-cli login

# 2. Link the project (creates an EAS project id, writes it to app.json)
npx eas-cli init

# 3. Build the APK (uses the "preview" profile in eas.json)
npx eas-cli build --platform android --profile preview
```

When it finishes (~10–20 min) the CLI prints a URL. Open it → **Download build** →
that's your `.apk`. Install it on any Android device (enable "install from unknown
sources"). The Supabase URL + anon key are already baked into the `preview` profile,
so sign-in, sync, and (once your `ANTHROPIC_API_KEY` secret is set) AI reflections
work immediately.

For a Play Store upload later, use `--profile production` (produces an `.aab`).

---

## Option B — Local build (needs Android SDK on your machine)

Requires Android Studio (or the command-line SDK) + JDK 17.

```bash
# Generate the native android/ project
npx expo prebuild --platform android

# Debug APK (installable, no signing key needed):
cd android && ./gradlew assembleDebug
#   → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (requires a signing keystore):
./gradlew assembleRelease
```

For a local build, put the two `EXPO_PUBLIC_*` values from `.env.example` into a
`.env` file first (see the repo `.env.example`), or the app runs in local-only mode.

---

## Quick alternative — run without building (fastest to *see* it)

```bash
npm install
npm start          # press "a" for Android, or scan the QR with Expo Go
```

Expo Go runs the app instantly on your phone without producing an APK — good for
trying it before committing to a full build.
