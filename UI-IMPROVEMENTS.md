# UI-IMPROVEMENTS.md — Web UI Polish

> Actionable checklist for improving the web UI. Each task is self-contained — complete, verify, check off.
> **Note:** Profile lives only in `app/(tabs)/profile.tsx` (hidden tab). The old root-level `app/profile.tsx` duplicate was removed — it crashed on direct URL loads (`Attempted to navigate before mounting the Root Layout`).

---

## 1. Font — switch to sans-serif

**Why:** Georgia serif looks dated and mismatched for a sports fan app. A clean sans-serif is expected for modern web UIs.

- [x] Update `styles/global.css` — replaced Georgia serif with `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- [x] Verified: no `fontFamily` overrides in any `.tsx` files — CSS change applies clean across the entire app

---

## 2. Events screen — remove dark photo overlay

**Why:** The `rgba(0,0,0,0.5)` scrim over a background photo is the only screen with this treatment. Every other screen uses flat `#f5f5f5`. This creates a jarring visual disconnect when switching tabs.

- [x] In `app/(tabs)/index.tsx`, removed `ImageBackground` + dark overlay entirely
- [x] Replaced with flat `#f5f5f5` background to match all other screens
- [x] Event detail modal keeps its hero image (unchanged)
- [x] Empty-state text color switched from white to `#666` (was styled for dark bg)
- [x] `npx tsc --noEmit` passes (exit 0)

---

## 3. Add hover effects to interactive elements on web

**Why:** Zero hover feedback makes the web version feel static and non-interactive.

