# AGENT.md — BSSB Project Context

> Read this first. It gives every agent session the same understanding of the project: what it is, how it's built, how to build/test it, and the current goals/constraints. Keep it accurate as the project evolves.

## 1. What this project is

**BSSB — Bulgarian Sunderland Supporters Branch** app for Sunderland AFC fans (events, RSVPs, comments/likes, news, fixtures, league table, team stats, user profiles, payments).

- **Mobile**: Expo (SDK 52) + React Native 0.76.7 + expo-router ~4.0.17 app, built with **EAS Build**, distributed as Android APKs.
- **Web**: Same codebase transpiles via `react-native-web` 0.19.13 (currently ~70% web-ready; full port is the current goal).
- **Backend**: Firebase (Auth, Firestore, Storage) — project **`safc-8863b`**.
- **API keys**: `config/config.ts` (news + football-data API keys).

## 2. Tech stack (from package.json)

- `expo ~52.0.37`, `react 18.3.1`, `react-native 0.76.7`
- `expo-router ~4.0.17` (typed routes enabled), `react-navigation` (bottom tabs)
- `firebase ^12.7.0` (web SDK; auth + firestore + storage)
- `expo-notifications ~0.29.14` (native push), `expo-device`, `expo-constants`
- `react-native-modal`, `react-native-modal-datetime-picker`, `expo-image-picker`
- `react-native-web 0.19.13` + `react-dom` (web support)
- `date-fns`, `axios`, `@react-native-async-storage/async-storage`, `@expo/vector-icons`

## 3. Key architecture facts

### 3.1 The native `android/` folder is COMMITTED (bare workflow)
- EAS detects the committed `android/` directory and treats the build as **bare workflow**: `app.json` native config (e.g. `android.package`, `googleServicesFile`) is **ignored at build time**; the native code is the source of truth.
- ⚠️ **Consequence**: if you change native config in `app.json`, you must run `npx expo prebuild` (or `npx expo run:android`) to sync changes into the `android/` folder **and commit them** — otherwise EAS builds from the last commit's native files.
- `expo-notifications`/`expo-router` configs live in `app.json` → `plugins`.

### 3.2 Firebase credentials (critical)
- `google-services.json` (root **and** `android/app/` copy) is **committed to git** — it is NOT a secret; it ships inside the APK. EAS Build needs it in the repo. Keep both copies in sync.
- **FCM V1 service account key** (`safc-8863b-firebase-adminsdk-*.json`) is uploaded to the **Expo dashboard only** (project → Credentials → Android → FCM V1 service account). It is a **server secret — never commit it**. `.gitignore` rules: `firebase-adminsdk-*.json` and `*firebase-adminsdk*.json`.
- `firebase.config.ts` (root) contains the web-app Firebase config; `config/firebase.ts` is the main client entry (`auth`, `db`, `storage`).

### 3.3 Push notification architecture (mobile only)
- **Token registration**: `AuthContext.tsx` → `setupNotifications(user.uid)` (`utils/simpleNotificationService.ts`) → `getExpoPushTokenAsync()` → saves token to **`deviceTokens/{tokenId}`** collection and `users/{uid}.pushToken`. **Expo push tokens only exist on native** — `getExpoPushTokenAsync` fails in a browser.
- **Sending**: `utils/pushNotificationService.ts` → `sendNotificationToAllUsers(...)` (queries `deviceTokens`, excludes a user id) and `sendNotificationToUser(uid, title, body, data)` → POST to `https://exp.host/--/api/v2/push/send`.
- **Trigger points** (all in `utils/eventService.ts`):
  - `createEvent` → `notifyAllUsers('New Event Created! 🎉', ...)`
  - `toggleEventLike` → `sendNotificationToUser(creatorId, 'New like ❤️', ...)`
  - `addEventComment` → `sendNotificationToUser(creatorId, 'New comment 💬', ...)`
  - `updateEventAttendance` → `sendNotificationToUser(creatorId, 'New RSVP 📋', ...)` (going/maybe/not going)
  - Payment confirmations also push (via `utils/userService.ts`).
- All event-related push payloads include `data: { eventId, type }`.
- **Tap-to-open deep linking** (already implemented, commit `1c5d149`):
  - `components/NotificationHandler.tsx` → on tap/cold-start routes `router.push('/(tabs)?eventId=...')` (events = index tab).
  - `app/(tabs)/index.tsx` reads `useLocalSearchParams().eventId` and opens the event detail modal.
### 3.4 Routing structure (expo-router)
- `app/index.tsx` → redirects to `/(auth)/login` (gate).
- `app/(auth)/login`, `signup` — Firebase email/password auth.
- `app/(tabs)/` — main tabs: **index (Events)**, **posts**, **news**, **table**, **fixtures**, and hidden **profile**. Custom red header via `_layout.tsx`.
- `app/profile.tsx` and `app/users.tsx` are root-level stack screens (nav via `router.push('/profile')`, `/users`).
- Notifications from the header: `components/NotificationBadge.tsx` is the **notification-center bell** (mounted in the red header next to the hamburger menu). It subscribes to the Firestore `notifications` feed (`utils/notificationFeedService.ts`), shows an unread-count badge, and opens a bottom-sheet list of cards; tapping a card marks it read and navigates via `/(tabs)?eventId=...`.

