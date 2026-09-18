# BSSB — Data & Content Improvement Plan

Status: **Planning only. No implementation started.**
Created: 18 September 2026
Research background: `reports/football-data-sources.md`

## 1. Goals

Improve the app's matchday content, in priority order:

1. **Fix the news feed** — the current NewsAPI setup is not licensed for production, has a 24h delay, and is localhost-only on web.
2. **Add live scores** during Sunderland matches.
3. **Add match detail** — events (goals, cards, subs), lineups, statistics.
4. **Add team/player depth** — injuries, transfers, predictions, head-to-head, player stats, top scorers/assists.
5. **Unify fixtures** — cover PL + FA Cup + League Cup + Europa from one provider instead of the brittle ESPN workaround.

Primary provider: **API-Football (api-sports.io)** free plan — 100 requests/day, all endpoints.
News providers: **Guardian Open Platform** (primary) and/or **BBC Sport RSS** (free fallback).

## 2. Constraints and budget

API-Football free plan: **100 requests/day**, resets 00:00 UTC, all endpoints included.
User's target: ~4 requests/hour average. That is achievable, but the budget is **shared across all users**, not per user — so the number of users must not scale the upstream call count.

### Budget strategy (critical)

All API-Football traffic goes through the Cloudflare Worker proxy, which:

- holds the API key in `env` (never shipped to clients),
- caches upstream responses at the edge with per-endpoint TTLs,
- serves a fixed number of upstream calls per day regardless of user count.

| Data | Freshness need | Cache TTL | Approx. calls/day |
| --- | --- | --- | --- |
| Standings (PL) | Low | 6 h | ~4 |
| Team fixtures (season, all comps) | Low | 12 h | ~2 |
| Top scorers / assists | Low | 12 h | ~4 |
| Squad / players | Low | 24 h | ~1 |
| Injuries | Medium | 6 h | ~4 |
| Transfers | Low | 24 h | ~1 |
| Live fixtures (matchday only, polled) | High | 60–120 s, matchday window only | ~40–60 on matchday, 0 otherwise |
| Match events/lineups (single match) | On demand, once | 1 h after match / 10 min live | ~4–6 per match |
| Predictions / H2H (pre-match) | Low | 24 h | ~2–4 per match |

With matchday live polling concentrated in the ~2 hours around kickoff, expected usage stays well under 100/day. A **worker-side daily counter** should hard-stop when the quota is near and fall back to cache to avoid lockout.

### Alternative / complement (no quota)

- **FPL API** (`fantasy.premierleague.com/api/bootstrap-static/`): keyless, no quota, PL player stats + xG/xA. Good for player stats if API-Football quota is tight. Verify browser CORS; call through the worker if needed.
- **football-data.org**: keep for PL standings/fixtures (already integrated and proxied).

## 3. Target architecture

```
Expo app (web + native)
   │
   ├── utils/apiFootballService.ts      (new)  typed client, mirrors footballDataService
   ├── utils/newsService.ts             (new)  Guardian + BBC RSS
   ├── utils/footballDataService.ts     (keep) PL standings/fixtures
   │
   ▼
Cloudflare Worker  cloudflare-worker/src/index.js
   ├── /football-data/*   (existing)
   ├── /api-football/*    (new)  hides key, CORS, TTL cache, daily budget guard
   └── /news/*            (new)  Guardian key + RSS→JSON normalisation
   │
   ▼
Upstream providers  (API-Football, football-data.org, Guardian, BBC)
```

Layered caching:

1. **Cloudflare edge cache / KV** — shared by all users, protects the upstream quota. Primary defence.
2. **Scheduled pre-warm (Cron Trigger)** — worker fetches slow data (standings, fixtures, squad, top scorers) on a schedule and stores it in KV; clients always read KV.
3. **Client cache** — AsyncStorage (per device, short TTL) + existing Firestore `teamStats` shared cache for cross-user data.
4. **Graceful degradation** — always render last-known cached data with a "last updated" timestamp; never hard-fail.

