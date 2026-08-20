# PLAN.md — New Version Plan: Web App + In-App Notification Center

> Companion to AGENT.md (project context). This is the actionable checklist for the next version.
> **Guiding principle (confirmed with the project owner):**
>
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

- [x] **Platform-gate `expo-notifications` usage** — `getExpoPushTokenAsync` / `setNotificationHandler` / listeners must not run on web:
  - [x] `utils/simpleNotificationService.ts` `setupNotifications()`: early-return on `Platform.OS === 'web'` + `setupNotificationListeners`/`sendLocalNotification`/`notifyAllUsers` gated.
  - [x] `contexts/AuthContext.tsx`: only call `setupNotifications` on native.
  - [x] `components/NotificationHandler.tsx` + `MainScreen`: only mount on native (`Platform.OS !== 'web'`).
  - [x] `components/NotificationSettings.tsx`: hide/disable push toggle on web.
- [x] **Web fallback for `expo-image-picker`** (`app/(tabs)/index.tsx`, `components/EventForm.tsx`): web uses the browser file/photo UI via `expo-image-picker` (it supports web) + web-safe Cloudinary upload in `utils/imageService.ts` (converts `data:` URL → Blob).
- [x] **Web fallback for `react-native-modal-datetime-picker`** (`components/EventForm.tsx`): use `<input type="datetime-local">` on web.
- [x] Verify `react-native-modal` renders on web; if not, swap to React Native's built-in `Modal`. — Confirmed via `expo export --platform web` (bundle built O.K., `react-native-modal` included, no swap needed).
- [x] Firebase admin is not bundled for web — `firebaseAdmin.ts` (imported `firebase-admin` + a private key) removed; verified the web bundle has no `firebase-admin` reference.
- [x] Run `<!-- npx expo start --web -->` and smoke-test: login → events → RSVP → comment → badge updates → tap notification → opens event. (Manual browser smoke test to be done)

## Phase 3.5 — Web UI layout & navigation overhaul

> **Problem:** The web build currently stretches the native mobile layout to full desktop width. Bottom tab bar sits at the foot of a 1280px+ viewport, and every card (events, posts, news) is a giant image-on-top stack running edge-to-edge. The user has reviewed screenshots and confirmed the result is unusable on desktop.

### Goal

| Concern | Mobile (native) | Web (desktop) |
|---|---|---|
| Tab navigation | Bottom tab bar (unchanged) | Top tab bar in the header/nav area |
| Content width | Full-width (device width) | Constrained to a max-width container, centered |
| Event/Post/News card | Image on top, text below (vertical) | Image on left, text on right (horizontal) |
| Body | Default | `max-width: 1280px` centered, no edge-to-edge stretching |

### Tasks

- [ ] **Body max-width (global CSS)**
  - [ ] Create `styles/global.css` with `body { max-width: 1280px; margin: 0 auto; background: #f5f5f5; }` (plus a `@media` guard so very narrow windows still work).
  - [ ] Import it in `app/_layout.tsx` (the Expo Router root layout): `import '../styles/global.css'` — web-only import (no-op on native).
  - [ ] Verify: open on desktop browser; the red header, tab bar, and content no longer bleed to the viewport edges.

- [ ] **Top tab bar on web, bottom on mobile** (`app/(tabs)/_layout.tsx`)
  - [ ] Compute `const isWeb = Platform.OS === 'web'` at the top of `TabsLayout`.
  - [ ] Pass `tabBarPosition: isWeb ? 'top' : 'bottom'` to `<Tabs>` so the tab bar moves to the top on web but stays at the bottom on native.
  - [ ] Web-specific `tabBarStyle`: full-width top strip, height ~56, label + icon inline (icon-left, label-right), `backgroundColor: '#e21d38'`, active/inactive tint unchanged. Add `web` key to `tabBarLabelStyle` for proper font rendering.
  - [ ] Mobile `tabBarStyle` keeps existing `height: 60` bottom bar config (unchanged).
  - [ ] Verify mobile still has the bottom red tab bar with icons-below-labels (`tabBarLabelPosition: 'below-icon'`); web now has a top strip with icons.

- [ ] **Web card layout: image-left / text-right** (`components/EventCard.tsx`)
  - [ ] Wrap the existing JSX in a `Platform.select` branch (or conditional `style`/`flexDirection`).
  - [ ] **Web**: `flexDirection: 'row'` — image on the left (fixed `width: 200`, `height: 140`, `borderRadius: 12`), text content in a flex:1 container to the right.
  - [ ] **Mobile**: keep the current vertical layout (`flexDirection: 'column'`, image `width: '100%'` `height: 180`, content below) — no behavioural change.
  - [ ] Apply the same horizontal/vertical split to `components/PostDetailsModal.tsx` card and the News flat-list card in `app/(tabs)/news.tsx` so all card-based lists are visually consistent on web.
  - [ ] Add a shared helper: `utils/platformStyles.ts` exporting `isWeb()` and reusable web/mobile style objects (`WEB_CARD_CONTAINER`, `WEB_CARD_IMAGE`, `MOBILE_CARD_IMAGE`, etc.) to avoid scattering `Platform.OS` checks across components.
  - [ ] Verify: on desktop the events feed shows compact horizontal cards; on a phone it's still the stacked mobile layout.

- [ ] **Constrain FlatList content width on web** (`app/(tabs)/index.tsx`, `app/(tabs)/posts.tsx`, `app/(tabs)/news.tsx`)
  - [ ] Add `contentContainerStyle` with `maxWidth: isWeb ? 1280 : '100%'` and `marginHorizontal: isWeb ? 'auto' : 0` to each screen's `<FlatList>`.
  - [ ] Adjust the `overlay` style (the `rgba(0,0,0,0.5)` View) so it doesn't fight the body-level max-width on web.
  - [ ] Ensure the FAB (`MainScreen`) is positioned relative to the max-width container, not the viewport edge, on web.

- [ ] **Web max-width wrapper in root layout** (`app/_layout.tsx`)
  - [ ] For `Platform.OS === 'web'`, wrap the `<AuthProvider>` / `<SafeAreaProvider>` children in a `<View style={styles.webMaxWidthWrapper}>` with `maxWidth: 1280, marginHorizontal: 'auto'`.
  - [ ] This catches screens that don't use a FlatList (profile, table, etc.).
  - [ ] For native, render children directly (no wrapper) — unchanged.

- [ ] **Smoke-test on web**
  - [ ] `npx expo start --web` → verify all tabs (Events, Posts, News, Table, Fixtures) render without edge-to-edge overflow.
  - [ ] Verify tab switching works with the top bar.
  - [ ] Verify EventCard horizontal layout, tap-to-open event modal still works.
  - [ ] Resize browser narrow → confirm it degrades gracefully to mobile-like behavior.

> 🚧 **Why before Phase 4?** The static export in Phase 4 (`expo export --platform web`) will package whatever the canvas looks like. Doing the layout fix first ensures the build is correct from the start.

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