## 4. Build & test

### Commands
- `npx expo start --dev-client` — dev (Metro), fast JS reloads.
- `npx expo start --web` — web dev (React Native Web).
- `eas build --profile preview --platform android` — standalone APK (what users install).
- `eas build --profile development --platform android` — dev build (native config + Metro reloads).
- `npx tsc --noEmit` — type check.
- `npx expo export --platform web` — produces static web build in `dist/`.

### EAS profiles (eas.json)
- `development` — dev client, internal.
- `preview` — internal, Android **APK** build type.
- `production` — default.

### Type check status
Pre-existing (unrelated) `tsc` errors exist in `firebaseAdmin.ts`, `utils/notifications.ts`, and a catch-block `error` typing issue in `app/(tabs)/index.tsx`. Do not treat these as regressions; fix only if the task touches them.

## 5. Current project state

- Working tree clean at `1c5d149`.
- Recent completed work:
  - FCM V1 service account connected in Expo (Android push working, verified on 2 devices).
  - EAS build fixed by committing `google-services.json` (Google Services Gradle plugin now applies).
  - Notification deep-linking + RSVP push notifications implemented.

## 6. Current goal (the plan — see PLAN.md)

1. **Keep mobile push notifications exactly as-is.** Do not remove/replace the Expo push flow.
2. **Add a Firestore-backed in-app notification center** (badge counter + card list + tap-to-navigate) that works on **web AND mobile** — web gets this instead of web push (no VAPID/service worker; browser push is out of scope).
3. **Complete the web port** (platform-gate native-only calls, web fallbacks for image/date pickers, host the static build).

## 7. Non-negotiables / constraints

- **Never commit** `*firebase-adminsdk*.json`, `.env`, or any private key.
- **`firebaseAdmin.ts` and `utils/notifications.ts` have been removed** (dead/insecure client code that imported `firebase-admin` + a service-account private key). Never reintroduce `firebase-admin` into the client bundle — server-side work (e.g. FCM sends) belongs in a serverless function / Firebase Functions with the key injected as a secret.
- **`expo-notifications` is native-only.** Any notification code imported on web must be guarded with `Platform.OS === 'web'` or fail gracefully.
- **Web fallbacks:** `EventForm` uses `<input type="datetime-local">` on web; `expo-image-picker` works on web (skip the native permission step only); `utils/imageService.ts` uploads `data:`/Blob images to Cloudinary on web. Mobile paths are unchanged.
- **Don't break the Android bare workflow** — if a native change is needed, run prebuild and commit the `android/` diffs.
- UI theme: club red `#e21d38`, dark header, black splash.

## 8. FCM HTTP v1 push (service-account sender)

- **FCM V1** = Firebase Cloud Messaging **HTTP v1** API — `POST https://fcm.googleapis.com/v1/projects/<project>/messages:send`. This is Google's current Android push API (it supersedes the legacy `send` / topic endpoints).
- A **service account** is a Google Cloud identity (a robot account) used as the server-to-server principal that authenticates FCM sends. The project key is `safc-8863b-firebase-adminsdk-fbsvc-809dbf848a.json` (git-ignored via `*.firebase-adminsdk*.json`, `*firebase-adminsdk-*.json` and `serviceAccountKey.json`). Per §7 it is uploaded to the **Expo dashboard only** (project → Credentials → Android → FCM V1 service account) and must **never** be bundled into the client app.
- **Client push (mobile) is unchanged and verified on-device.** Mobile still uses the Expo push gateway via `expo-notifications` + `utils/pushNotificationService.ts` (`https://exp.host/--/api/v2/push/send`). Do not remove/replace it (§6.1).
- **Server-side sender utility (verified):** `scripts/fcmV1.js` + `scripts/sendFcmV1.js` — a dependency-free FCM HTTP v1 sender that mints its own OAuth2 access token from the service-account JSON by self-signing an RS256 JWT (scope `https://www.googleapis.com/auth/firebase.messaging`) and exchanging it at `https://oauth2.googleapis.com/token`, then POSTing to the `messages:send` endpoint. Verified live:
  - `node scripts/sendFcmV1.js --token-only` → returns a real `ya29.*` access token (masked).
  - `node scripts/sendFcmV1.js --validate-only` → HTTP 200 from `fcm.googleapis.com/v1/projects/safc-8863b/messages:send`.
  - Flags: `--help`, `--dry-run` (build JWT + payload, no network), `--token-only` (fetch token only), `--validate-only` (validate auth + schema, no delivery), or `<token> "<title>" "<body>" [dataJson]` to send.
- This sender is the reusable building block for the deferred "move push sending to Firebase Functions" work (see PLAN.md, Phase 5 / out-of-scope). It is **server-side only** — never `require` it from the Expo client bundle, and never commit the service-account key.