## 4. API-Football endpoint map

Replace placeholders `{teamId}` (Sunderland) and `{season}` (start year, `2026` for 2026/27) once resolved.

| Feature | Endpoint | UI surface |
| --- | --- | --- |
| Resolve Sunderland team id | `/teams?search=Sunderland` | one-off setup |
| All fixtures/results (PL + cups + Europa) | `/fixtures?team={teamId}&season={season}` | Fixtures tab |
| Live scores | `/fixtures?live=all` or `/fixtures?team={teamId}&live=all` | Fixtures tab (matchday) |
| League table | `/standings?league=39&season={season}` | Table tab |
| Match events (goals/cards/subs) | `/fixtures/events?fixture={fixtureId}` | Match detail |
| Lineups | `/fixtures/lineups?fixture={fixtureId}` | Match detail |
| Match statistics | `/fixtures/statistics?fixture={fixtureId}` | Match detail |
| Predictions | `/predictions?fixture={fixtureId}` | Match detail (pre-match) |
| Head-to-head | `/fixtures/headtohead?h2h={idA}-{idB}` | Match detail |
| Top scorers | `/players/topscorers?league=39&season={season}` | Stats section |
| Top assists | `/players/topassists?league=39&season={season}` | Stats section |
| Squad / player stats | `/players?team={teamId}&season={season}` | Squad section |
| Injuries | `/injuries?team={teamId}&season={season}` | Squad / News |
| Transfers | `/transfers?team={teamId}` | Squad / News |

Auth: header `x-apisports-key`. Every response is wrapped in `{ get, parameters, errors, results, paging, response }` — handle `errors` explicitly.

## 5. News plan

Current: `app/(tabs)/news.tsx` → NewsAPI `everything?q=Sunderland...` (dev-only, 24h delay, localhost CORS).

Target stack, in order:

1. **Guardian Open Platform** (primary) — free key, JSON, full text, continuous updates, attribution required.
   - Query Sunderland: `q=Sunderland AFC` or the football tag, filtered by `from`/`order-by=newest`.
2. **BBC Sport RSS** (free fallback / secondary) — `feeds.bbci.co.uk/sport/football/rss.xml` and transfers feed; worker parses XML → JSON.
3. **NewsData.io** (optional, only if a single commercial-safe JSON API is wanted) — 200 credits/day, 12h delay, commercial use allowed.

Requirements:

- Normalise all sources to one `NewsItem` shape: `{ id, title, summary, imageUrl, url, source, publishedAt }`.
- Deduplicate by title/URL; sort newest first.
- Never break the tab: on failure, show cached articles + "last updated" and a retry.
- Add source label and per-article source attribution in the UI.
- Keep the API key in the worker (Guardian) rather than `config/config.ts`.
- Remove the NewsAPI dependency once replaced (and rotate/retire the exposed key in `config/config.ts`).

## 6. Phased delivery

### Phase 0 — Prerequisites & decisions (no app code)
- [ ] Register API-Football free account; store key as Cloudflare Worker secret `API_SPORTS_KEY` (not in the repo).
- [ ] Register Guardian Open Platform key; store as worker secret `GUARDIAN_API_KEY`.
- [ ] Look up Sunderland's API-Football team id and confirm PL league id `39`, season `2026`.
- [ ] Decide whether API-Football fully replaces football-data.org or runs alongside it.
- [ ] Confirm Cloudflare Worker KV namespace + Cron Trigger availability on the current plan.

### Phase 1 — Data layer foundation
- [ ] Extend `cloudflare-worker/src/index.js` with `/api-football/*` route: key injection, CORS allowlist, TTL cache, daily budget guard, `errors` passthrough.
- [ ] Add `/news/*` route (Guardian JSON + BBC RSS→JSON normalisation).
- [ ] Add `utils/apiFootballService.ts` mirroring `footballDataService` patterns (web → worker, native → direct or worker).
- [ ] Add a request-budget utility + cache headers convention.
- **Acceptance:** a test call returns cached data, the key never appears in web bundle/network, budget counter blocks before quota exhaustion.