- [x] **Nav items** (`WebHeader` in `app/(tabs)/_layout.tsx`): hover background `rgba(255,255,255,0.12)` + label turns white via `onMouseEnter`/`onMouseLeave` state; added `webNavItemHovered` / `webNavLabelHovered` styles + border-radius 6px
- [x] **Event cards** (`components/EventCard.tsx`): hover lifts card (`translateY: -2`) with deeper shadow — extracted `eventCardHovered` style; component now uses `useState` for `hovered`
- [x] **Post cards** (`app/(tabs)/posts.tsx`): same shadow-lift treatment; extracted a `PostCard` functional component (avoided hooks violation in `renderItem`) with `postCardHovered` style
- [x] **News items** (`app/(tabs)/news.tsx`): same treatment; extracted a `NewsCard` functional component with `newsItemHovered` style
- [x] **Buttons**: login button (`app/(auth)/login.tsx`) darkens to `#c0142e` + `scale(1.02)` on hover; FABs in `MainScreen.tsx` and posts screen scale `1.08` + deepen shadow; "Create Event" submit button in `EventForm.tsx` darkens + `scale(1.02)` on hover
- [x] **Menu items** (`components/HamburgerMenu.tsx`): background changes to `#f0f0f0` on hover; tracks hovered item by `id`
- [x] Created `types/web-hover.d.ts` to augment `TouchableOpacityProps` with `onMouseEnter`/`onMouseLeave` (RN Web supports these at runtime but TypeScript types don't include them)
- [x] `npx tsc --noEmit` passes (exit 0)

---

## 4. Constrain Fixtures + Table to max-width on web

**Why:** These two screens have zero web width constraints — they stretch edge-to-edge on desktop while Events, Posts, and News are capped at 1280px.

- [x] **Root container**: removed the root-level `maxWidthWrapper` from `app/_layout.tsx` — it was cutting the header, screen backgrounds, and body background to 1280px. The app shell is now full-width; only screen *content* is constrained.
- [x] **Content constraint**: each tab screen already applies `maxWidthContent` (1280px centered) to its list/scroll content — Events (`eventsListContentWeb`), Posts (`listContentWeb`), News (`newsListContentWeb`), Fixtures (`listContainerWeb` + `statsContentWeb`). Header + backgrounds stay full-width.
- [x] **Table** (`app/(tabs)/table.tsx`): on web, renders without horizontal `ScrollView` entirely; mobile keeps the horizontal ScrollView. (The 480px web cap was later widened to the full 1280px container in task 10.)
- [x] **Fixtures** (`app/(tabs)/fixtures.tsx`): content sizes bumped (teamLogo 64, teamName 14/500, vsText 18, countdownTimer 40, countdownTitle 20, etc.); cards set to `width: '100%'`; `safeAreaContainer` has `alignItems: 'stretch'`. Width investigation resolved in task 11 — cards are capped at 1000px inside the 1280px container and Stats content matches at 1030px.
- [x] Verified all screens render correctly in browser; `npx tsc --noEmit` passes (exit 0)

---

## 5. Consistent card title colors

**Why:** Event titles are red `#e21d38`, post titles are dark `#333`, news titles are red — no clear system.

- [x] Standardized all card titles to dark `#333` (the post card pattern — it's the most readable)
- [x] `components/EventCard.tsx` — `eventTitle` changed `#e21d38` → `#333`
- [x] `app/(tabs)/news.tsx` — `newsTitle` changed `#e21d38` → `#333`
- [x] Audited other title contexts: profile event/post titles, EventDetailsModal, PostDetailsModal were already `#333`; red kept only for accents (liked state, section headers, CTAs)
- [x] `npx tsc --noEmit` passes (exit 0)

---

## 6. Extract shared theme constants

**Why:** `#e21d38` is hard-coded 100+ times. The shadow recipe is copy-pasted 30+ times. No shared tokens exist.

- [x] Create `constants/theme.ts` with:
  - `COLORS.primary` (`#e21d38`), `COLORS.background` (`#f5f5f5`), `COLORS.card` (`#ffffff`), `COLORS.text` (`#333`), `COLORS.textSecondary` (`#666`), `COLORS.textMuted` (`#999`), `COLORS.border` (`#f0f0f0`), `COLORS.disabled` (`#ccc`) — plus `COLORS.primaryDark` (`#c0142e`, hover variant)
  - `SHADOW.card` (the standard recipe), `SHADOW.heavy` (for FABs)
  - `RADIUS.sm` (8), `RADIUS.md` (12), `RADIUS.lg` (16), `RADIUS.xl` (20)
  - `FONT.size.*` scale (12, 14, 15, 16, 18, 20, 24, 28)
- [x] Update `utils/platformStyles.ts` to import from `constants/theme.ts` (`cardImageWeb.borderRadius` → `RADIUS.md`)
- [x] Refactor screens one-by-one to use the shared constants (start with most-used: EventCard, EventForm, PostForm) — all three fully migrated (colors, shadows, radii, font sizes); remaining screens (posts, news, profile, fixtures, table, auth) can adopt tokens incrementally in future tasks
- [x] `npx tsc --noEmit` passes (exit 0); Events + Fixtures pages verified rendering in browser

---

## 7. Clean up WebHeader on web

**Why:** The web header has full nav links + bell + hamburger. The hamburger opens a drawer with the same nav links (Profile, Settings, etc.) — redundant on desktop.

- [x] Evaluate: remove hamburger from `WebHeader` on web; keep bell + user avatar/menu instead
- [x] Add a user dropdown (avatar click → Profile / Settings / Logout) to replace hamburger drawer functionality on web
- [x] Keep hamburger for mobile only (native header)
- [x] **Implemented — `components/UserMenu.tsx`**: white avatar circle with email initials (e.g. "AI" for atanas_irikev@abv.bg) + chevron that rotates when open. Dropdown (260px, rounded, shadowed) contains the same items the drawer had — Profile, Users Management (admin-only, orange badge), Settings, About, Logout (red) — with the same hover treatment and admin check (`checkIsUserAdmin`). Closes on outside click (fixed overlay) and on Escape. The drawer's "Notifications" stub was dropped since the bell (`NotificationBadge`) sits right beside the avatar and is the real notifications UI. `WebHeader` now renders `<UserMenu />` instead of `<HamburgerMenu />`; `HamburgerMenu` remains only in the native `CustomHeader` (mobile). `npx tsc --noEmit` passes; the new header renders in the browser (avatar visible, hamburger gone). Live click-through of the dropdown was blocked by a stale dev-server error overlay ("HamburgerMenu is not defined" — captured by Metro's HMR in the intermediate state between the two WebHeader edits; the current bundle is correct) and flaky browser automation — a full page refresh (F5) clears the overlay
- [x] **Follow-up — dropdown was painting under the page content**: the dropdown is `position: absolute` inside the header, but the header itself created no stacking context, so the page content (later in DOM order) painted over it. `webHeader` now sets `position: 'relative'` + `zIndex: 1000`, lifting the whole header (and the dropdown at `zIndex: 101` inside it) above the content. `npx tsc --noEmit` passes; live click-through still blocked by the flaky browser automation — user confirmed the menu opens, so the fix needs a refresh + visual check
- [x] **Follow-up — notification sheet width**: the bell's bottom sheet stretched edge-to-edge on web. It now caps at the shared card column (`maxWidthCard`, 920px) and centres via `alignItems: 'center'` on the web overlay; mobile keeps the full-width bottom sheet. Slide animation unchanged. Also gave the bell `accessibilityRole='button'` (a11y + testability). User confirmed it looks right
- [x] **Partial fix — drawer width on web**: `HamburgerMenu` used `width: '75%'` with no cap, so on a desktop viewport the drawer covered ~three quarters of the screen. Added `menuContainerWeb` (`width: '100%'`, `maxWidth: 360`, rounded left corners); mobile keeps the 75% drawer. Also gave the icon-only trigger an `accessibilityLabel`/`accessibilityRole` so it is reachable by assistive tech and testable. The full Task 7 direction above is still open
- [x] **Removed "Update Team Stats" (manual stats entry)**: the admin drawer item and `components/StatsUpdateModal.tsx` are deleted. Rationale: stale data is better than hand-entered data — the Stats tab already loads the last-known stats first (`loadStaleStats()`: Firestore `teamStats/sunderland-stats` → AsyncStorage `lastFetchedTeamStats`) and only replaces them when a live fetch (ESPN → football-data.org) succeeds, auto-syncing the result back to Firestore. `utils/statsService.ts` and the `teamStats` Firestore rules are kept for that auto-sync path. README file tree updated
- [x] **Header brand links home**: the logo + title block in `WebHeader` (web) and `CustomHeader` (mobile) is now a `TouchableOpacity` that navigates to `/` (`router.push('/')`), with `accessibilityRole='link'` / `accessibilityLabel='Go to home'`; the web brand gets the same subtle hover background as the nav items. Verified in browser: clicking the brand on `/table` navigates to `/`

---

## 8. Loading & empty state polish

**Why:** Loading states are bare "Loading events..." text. Empty states say "No events yet" in white on a dark overlay.

- [x] Add simple skeleton/shimmer placeholders for event cards, post cards, news items on web
- [x] Or at minimum: centered spinner with consistent styling (currently each screen does its own)
- [x] Create a shared `components/LoadingState.tsx` and `components/EmptyState.tsx`
- [x] Consistent empty state: icon + title + subtitle, using `#999`/`#bbb` text colors on `#f5f5f5` bg

**Done:** Added `LoadingState`, `EmptyState`, and web-only `SkeletonList` (pulsing placeholder cards). Wired into Events, Posts, News, Table, Fixtures, both Profile screens, and Users. Removed per-screen duplicated styles. Also fixed the invisible red-on-red spinner in `app/index.tsx` (now white on the brand splash).

---

## 9. FAB positioning fix on web

**Why:** The create-event FAB (`MainScreen.tsx`) is positioned `absolute, bottom 20, right 20` relative to the viewport, which can overlap content or float outside the max-width container on web.

- [x] On web, hide the floating FAB (`MainScreen.tsx` renders it only on non-web platforms)
- [x] Replace with an inline "Create Event" button in the events list `ListHeaderComponent` (white card, red icon, hover border/shadow) — natural desktop pattern, stays inside the `maxWidthContent` container
- [x] Same treatment for the Posts screen FAB: hidden on web, inline "New Post" button for admins in the list header
- [x] Reduced web bottom padding on the events list (was 90px to clear the floating FAB)
- [x] **Follow-up — header buttons were wider than the cards**: the list header buttons stretched to the full `maxWidthContent` (1280px) column while `EventCard`/`PostCard` cap at 920px and centre, so the buttons overhung the card column by ~180px each side and read as detached from page content. Added `WEB_CARD_MAX_WIDTH` + `maxWidthCard` to `utils/platformStyles.ts`, applied it to both buttons *and* to `EventCard`/`PostCard` so the card column is defined in one place and cannot drift again. Buttons now use card-matching `borderRadius: 14`, `COLORS.card`/`COLORS.border`, `FONT.size.base` and `COLORS.primary` instead of the old 12px radius and hard-coded hex values
- [x] `npx tsc --noEmit` passes (exit 0); Events + Posts verified rendering in browser

---

## 10. Table readability on desktop

**Why:** The league table uses 11px font to cram everything into a fixed narrow width. On desktop this is unnecessarily cramped.

- [x] On web, the table moved off the 480px cap (first to `maxWidthContent`, then see the follow-up below)
- [x] Font sizes bumped on web: header 13px, team name 14px/600, stats + position 13px
- [x] Alternating row backgrounds (`#f9f9f9` on odd rows) for scanability
- [x] Web column widths: team-name column flexes to fill (`flex: 1`, left-aligned with padding), stat columns keep fixed widths; the 60px mobile fixed column widens to 84px on web and logos render at 26px; mobile horizontal-scroll layout unchanged
- [x] **Follow-up — width corrected to match the other pages**: widening the table to the full `maxWidthContent` (1280px) overcorrected — Events, Posts and News all cap their *visible* content at the shared 920px card column, so the table stood out as wider than every other page. `containerWeb` now uses `maxWidthCard` (920px) instead, so the table body and its red header row line up with the card column on the other tabs. The `#f5f5f5` page background is unchanged, so the capped container produces no visible band; the team-name column still has ~556px to flex into, well above its 140px minimum
- [x] `npx tsc --noEmit` passes (exit 0); full 20-team table verified rendering on web

---

## 11. Fixtures — add max-width and clean up web layout

**Why:** Fixtures has no web width constraint, inconsistent card spacing, and uses `boxShadow` (a web-only RN prop that warns on native).

- [x] `maxWidthContent` container applied (`listContainerWeb`); web fixture cards widened from 920 → 1000px and the Stats content aligned to match (1030px = 1000 + 30px padding)
- [x] `boxShadow` removed from `fixtureItem` — replaced with proper RN shadow props via the shared `SHADOW.card` token; the same token now replaces the manual shadow recipes on the countdown, team header, and stats sections
- [x] Subtle alternating fixture cards on web (`#f9f9f9` on odd rows) for scanability
- [x] Next Match countdown made more prominent on web: brand-red top border, wider card (1000px), larger crests (84px), title 24px, timer 54px, "vs" 22px, team names 16px
- [x] **Follow-up — countdown timer moved between the teams (web only)**: the Next Match countdown now sits in a centered column between the two team columns (stacked under "vs") on web, where there's room in the 1000px card. On mobile the timer stays in its original spot below the teams row (`!isWeb` guard + `countdownCenter` web-only style), since there isn't space between the teams on small screens. `countdownTimerWeb` gained a small `marginTop` to separate it from "vs"
- [x] `npx tsc --noEmit` passes (exit 0); Upcoming tab + countdown verified rendering in browser
- [x] **Follow-up — same `boxShadow` cleanup applied to `app/(tabs)/news.tsx`**: the last two web-only `boxShadow` props (`latestNewsCard`, `cacheClearButton`) replaced with `SHADOW.card`; `cacheClearButton` background moved to `COLORS.card`. No `boxShadow` props remain in the app

---

## 12. Post card consistency with event cards

**Why:** Post cards have a different visual treatment than event cards — different title color, different layout, different footer.

- [x] Post card now uses the shared `SHADOW.card` recipe and `RADIUS.lg` (14px on web, matching EventCard) instead of its own hard-coded shadow/radius; title uses `FONT.size.xl` / `COLORS.text` (same size + weight as event titles); all post-card colors migrated to theme tokens
- [x] Hover effect was already consistent (same lift + deeper shadow) — `activeOpacity` aligned to 0.8 to match EventCard
- [x] **Bug fixed:** `PostCard` never rendered `item.imageUrl` even though the `postImage` style existed. It now renders the image, and on web the card uses the same image-left horizontal layout as EventCard (220px image, content flexes beside it); cards without images stay a single column
- [x] `npx tsc --noEmit` passes (exit 0); Posts page verified rendering in browser (image-less post renders correctly)

---

## Implementation order

1. **Font** (task 1) — instant visual impact, zero risk
2. **Remove dark overlay** (task 2) — unifies the app visually
3. **Max-width for Fixtures + Table** (task 4) — quick fix, big desktop improvement
4. **Hover effects** (task 3) — makes web feel interactive
5. **Card title consistency** (task 5) — polish pass
6. **Theme constants** (task 6) — foundation for all future work
 7. **Loading/empty states** (task 8) — UX improvement
 8. **FAB positioning** (task 9) — web layout fix
 9. **Table readability** (task 10) — data screen polish
 10. **Fixtures polish** (task 11) — data screen polish
 11. **Post card consistency** (task 12) — visual alignment
 12. **WebHeader cleanup** (task 7) — requires more design thought, do last

**Status: tasks 1–12 complete. Task 7's dropdown click-through still needs a live check after a page refresh (see note above).**

---

## Post-checklist improvements

- [x] **Auth screens width constraint**: login and signup forms stretched edge-to-edge on desktop. Added `WEB_AUTH_MAX_WIDTH` (440) + `maxWidthAuth` to `utils/platformStyles.ts` and applied `contentWeb` (`...maxWidthAuth` + `width: '100%'`) to the `content` container in `app/(auth)/login.tsx` and `app/(auth)/signup.tsx` — forms now render as a centred 440px column on web; mobile unchanged. Note: the `width: '100%'` is required — without it, `marginHorizontal: 'auto'` makes the flex item shrink-to-fit its content (~330px) instead of capping at 440. `npx tsc --noEmit` passes; verified live in browser (inputs span the full 440px column on both pages)
- [x] **Auth form field styling — attempted then reverted**: tried removing the browser's default focus outline (thick black ring) via `global.css` (subtle red ring instead) and bumping field cards to radius 14 with more padding. User preferred the previous look — all of it reverted (global.css input rules removed, `inputContainer`/buttons back to radius 12, `paddingVertical: 5`, `paddingHorizontal: 15`). The 440px width container above stays
- [x] **Focus outline removed (surgical)**: user confirmed the "border" appearing over an active input is the browser's default `:focus` outline on the raw `<input>` (RN Web renders TextInput as one). Added `input:focus, textarea:focus, select:focus { outline: none; }` to `styles/global.css` — nothing else changed this time (no ring, no radius/padding). Applies to every input app-wide. Note: this removes the visible focus indicator (a11y trade-off) — the field still receives focus, just without the ring

---

## Verification checklist

After all tasks:
- [ ] All tabs render correctly on desktop (1280px+ width)
- [ ] All tabs degrade gracefully on narrow viewport (< 768px)
- [ ] Login/signup screens still look good
- [ ] Event detail modal still works (image hero, attendance, comments)
- [ ] Post detail modal still works
- [ ] Notification bell + drawer still works
- [ ] Hamburger menu still works on mobile
- [ ] `npx tsc --noEmit` — no new errors
- [ ] Mobile native build unaffected (test on device or emulator)

---

## Post-checklist features (auth)

### Silent auto-login on mobile (SecureStore)
- [x] **Problem:** Firebase JS SDK on React Native sometimes fails to restore/refresh the session at cold start (no network, revoked refresh token) → user forced to log in often. Notifications still fire because 1-hour kickoff reminders are OS-owned local notifications, independent of auth state.
- [x] **Fix:** `expo-secure-store` installed (Keychain/Keystore, works in Expo Go). New `utils/secureCredentialStorage.ts` stores email+password when "Remember me" is checked. `contexts/AuthContext.tsx` silently re-authenticates on auth-state `null` (native only) before showing the login screen; invalid creds are cleared (no loop), transient errors retry next launch; explicit logout clears the keychain copy. `app/(auth)/login.tsx` saves/clears on remember-me toggle.
- [x] `npx tsc --noEmit` passes. Web unaffected (auto-login is native-only).
- [x] **Note:** requires a new APK build (expo-secure-store is a new native module; not in the old ship file). Testable in Expo Go without a build.

### Delete account (auth + Firestore)
- [x] **New `utils/accountDeletionService.ts`:** re-authenticates (typed password or keychain creds), deletes Firestore data — `users/{uid}` (LAST, because the posts delete rule checks the creator's users doc for `isAdmin`), `matchReminders`/`tokens` subcollections, `deviceTokens`, `notifications`, `userSeenEvents`, user's events and posts — then `deleteUser()`, then local cleanup. Firestore deletes must precede `deleteUser()` (token invalidated).
- [x] **New `components/DeleteAccountModal.tsx`:** cross-platform confirm dialog; password field on web / when keychain creds are stale; silent confirm on mobile with "Remember me" creds; handles wrong-password and expired-session errors.
- [x] **Wired in:** `components/UserMenu.tsx` (web dropdown item, danger style) and `app/(tabs)/profile.tsx` (outlined red button below Logout). Redirects to login after deletion.
- [x] `npx tsc --noEmit` passes. **User-tested: account + all related data deleted successfully.**

---

## Post-checklist features (events)

### Map-based location picker in the Create Event form
- [x] **Problem:** the location field was a plain text input — no way to pin a real place, and the `locationCoordinates` field on `Event` was typed as DOM `Location` (a latent bug; never populated).
- [x] **Fix:** new `components/LocationPicker.web.tsx` (Leaflet + OpenStreetMap tiles, no API key) and `components/LocationPicker.native.tsx` (react-native-maps — Apple Maps/Google Maps, bundled in Expo Go). Platform-split resolution via Metro (`.web`/`.native` suffixes) keeps react-native-maps out of the web bundle; `tsconfig.json` gained `"moduleSuffixes": [".web", ".native", ""]` so TypeScript resolves the same way.
- [x] **Search + geocode:** new `utils/geocoding.ts` — Nominatim search (debounced 400ms, min 3 chars, top 5 results) and reverse geocoding for map clicks. Clicking the map or picking a result sets the place name + coordinates.
- [x] **Type fix:** `types/event.ts` now defines `EventLocation = { latitude, longitude }`; `locationCoordinates?: EventLocation` in `Event` and in `EventCard.tsx`'s local copy (was `Location`).
- [x] **Integration:** `components/EventForm.tsx` replaces the location `TextInput` with `<LocationPicker />`; coordinates flow into `newEvent` state and are stored to Firestore via the existing `createEvent` path (`utils/eventService.ts` already read them back).
- [x] `npx tsc --noEmit` passes. Web bundle verified compiling (Metro 200, contains Leaflet + Nominatim + picker code). Live map interaction still needs a manual check — browser click automation is flaky (see task 7 notes).

---

## Post-checklist fixes

- [x] **Profile page container**: profile content stretched to the full 1280px `maxWidthContent` container (inner sections used `marginHorizontal: 20` → ~1240px wide) while every other page's visible content caps at the shared 920px card column (`maxWidthCard`). `scrollViewContentWeb` in `app/(tabs)/profile.tsx` now uses `maxWidthCard` instead — the profile header, stats, membership card, notification settings, event/post lists and the Logout/Delete buttons all line up with the card column on Events/Posts/News. The in-page `PageTitle` is constrained by the parent, so it aligns to the same column. `npx tsc --noEmit` passes; page verified rendering at `/profile`. Note: the effect only shows at viewports wider than 920px (the pre-change 1280px cap was already wider than the test viewport).
