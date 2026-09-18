# Football Data Sources — Research Report

Date: 18 September 2026
Status: Research only — no code changes made.
Scope: Find free (or near-free) football data sources to improve the BSSB Sunderland AFC app, focused on news, live scores, lineups, match events, injuries, transfers, predictions, head-to-head, and player stats.

---

## 1. What the app uses today

| Data | Source | Cost | Limitations / risk |
| --- | --- | --- | --- |
| Premier League fixtures + standings | football-data.org v4 (`https://api.football-data.org/v4`) | Free forever | Only 12 competitions; **scores delayed**, not live; 10 req/min; no lineups, players or match statistics; current season only |
| FA Cup / League Cup / Europa League fixtures | ESPN unofficial JSON (`site.web.api.espn.com`, Sunderland team id `366`) | Free | Undocumented and unversioned; no contract; can change or block without notice; bot-blocks the HTML pages (JSON works) |
| PL top scorers / assists | ESPN unofficial JSON (roster + per-athlete statistics, cached 24h) | Free | Same unofficial risk; cached in AsyncStorage + Firestore `teamStats/sunderland-stats` |
| News | NewsAPI.org `/v2/everything?q=Sunderland...` (key in `config/config.ts`) | Free developer tier | **Dev-only licence, localhost-only CORS, 24h article delay, 100 req/day** — not permitted in production |
| Geocoding / nearby places | OSM Nominatim + Overpass | Free | Rate-limited; attribution required (already handled in `utils/geocoding.ts`) |
| Events / posts / users | Firestore (own data) | Free tier | — |

Key gap identified: football-data.org's free tier **does not include** FA Cup, League Cup or the Europa League, which is exactly why the app depends on the ESPN workaround. A single provider that covers those competitions plus player/event data would remove that dependency.

Note on CORS: the web build (Expo web, `localhost:8081`) cannot call most sports APIs directly. football-data.org is already routed through the Cloudflare Worker `cloudflare-worker/src/index.js` (hides the key, adds CORS, 60s edge cache) via `EXPO_PUBLIC_FOOTBALL_DATA_PROXY_URL`. Any new provider should follow the same proxy pattern.

---

## 2. Fixtures, results and competitions

| Provider | Free tier | Covers | Format | Notes |
| --- | --- | --- | --- | --- |
| **football-data.org** (already used) | 12 competitions, free forever, 10 req/min | PL + 11 more | REST JSON | Scores delayed on free; no cups/Europa on free; no lineups/players/stats; livescores €12/mo; deep data €29/mo |
| **API-Football (api-sports.io)** | **100 req/day, ALL endpoints** | 1,244 leagues & cups incl. FA Cup, League Cup, Europa, PL | REST JSON | Free plan gives every endpoint; only volume/history differs by plan; key in `x-apisports-key` header; quota resets 00:00 UTC; paid from ~$19/mo |
| **openfootball / football.json** | Unlimited, no key | Many leagues incl. England, World Cup | Static JSON on GitHub raw | CC0 public domain; volunteer-updated; good for schedules/history, **not live** |
| **football-data.co.uk** | Unlimited, no key | 22 divisions incl. Championship, League One/Two | CSV/Excel downloads | 32 seasons results, 27 seasons odds + match stats; updated twice weekly; no API |
| **TheSportsDB** | Free V1 key `123`, 30 req/min | ~617 soccer leagues | REST JSON | Free search heavily limited (some free searches restricted to "Arsenal"); livescores, V2 API and highlights need $9/mo; good for artwork/badges by ID |
| **OpenLigaDB** | Free | German football only | REST JSON | Not relevant to SAFC |

## 3. Live scores

| Provider | Free? | Notes |
| --- | --- | --- |
| API-Football `/fixtures?live=all` | Yes (counts against 100/day) | Real live scores, minute, events |
| football-data.org | No | Delayed on free; livescores €12/mo |
| ESPN unofficial | Yes | Feed carries live `state: 'in'`; already used |
| TheSportsDB | No | 2-minute livescores require $9/mo |

## 4. Players, stats and advanced metrics

| Provider | Free? | Notes |
| --- | --- | --- |
| **API-Football** | Yes, all endpoints | Players, per-season stats, lineups, injuries, transfers, top scorers/assists, H2H, predictions |
| **FPL API** (`fantasy.premierleague.com/api/bootstrap-static/`) | Yes, no key, no auth | Every PL player: goals, assists, xG, xA, minutes, form, ICT, injuries, price; also `/fixtures/`, `/element-summary/{id}/`, `/event/{gw}/live/`; fields change per season; verify browser CORS |
| Understat | Unofficial | xG, 6 leagues since 2014/15; scraped; no official API; ToS caution |
| FotMob | Unofficial | Rich xG/team stats; ToS forbids systematic crawling |
| StatsBomb Open Data | Yes (research) | Event-level JSON + 360; only selected competitions/seasons; not live; attribution required |