### Phase 2 — News feed revamp (highest user-visible value)
- [ ] Implement `utils/newsService.ts` with Guardian primary + BBC fallback + normalisation/dedupe.
- [ ] Refactor `app/(tabs)/news.tsx` to use it; loading/empty/error states, cached fallback, source labels, attribution, pull-to-refresh.
- [ ] Remove NewsAPI usage and rotate the key.
- **Acceptance:** News tab loads real Sunderland articles on web and native, no NewsAPI dependency, graceful offline behaviour.

### Phase 3 — Fixtures & live scores
- [ ] `utils/apiFootballService.ts`: fixtures by team/season, live fixtures.
- [ ] Feed `app/(tabs)/fixtures.tsx` from API-Football (PL + cups + Europa); keep ESPN as fallback.
- [ ] Matchday live polling (only inside the match window), with clear live UI.
- **Acceptance:** all competitions appear from one source; live score updates during a match without exhausting quota.

### Phase 4 — Match detail
- [ ] New match detail screen/route.
- [ ] Events, lineups, statistics, predictions, H2H sections with per-section caching.
- **Acceptance:** tapping a fixture shows events/lineups/stats; pre-match shows prediction + H2H.

### Phase 5 — Squad, injuries & transfers
- [ ] Squad list from `/players`; injuries and transfers sections.
- [ ] Link into the existing News/Stats surfaces where useful.
- **Acceptance:** squad with positions; current injuries; recent transfers.

### Phase 6 — Player stats
- [ ] Top scorers/assists via API-Football (replace/augment ESPN); optional FPL xG/xA enrichment.
- [ ] Integrate with existing `utils/statsService.ts` and Firestore `teamStats`.
- **Acceptance:** stats match official sources; shared cache avoids repeated upstream calls.

### Phase 7 — Hardening
- [ ] Per-section `last updated` labels and stale-data indicators.
- [ ] Worker logging/observability for upstream errors and budget usage.
- [ ] Fallback matrix documented (which provider covers which feature when another fails).
- **Acceptance:** a provider outage degrades gracefully with no blank screens.

## 7. Data model additions (Firestore)

- `teamStats/sunderland-stats` — extend with squad, injuries, transfers, top scorers/assists (or split into sub-docs to stay under the 1 MB doc limit).
- `matches/{fixtureId}` — events, lineups, stats, prediction, H2H; TTL/refresh metadata.
- `newsCache/latest` — normalised article list + `fetchedAt`.
- Worker KV: cache keys per endpoint + a `budget/{yyyy-mm-dd}` counter.

## 8. Risks

- **Shared 100/day quota** — mitigated by edge cache, Cron pre-warm and a budget guard. Without this, a few users can lock the app out.
- **Vendor lock-in / shape changes** — wrap every provider behind a service; never call APIs from components.
- **Unofficial sources** (ESPN, FPL) — keep behind fallbacks; expect breakage.
- **Licensing** — Guardian requires attribution; NewsAPI free is not production-legal; keep provider attribution visible.
- **`config/config.ts` secrets** — current keys are hardcoded and shipped. New keys must live in the worker; existing exposed keys should be rotated.
- **Doc size limits** — `teamStats` may approach the 1 MB Firestore doc limit if all data is inlined.

## 9. Non-goals (for now)

- Paid API tiers.
- Video highlights (no good free source).
- Full historical statistics / betting odds.
- Betting or prediction-as-advice features beyond informational predictions.

## 10. Open questions

1. Should API-Football fully replace football-data.org, or run alongside it as the cups/players source?
2. Is one news source (Guardian) enough, or do we want BBC RSS + Guardian combined?
3. Matchday live polling window — 30 min before kickoff to full time?
4. Where should match detail live — a new route/screen or an expandable card?
5. Do we want the optional FPL xG enrichment, given it is unofficial?
