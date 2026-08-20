# PLAN.md — New Version Plan: Web App + In-App Notification Center

> Companion to AGENT.md (project context). This is the actionable checklist for the next version.
> **Guiding principle (confirmed with the project owner):**
> - 📱 **Mobile keeps the existing push notification flow untouched.**
> - 🌐 **Web gets a Firestore-backed in-app notification center** (badge counter + notification cards + tap-to-navigate). No web push, no VAPID, no service worker.
> - Both share one notification feed in Firestore; web-only users see notifications while logged in.

---

## Phase 0 — Groundwork (small)

- [x] Create a `notifications` collection in Firestore. Design (per-user documents):
  ```ts
  notifications/{autoId} {
    userId: string,          // recipient
    type: string,            // 'new_event' | 'like' | 'comment' | 'attendance' | 'payment_confirmed'
    title: string,
    message: string,
    eventId?: string,        // for tap-to-navigate
    read: boolean,           // default false
    createdAt: serverTimestamp()
  }
  ```
- [x] Add Firestore indexes if a compound query (userId + createdAt desc) requires it (`firestore.indexes.json`).
- [x] Check `firestore.rules` — allow users to read/write only their own `notifications/{id}` (where `userId == request.auth.uid`). Add rules accordingly.
  > ⚠️ **Needs deploy** (Firebase CLI not installed locally): `npx firebase-tools deploy --only firestore:rules,firestore:indexes` after `firebase login`.

## Phase 1 — Notification feed service (shared web + mobile)

- [x] New `utils/notificationFeedService.ts`:
  - [x] `addNotification(userId, { type, title, message, eventId? })` → `addDoc` to `notifications`.
  - [x] `addNotificationToAllUsers(notification, excludeUserId?)` → broadcast feed writes (mirrors `notifyAllUsers`).
  - [x] `subscribeToNotifications(userId, callback)` → `onSnapshot` query `where('userId', '==', userId)` ordered by `createdAt desc`.
  - [x] `markNotificationRead(notificationId)` → `updateDoc({ read: true })`.
  - [x] `markAllNotificationsRead(userId)` (optional).
- [x] Wire the **same triggers that already send mobile push** to ALSO write a feed doc (in `utils/eventService.ts`; keep push calls untouched):
  - [x] `createEvent` → feed entry for all users (`addNotificationToAllUsers`, excludes creator).
  - [x] `toggleEventLike` → feed entry for the event creator.
  - [x] `addEventComment` → feed entry for the event creator.
  - [x] `updateEventAttendance` → feed entry for the event creator.
  - [x] Payment confirmed → feed entry in `toggleUserPaidStatus` (`utils/userService.ts`).
- [x] Confirm mobile push calls remain byte-for-byte unchanged (regression check).
  > ℹ️ Note: the `getUserPushTokens`/`sendPushNotification` helpers in `utils/userService.ts` are currently **unused (dead code)** — the payment push is not actually wired to send. Only the feed entry was added; the mobile push for payments is unchanged (it never fired).

## Phase 2 — Notification center UI (works on web AND mobile)

- [x] Evolve `components/NotificationBadge.tsx` (currently an unseen-events counter) into the notification bell:
  - [x] Subscribes to `subscribeToNotifications(user.uid)`.
  - [x] Badge shows **unread count** (sum of `read === false`).
- [x] New notification list UI (screen or modal — implemented as a bottom-sheet `Modal` inside `NotificationBadge.tsx`):
  - [x] Cards with `title`, `message`, relative timestamp (`date-fns`).
  - [x] Unread styling until opened.
  - [x] **Tap card → navigate to the event** via existing deep link `router.push('/(tabs)?eventId=...')` and call `markNotificationRead`.
  - [x] Empty state.
- [x] Keep header consistent (the bell lives in the custom red header via `app/(tabs)/_layout.tsx`).

## Phase 3 — Web readiness / platform gating

- [ ] **Platform-gate `expo-notifications` usage** — `getExpoPushTokenAsync` / `setNotificationHandler` / listeners must not run on web:
  - `utils/simpleNotificationService.ts` `setupNotifications()`: early-return on `Platform.OS === 'web'`.
  - `contexts/AuthContext.tsx`: only call `setupNotifications` on native.
  - `components/NotificationHandler.tsx` + `MainScreen`: only mount on native (or make handlers no-ops on web).
  - `components/NotificationSettings.tsx`: hide/disable push toggle on web.
- [ ] **Web fallback for `expo-image-picker`** (`app/(tabs)/index.tsx`, `components/EventForm.tsx`): use `<input type="file">` on web.
- [ ] **Web fallback for `react-native-modal-datetime-picker`** (`components/EventForm.tsx`): use `<input type="datetime-local">` (or `type="date"`) on web.
- [ ] Verify `react-native-modal` renders on web; if not, swap to React Native's built-in `Modal`.
- [ ] **Never bundle `firebaseAdmin.ts` for web** — exclude from the web build (it imports `firebase-admin` + a private key). Verify the web bundle has no `firebase-admin` reference.
- [ ] Run `npx expo start --web` and smoke-test: login → events → RSVP → comment → badge updates → tap notification → opens event.

## Phase 4 — Web build & hosting

- [ ] `npx expo export --platform web` → static output in `dist/`.
- [ ] Host on **Firebase Hosting** (project `safc-8863b` already set up; `.firebaserc` exists) — or Vercel/Netlify/GitHub Pages.
- [ ] Set up a friendly URL / custom domain.
- [ ] Verify in browser on desktop + Android Chrome; note iOS Safari behavior (PWA "Add to Home Screen" only).

## Phase 5 — Final regression & ship

- [ ] Mobile: confirm push notifications still arrive (native device), tap-to-open still works.
- [ ] Web: badge + list + navigation work logged-in.
- [ ] `npx tsc --noEmit` — no new errors beyond the known pre-existing ones.
- [ ] Commit + push; build `preview` APK if delivering a new Android build.

---

## Out of scope (documented decisions)

- ❌ Web push notifications (no VAPID/service worker/FCM-web).
- ❌ iOS App Store / Apple Developer subscription.
- ❌ Moving push sending to Firebase Functions (flagged as a future security improvement; `firebaseAdmin.ts` on the client is an open concern).