## 5. News

| Provider | Free tier | Freshness | Commercial use on free? | Format |
| --- | --- | --- | --- | --- |
| **NewsAPI.org** (current) | 100 req/day | 24h delay | **No — dev/testing only, localhost CORS** | JSON |
| **Guardian Open Platform** | Free with attribution | Continuous | Yes (under Guardian T&C) | JSON, full text |
| **BBC Sport RSS** | Free | Near real-time | RSS syndication terms apply | RSS/XML |
| **NewsData.io** | 200 credits/day | ~12h delay | **Yes** | JSON |
| Currents API | 250–600 req/day | Near real-time | Yes | JSON |
| GNews | 100 req/day | Real-time | No (non-commercial) | JSON, truncated |
| GDELT | Unlimited | ~15 min sync | Open research | Metadata/links only |

BBC Sport publishes stable, free feeds, e.g. `https://feeds.bbci.co.uk/sport/football/rss.xml`, `.../sport/football/transfers/rss.xml`, and per-club feeds. No confirmed public RSS/API for Sunderland Echo.

## 6. Badges, crests and media

| Source | Free? | Notes |
| --- | --- | --- |
| football-data.org | Yes | Crest URLs included in responses |
| ESPN | Yes | Crest URLs already used |
| TheSportsDB | Yes, by ID | Team/league/player artwork, no key needed for lookup by ID |
| API-Football | Yes | Media endpoints for team/league logos and country flags |

## 7. Highlights / video

| Source | Free? | Notes |
| --- | --- | --- |
| Scorebat Video API | Limited | Free feed requires a token; limited leagues |
| TheSportsDB | No | YouTube highlight links require $9/mo |
| Official club/league | Varies | Rights-restricted; no general free API |

## 8. Recommendation summary

1. **API-Football (api-sports.io) free plan** — the single biggest upgrade. All endpoints, 100 req/day, covers cups and Europa, plus lineups, events, injuries, transfers, predictions, H2H and player stats. 100/day is ample for a small fan app when cached.
2. **FPL API** — free, keyless complement for PL player stats and xG. No quota to manage.
3. **Replace NewsAPI** — it is not licensed for production. Use Guardian Open Platform (free, JSON, attribution) as primary and/or BBC Sport RSS as a free fallback; NewsData.io is the commercial-safe option if a single JSON API is preferred.
4. **Keep football-data.org** for standings and PL fixtures (reliable, free forever), unless/until API-Football fully replaces it.
5. **Keep ESPN only as a fallback**, and treat it as fragile.
6. **Avoid scraping** FotMob/Understat beyond incidental use — ToS risk.

## 9. Key risks and caveats

- **NewsAPI free tier is not production-legal** (dev/localhost only, 24h delay, $449/mo jump to the first commercial tier). This is the most urgent fix.
- **API-Football 100/day is a shared upstream budget.** Without edge caching, a handful of web users could exhaust it. All calls should go through the Cloudflare Worker with caching and a schedule (see `PLAN.md`).
- **Unofficial/undocumented APIs** (ESPN, FPL, Understat, FotMob) can change shape or block at any time; always wrap them and degrade gracefully.
- **CORS on web**: any direct browser call needs the Worker proxy.
- **Attribution/terms**: Guardian requires attribution; StatsBomb requires attribution and research use; OSM requires attribution.
- **Season parameter**: API-Football and FPL use the season start year (2026 for 2026/27).

## 10. Reference links

- football-data.org — coverage https://www.football-data.org/coverage · pricing https://www.football-data.org/pricing
- API-Football — https://www.api-football.com · docs https://api-sports.io/documentation/football/v3
- FPL API — https://fantasy.premierleague.com/api/bootstrap-static/
- openfootball — https://github.com/openfootball/football.json
- football-data.co.uk — https://www.football-data.co.uk/data.php
- TheSportsDB — https://www.thesportsdb.com/docs_api_guide · pricing https://www.thesportsdb.com/docs_pricing
- StatsBomb Open Data — https://github.com/statsbomb/open-data
- Guardian Open Platform — https://open-platform.theguardian.com
- BBC Sport RSS — https://support.bbc.co.uk/platform/feeds/SportFeeds.htm
- NewsData.io — https://newsdata.io
- NewsAPI terms — https://newsapi.org/pricing
