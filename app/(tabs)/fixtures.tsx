import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native'
import axios from 'axios'
import { footballDataApiKey } from '../../config/config'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTeamStats, updateTeamStats } from '../../utils/statsService'
import { footballDataGet } from '../../utils/footballDataService'

type MatchHead2Head = {
  numberOfMatches: number
  totalGoals: number
  homeTeam: {
    wins: number
    draws: number
    losses: number
  }
  awayTeam: {
    wins: number
    draws: number
    losses: number
  }
}

type MatchReferee = {
  id: number
  name: string
  role: string
  nationality: string
}

type MatchScore = {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
  fullTime: {
    home: number | null
    away: number | null
  }
  halfTime?: {
    home: number | null
    away: number | null
  }
  extraTime?: {
    home: number | null
    away: number | null
  }
  penalties?: {
    home: number | null
    away: number | null
  }
}

type FixtureMatch = {
  id: number
  homeTeam: {
    id: number
    name: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    crest: string
  }
  status: string
  utcDate: string
  stage?: string
  matchday?: number
  score?: MatchScore
  referees?: MatchReferee[]
  head2head?: MatchHead2Head
  competition?: string
  source?: 'football-data' | 'espn'
}

type TeamStatistics = {
  id: number
  name: string
  crest: string
  founded: number
  venue: string
  runningCompetitions: Array<{
    id: number
    name: string
    code: string
    type: string
    emblem: string
  }>
}

type MatchStatistics = {
  totalMatches: number
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  cleanSheets: number
  homeRecord: {
    matches: number
    wins: number
    draws: number
    losses: number
  }
  awayRecord: {
    matches: number
    wins: number
    draws: number
    losses: number
  }
}

type PlayerScorer = {
  id: number
  name: string
  goals: number
  matches: number
  goalsPerMatch: number
}

type PlayerAssist = {
  id: number
  name: string
  assists: number
  matches: number
  assistsPerMatch: number
}

// Daily cache for the ESPN stats fetch. The ESPN JSON API has no documented
// limits but is implicitly rate-limited, and one fetch fires ~29 requests
// (1 roster + 28 per-athlete), so we only hit it once per day. The in-memory
// cache is a fast path for the current session; the AsyncStorage cache also
// survives app restarts / page reloads.
const ESPN_STATS_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // once per day
const ESPN_STATS_CACHE_KEY = 'espnTeamStatsDailyCache'
const espnStatsCache: {
  fetchedAt: number
  data: { scorers: PlayerScorer[]; assists: PlayerAssist[] } | null
} = { fetchedAt: 0, data: null }

export default function FixturesScreen(): React.ReactElement {
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([])
  const [pastFixtures, setPastFixtures] = useState<FixtureMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'stats'>(
    'upcoming',
  )
  const [isTabChanging, setIsTabChanging] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null)
  const [matchDetailsModalVisible, setMatchDetailsModalVisible] =
    useState(false)
  const [nextMatchCountdown, setNextMatchCountdown] = useState<string>('')
  const [nextMatchForm, setNextMatchForm] = useState<{
    homeTeam: string[]
    awayTeam: string[]
  } | null>(null)
  const [matchReminders, setMatchReminders] = useState<{
    [key: number]: string
  }>({})
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null)
  const [matchStats, setMatchStats] = useState<MatchStatistics | null>(null)
  const [topScorers, setTopScorers] = useState<PlayerScorer[]>([])
  const [topAssists, setTopAssists] = useState<PlayerAssist[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Countdown timer for next match
  useEffect(() => {
    if (fixtures.length === 0) return

    const nextMatch = fixtures[0]
    const updateCountdown = () => {
      const now = new Date().getTime()
      const matchTime = new Date(nextMatch.utcDate).getTime()
      const distance = matchTime - now

      if (distance < 0) {
        setNextMatchCountdown('Match started!')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      )
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      if (days > 0) {
        setNextMatchCountdown(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setNextMatchCountdown(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setNextMatchCountdown(`${minutes}m ${seconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [fixtures])

  // Fetch Sunderland's cup/European fixtures from ESPN's public JSON API.
  // football-data.org can't provide these on the free tier: the UEFA Europa
  // League (code 'EL') is paid-tier only, and the Carabao Cup isn't covered at
  // all. ESPN's JSON API is free, unblocked and CORS-enabled, so this works on
  // web and native.
  const ESPN_EXTRA_COMPETITIONS = [
    { slug: 'uefa.europa', name: 'UEFA Europa League' },
    { slug: 'eng.league_cup', name: 'Carabao Cup' },
  ]

  const espnCrest = (team: any): string =>
    team?.logo || team?.logos?.[0]?.href || ''

  const fetchExtraCompetitionsFixtures = useCallback(async (): Promise<{
    upcoming: FixtureMatch[]
    past: FixtureMatch[]
  }> => {
    const upcoming: FixtureMatch[] = []
    const past: FixtureMatch[] = []
    const season = new Date().getFullYear()

    for (const competition of ESPN_EXTRA_COMPETITIONS) {
      try {
        const baseUrl = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${competition.slug}/teams/366/schedule`
        // `fixture=true` returns upcoming fixtures; `season=` returns the
        // season's matches (finished ones). Fetch both and de-duplicate.
        const [fixtureRes, seasonRes] = await Promise.all([
          axios.get(baseUrl, { params: { fixture: true }, timeout: 20000 }),
          axios.get(baseUrl, { params: { season }, timeout: 20000 }),
        ])
        const events: any[] = [
          ...(fixtureRes?.data?.events || []),
          ...(seasonRes?.data?.events || []),
        ]
        console.log(
          `${competition.name} events from ESPN: ${events.length}`,
        )

        const seen = new Set<string>()
        events.forEach(event => {
          if (seen.has(String(event.id))) return
          seen.add(String(event.id))

          const comp = event.competitions?.[0]
          if (!comp) return
          const home = comp.competitors?.find(
            (c: any) => c.homeAway === 'home',
          )
          const away = comp.competitors?.find(
            (c: any) => c.homeAway === 'away',
          )
          if (!home?.team || !away?.team) return

          // ESPN state: 'pre' (scheduled) | 'in' (live) | 'post' (finished).
          // Some far-future fixtures have no status yet -> default SCHEDULED.
          const state = event.status?.type?.state
          const status =
            state === 'post'
              ? 'FINISHED'
              : state === 'in'
                ? 'IN_PLAY'
                : 'SCHEDULED'

          const homeScore =
            home.score != null ? parseInt(home.score, 10) : null
          const awayScore =
            away.score != null ? parseInt(away.score, 10) : null

          const match: FixtureMatch = {
            id: parseInt(event.id, 10),
            utcDate: event.date,
            status,
            homeTeam: {
              id: parseInt(home.team.id, 10) || 0,
              name: home.team.displayName,
              crest: espnCrest(home.team),
            },
            awayTeam: {
              id: parseInt(away.team.id, 10) || 0,
              name: away.team.displayName,
              crest: espnCrest(away.team),
            },
            competition: competition.name,
            source: 'espn',
          }

          if (
            status === 'FINISHED' &&
            homeScore !== null &&
            awayScore !== null
          ) {
            match.score = {
              winner:
                homeScore > awayScore
                  ? 'HOME_TEAM'
                  : awayScore > homeScore
                    ? 'AWAY_TEAM'
                    : 'DRAW',
              duration: 'REGULAR',
              fullTime: { home: homeScore, away: awayScore },
            }
            past.push(match)
          } else {
            upcoming.push(match)
          }
        })
      } catch (error) {
        console.error(
          `Error fetching ${competition.name} fixtures from ESPN:`,
          error,
        )
      }
    }

    console.log(
      `✅ Extra competitions fixtures: ${upcoming.length} upcoming, ${past.length} finished`,
    )
    return { upcoming, past }
  }, [])

  const fetchFixtures = useCallback(async () => {
    try {
      console.log('Fetching fixtures started')
      setLoading(true)
      setError(null)

      // EFL Championship league code
      const upcomingResponse = await footballDataGet(
        'competitions/PL/matches',
        {
          headers: {
            'X-Auth-Token': footballDataApiKey,
          },
          params: {
            status: 'SCHEDULED',
            limit: 10,
          },
        },
      )

      const pastResponse = await footballDataGet('competitions/PL/matches', {
        headers: {
          'X-Auth-Token': footballDataApiKey,
        },
        params: {
          status: 'FINISHED',
          limit: 10,
        },
      })

      // console.log('Upcoming Matches Raw Response:', JSON.stringify(upcomingResponse.data, null, 2));
      // console.log('Past Matches Raw Response:', JSON.stringify(pastResponse.data, null, 2));

      // Filter for Sunderland matches
      const sunderlandUpcomingFixtures = upcomingResponse.data.matches.filter(
        (match: FixtureMatch) =>
          match.homeTeam.name.includes('Sunderland') ||
          match.awayTeam.name.includes('Sunderland'),
      )

      const sunderlandPastFixtures = pastResponse.data.matches
        .filter(
          (match: FixtureMatch) =>
            match.homeTeam.name.includes('Sunderland') ||
            match.awayTeam.name.includes('Sunderland'),
        )
        .sort(
          (a: FixtureMatch, b: FixtureMatch) =>
            new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
        )

      // console.log('Upcoming Fixtures:', sunderlandUpcomingFixtures.length);
      // console.log('Past Fixtures:', sunderlandPastFixtures.length);

      // Tag PL fixtures with competition info so the UI can distinguish
      // them from Europa League matches
      const taggedUpcomingFixtures = sunderlandUpcomingFixtures.map(
        (match: FixtureMatch) => ({
          ...match,
          competition: 'Premier League',
          source: 'football-data' as const,
        }),
      )

      const taggedPastFixtures = sunderlandPastFixtures.map(
        (match: FixtureMatch) => ({
          ...match,
          competition: 'Premier League',
          source: 'football-data' as const,
        }),
      )

      // Cup/European fixtures (Carabao Cup + UEFA Europa League) from ESPN's
      // JSON API — EL is paid-tier only on football-data.org and the Carabao
      // Cup isn't covered at all. Failures don't break PL display.
      const extra = await fetchExtraCompetitionsFixtures()

      // Merge PL + EL fixtures, sorted by date
      const allUpcoming = [...taggedUpcomingFixtures, ...extra.upcoming].sort(
        (a: FixtureMatch, b: FixtureMatch) =>
          new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
      )

      const allPast = [...taggedPastFixtures, ...extra.past].sort(
        (a: FixtureMatch, b: FixtureMatch) =>
          new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
      )

      // Ensure we have data
      if (allUpcoming.length === 0 && allPast.length === 0) {
        setError('No Sunderland fixtures found')
      }

      setFixtures(allUpcoming)
      setPastFixtures(allPast)

      // Fetch form for next match (only for football-data matches — ESPN
      // team IDs don't exist in the football-data API)
      if (allUpcoming.length > 0) {
        const nextMatch = allUpcoming[0]
        if (nextMatch.source !== 'espn') {
          await fetchTeamsForm(nextMatch.homeTeam.id, nextMatch.awayTeam.id)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Full Error Object:', err)
      console.error('Error Response:', (err as any).response?.data)

      let errorMessage = 'Failed to fetch match fixtures'
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The request was made and the server responded with a status code
          errorMessage = `API Error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server'
        }
      }

      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  const fetchTeamsForm = async (homeTeamId: number, awayTeamId: number) => {
    try {
      // Fetch last matches for both teams
      const [homeTeamMatches, awayTeamMatches] = await Promise.all([
        footballDataGet(`teams/${homeTeamId}/matches`, {
          headers: { 'X-Auth-Token': footballDataApiKey },
          params: { status: 'FINISHED', limit: 5 },
        }),
        footballDataGet(`teams/${awayTeamId}/matches`, {
          headers: { 'X-Auth-Token': footballDataApiKey },
          params: { status: 'FINISHED', limit: 5 },
        }),
      ])

      const homeForm = homeTeamMatches.data.matches.map(
        (match: FixtureMatch) => {
          const isHome = match.homeTeam.id === homeTeamId
          const teamScore = isHome
            ? match.score?.fullTime?.home
            : match.score?.fullTime?.away
          const opponentScore = isHome
            ? match.score?.fullTime?.away
            : match.score?.fullTime?.home

          if (
            teamScore === null ||
            teamScore === undefined ||
            opponentScore === null ||
            opponentScore === undefined
          )
            return 'U'
          if (teamScore > opponentScore) return 'W'
          if (teamScore < opponentScore) return 'L'
          return 'D'
        },
      )

      const awayForm = awayTeamMatches.data.matches.map(
        (match: FixtureMatch) => {
          const isHome = match.homeTeam.id === awayTeamId
          const teamScore = isHome
            ? match.score?.fullTime?.home
            : match.score?.fullTime?.away
          const opponentScore = isHome
            ? match.score?.fullTime?.away
            : match.score?.fullTime?.home

          if (
            teamScore === null ||
            teamScore === undefined ||
            opponentScore === null ||
            opponentScore === undefined
          )
            return 'U'
          if (teamScore > opponentScore) return 'W'
          if (teamScore < opponentScore) return 'L'
          return 'D'
        },
      )

      setNextMatchForm({
        homeTeam: homeForm,
        awayTeam: awayForm,
      })
    } catch (err) {
      console.error('Error fetching teams form:', err)
    }
  }

  // Fetch top scorers/assists from ESPN's JSON API (not the HTML page).
  // The HTML stats page is bot-blocked (HTTP 202) for non-browser requests,
  // but ESPN's JSON API (site.api.espn.com + sports.core.api.espn.com) is
  // public and sends Access-Control-Allow-Origin: *, so it works on web and
  // native. It returns real per-player goals AND assists for the whole squad.
  const fetchTopStatsFromESPN = useCallback(
    async (): Promise<{
      scorers: PlayerScorer[]
      assists: PlayerAssist[]
    } | null> => {
      const ESPN_TEAM_ID = 366 // Sunderland (ESPN id)
      const ESPN_LEAGUE = 'eng.1' // English Premier League
      const season = new Date().getFullYear()

      // Serve from cache when fresh (fast in-memory path for this session)
      if (
        espnStatsCache.data &&
        Date.now() - espnStatsCache.fetchedAt < ESPN_STATS_CACHE_TTL_MS
      ) {
        console.log('✅ Using cached ESPN stats')
        return espnStatsCache.data
      }

      // Serve from the persistent daily cache (survives app restarts)
      try {
        const cachedRaw = await AsyncStorage.getItem(ESPN_STATS_CACHE_KEY)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw)
          if (
            cached?.data &&
            Date.now() - (cached.fetchedAt || 0) < ESPN_STATS_CACHE_TTL_MS
          ) {
            console.log('✅ Using daily-cached ESPN stats (fetches once/day)')
            espnStatsCache.fetchedAt = cached.fetchedAt
            espnStatsCache.data = cached.data
            return cached.data
          }
        }
      } catch (error) {
        console.error('Error reading ESPN stats daily cache:', error)
      }

      try {
        const rosterResponse = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${ESPN_LEAGUE}/teams/${ESPN_TEAM_ID}/roster`,
          { timeout: 20000 },
        )
        const athletes = rosterResponse?.data?.athletes
        if (!athletes || athletes.length === 0) {
          console.log('⚠️ ESPN roster returned no athletes')
          return null
        }

        // Fetch per-athlete stats in parallel
        const statsResults = await Promise.all(
          athletes.map(async (athlete: any) => {
            try {
              const res = await axios.get(
                `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${ESPN_LEAGUE}/seasons/${season}/types/1/athletes/${athlete.id}/statistics`,
                { timeout: 20000 },
              )
              const splits = res?.data?.splits
              const categories: any[] = splits?.categories || []
              const general = categories.find(c => c.name === 'general')
              const offensive = categories.find(c => c.name === 'offensive')
              const getStat = (cat: any, name: string): number => {
                if (!cat || !cat.stats) return 0
                const stat = cat.stats.find(
                  (s: any) => s.name === name || s.abbreviation === name,
                )
                const v = stat ? stat.value : 0
                return typeof v === 'number' ? v : parseInt(v, 10) || 0
              }
              return {
                id: athlete.id,
                name: athlete.displayName || athlete.fullName,
                position:
                  athlete.position?.abbreviation || athlete.position?.name || '',
                appearances: getStat(general, 'appearances'),
                goals: getStat(offensive, 'totalGoals'),
                assists: getStat(offensive, 'goalAssists'),
                hasStats: !!splits,
              }
            } catch (error) {
              // Some athletes (e.g. never-appeared backups) have no stats row.
              return { id: athlete.id, name: athlete.displayName, skipped: true }
            }
          }),
        )

        const withStats = statsResults.filter(
          (r: any) => !r.skipped && r.appearances > 0,
        )

        // Top Scorers: everyone who has played, sorted by goals desc
        // (includes 0-goal players, mirroring the ESPN page layout so the
        // section always shows 5 players like Top Assists does). The tiebreak
        // (appearances, then name) keeps the order stable.
        const scorers: PlayerScorer[] = withStats
          .sort(
            (a: any, b: any) =>
              b.goals - a.goals ||
              b.appearances - a.appearances ||
              a.name.localeCompare(b.name),
          )
          .slice(0, 5)
          .map((p: any, index: number) => ({
            id: index + 1,
            name: p.name,
            goals: p.goals,
            matches: p.appearances,
            goalsPerMatch:
              p.appearances > 0 ? p.goals / p.appearances : 0,
          }))

        // Top Assists: everyone who has played, sorted by assists desc
        // (includes 0-assist players, mirroring the ESPN page layout). If no
        // player has an assist yet (e.g. goal was a direct free-kick), it
        // lists the played players at 0 rather than hiding the section. The
        // tiebreak (appearances, then name) keeps the order stable.
        const assists: PlayerAssist[] = withStats
          .sort(
            (a: any, b: any) =>
              b.assists - a.assists ||
              b.appearances - a.appearances ||
              a.name.localeCompare(b.name),
          )
          .slice(0, 5)
          .map((p: any, index: number) => ({
            id: index + 100,
            name: p.name,
            assists: p.assists,
            matches: p.appearances,
            assistsPerMatch:
              p.appearances > 0 ? p.assists / p.appearances : 0,
          }))

        if (scorers.length === 0 && assists.length === 0) {
          console.log('⚠️ ESPN stats had no players with appearances')
          return null
        }

        console.log(
          '✅ Fetched Sunderland stats from ESPN JSON API:',
          JSON.stringify({ scorers, assists }),
        )

        // Update the in-memory cache AND persist the daily cache so the
        // ESPN fetch only happens once per day (survives restarts).
        espnStatsCache.fetchedAt = Date.now()
        espnStatsCache.data = { scorers, assists }
        try {
          await AsyncStorage.setItem(
            ESPN_STATS_CACHE_KEY,
            JSON.stringify({
              fetchedAt: espnStatsCache.fetchedAt,
              data: espnStatsCache.data,
            }),
          )
        } catch (error) {
          console.error('Error saving ESPN stats daily cache:', error)
        }
        return espnStatsCache.data
      } catch (error) {
        console.error('❌ Error fetching from ESPN JSON API:', error)
        return null
      }
    },
    [],
  )
// Fetch top scorers/assists from the football-data.org API.
  // Fallback live source for scorers (web via the Cloudflare proxy + native).
  // NOTE: its scorers endpoint only lists goal-scorers and returns assists=null
  // for the current season, so assists should come from ESPN's JSON API.
  const fetchTopScorersFromAPI = useCallback(
    async (
      sunderlandTeamId: number,
    ): Promise<{ scorers: PlayerScorer[]; assists: PlayerAssist[] } | null> => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const seasonStartYear = currentMonth >= 8 ? currentYear : currentYear - 1

      // Try leagues in order (Sunderland currently in the Premier League);
      // covers promotion/relegation so the stats keep working each season.
      const competitions = [
        { id: '2021', label: 'Premier League' },
        { id: '2016', label: 'Championship' },
        { id: '2015', label: 'League One' },
      ]

      for (const competition of competitions) {
        try {
          console.log(
            `Fetching Sunderland stats from ${competition.label} (${competition.id}) for ${seasonStartYear}-${seasonStartYear + 1}`,
          )

          const response = await footballDataGet(
            `competitions/${competition.id}/scorers`,
            {
              headers: { 'X-Auth-Token': footballDataApiKey },
              params: { season: seasonStartYear, limit: 50 },
            },
          )

          const scorersList = response?.data?.scorers
          if (!scorersList || scorersList.length === 0) continue

          const sunderlandStats = scorersList.filter(
            (scorer: any) =>
              scorer.team?.id === sunderlandTeamId ||
              (scorer.team?.name || '').includes('Sunderland'),
          )

          if (sunderlandStats.length === 0) continue

          const scorers: PlayerScorer[] = [...sunderlandStats]
            .filter((scorer: any) => (scorer.goals || 0) > 0)
            .sort(
              (a: any, b: any) =>
                (b.goals || 0) - (a.goals || 0) ||
                (a.playedMatches || 0) - (b.playedMatches || 0),
            )
            .slice(0, 5)
            .map((scorer: any) => ({
              id: scorer.player.id,
              name: scorer.player.name,
              goals: scorer.goals || 0,
              matches: scorer.playedMatches || 0,
              goalsPerMatch:
                scorer.playedMatches > 0
                  ? (scorer.goals || 0) / scorer.playedMatches
                  : 0,
            }))

          const assists: PlayerAssist[] = [...sunderlandStats]
            // No >0 filter: keep the section populated even when no player has
            // an assist yet (mirrors ESPN, which lists players at 0 assists).
            .sort(
              (a: any, b: any) =>
                (b.assists || 0) - (a.assists || 0) ||
                (a.playedMatches || 0) - (b.playedMatches || 0),
            )
            .slice(0, 5)
            .map((scorer: any) => ({
              id: (scorer.player.id || 0) + 100,
              name: scorer.player.name,
              assists: scorer.assists || 0,
              matches: scorer.playedMatches || 0,
              assistsPerMatch:
                scorer.playedMatches > 0
                  ? (scorer.assists || 0) / scorer.playedMatches
                  : 0,
            }))

          console.log(
            '✅ Fetched Sunderland stats from API:',
            JSON.stringify({ scorers, assists }),
          )

          return { scorers, assists }
        } catch (error) {
          console.error(
            `Error fetching ${competition.label} scorers from API:`,
            error,
          )
        }
      }

      return null
    },
    [],
  )

  const STATS_CACHE_KEY = 'lastFetchedTeamStats'

  const persistFetchedStats = useCallback(
    async (scorers: PlayerScorer[], assists: PlayerAssist[]) => {
      try {
        await AsyncStorage.setItem(
          STATS_CACHE_KEY,
          JSON.stringify({ scorers, assists, savedAt: Date.now() }),
        )
      } catch (error) {
        console.error('Error caching team stats:', error)
      }
    },
    [],
  )

  const loadStaleStats = useCallback(async (): Promise<{
    scorers: PlayerScorer[]
    assists: PlayerAssist[]
  } | null> => {
    // Prefer Firestore first — it's the synced source of truth (admin updates
    // and live-fetch syncs both write here), so it reflects the latest data.
    try {
      const firestoreStats = await getTeamStats()
      if (
        firestoreStats &&
        (firestoreStats.scorers.length > 0 || firestoreStats.assists.length > 0)
      ) {
        return {
          scorers: firestoreStats.scorers,
          assists: firestoreStats.assists,
        }
      }
    } catch (error) {
      console.error('Error loading Firestore team stats:', error)
    }

    try {
      const cached = await AsyncStorage.getItem(STATS_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.scorers?.length || parsed?.assists?.length) {
          return {
            scorers: parsed.scorers || [],
            assists: parsed.assists || [],
          }
        }
      }
    } catch (error) {
      console.error('Error reading cached team stats:', error)
    }

    return null
  }, [])

  // Fetch top scorers and assists from live sources; keep last fetch if all fail
  const fetchTopScorers = useCallback(
    async (sunderlandTeamId: number) => {
      console.log(
        'Fetching top scorers and assists for team ID:',
        sunderlandTeamId,
      )

      const staleStats = await loadStaleStats()
      if (staleStats) {
        console.log('Showing last fetched stats while refreshing')
        setTopScorers(staleStats.scorers)
        setTopAssists(staleStats.assists)
      }

      // 1) ESPN JSON API — primary live source. Returns real per-player goals
      //    AND assists (Access-Control-Allow-Origin: * so it works on web and
      //    native, unlike the bot-blocked ESPN HTML page).
      try {
        const espnStats = await fetchTopStatsFromESPN()
        if (
          espnStats &&
          (espnStats.scorers.length > 0 || espnStats.assists.length > 0)
        ) {
          console.log('✅ Using ESPN JSON API data')
          setTopScorers(espnStats.scorers)
          setTopAssists(espnStats.assists)
          await persistFetchedStats(espnStats.scorers, espnStats.assists)
          // Keep the Firestore stats doc in sync with the latest live data
          try {
            await updateTeamStats(espnStats.scorers, espnStats.assists)
          } catch (error) {
            console.error('Error syncing team stats to Firestore:', error)
          }
          return
        }
      } catch (error) {
        console.error('Error fetching top stats from ESPN JSON API:', error)
      }

      // 2) football-data.org API — fallback for scorers (its scorers endpoint
      //    only lists goal-scorers, so assists are not available from it).
      try {
        const apiStats = await fetchTopScorersFromAPI(sunderlandTeamId)
        if (
          apiStats &&
          (apiStats.scorers.length > 0 || apiStats.assists.length > 0)
        ) {
          console.log('✅ Using football-data.org API data')
          const assists =
            apiStats.assists.length > 0
              ? apiStats.assists
              : staleStats?.assists || []
          setTopScorers(apiStats.scorers)
          setTopAssists(assists)
          await persistFetchedStats(apiStats.scorers, assists)
          // Keep the Firestore stats doc in sync with the latest live data
          try {
            await updateTeamStats(apiStats.scorers, assists)
          } catch (error) {
            console.error('Error syncing team stats to Firestore:', error)
          }
          return
        }
      } catch (error) {
        console.error('Error fetching top scorers from API:', error)
      }

      if (staleStats) {
        console.log('Live fetch failed, keeping last fetched stats')
      } else {
        console.log('No live or stale stats available')
      }
    },
    [
      fetchTopScorersFromAPI,
      fetchTopStatsFromESPN,
      loadStaleStats,
      persistFetchedStats,
    ],
  )

  // Calculate match statistics from fixtures data (PL matches only — ESPN
  // Europa League matches use ESPN team IDs and a different competition)
  const calculateMatchStatistics = useCallback(
    (sunderlandTeamId: number): MatchStatistics => {
      const allMatches = pastFixtures.filter(
        match => match.source !== 'espn',
      ) // Only use completed PL matches
      const sunderlandMatches = allMatches.filter(
        match =>
          (match.homeTeam.id === sunderlandTeamId ||
            match.awayTeam.id === sunderlandTeamId) &&
          match.score?.fullTime?.home !== null &&
          match.score?.fullTime?.away !== null,
      )

      let wins = 0,
        draws = 0,
        losses = 0
      let goalsScored = 0,
        goalsConceded = 0,
        cleanSheets = 0
      let homeWins = 0,
        homeDraws = 0,
        homeLosses = 0,
        homeMatches = 0
      let awayWins = 0,
        awayDraws = 0,
        awayLosses = 0,
        awayMatches = 0

      sunderlandMatches.forEach(match => {
        const isHome = match.homeTeam.id === sunderlandTeamId
        const sunderlandGoals = isHome
          ? match.score!.fullTime!.home!
          : match.score!.fullTime!.away!
        const opponentGoals = isHome
          ? match.score!.fullTime!.away!
          : match.score!.fullTime!.home!

        goalsScored += sunderlandGoals
        goalsConceded += opponentGoals

        if (opponentGoals === 0) cleanSheets++

        if (sunderlandGoals > opponentGoals) {
          wins++
          if (isHome) {
            homeWins++
            homeMatches++
          } else {
            awayWins++
            awayMatches++
          }
        } else if (sunderlandGoals === opponentGoals) {
          draws++
          if (isHome) {
            homeDraws++
            homeMatches++
          } else {
            awayDraws++
            awayMatches++
          }
        } else {
          losses++
          if (isHome) {
            homeLosses++
            homeMatches++
          } else {
            awayLosses++
            awayMatches++
          }
        }
      })

      return {
        totalMatches: sunderlandMatches.length,
        wins,
        draws,
        losses,
        goalsScored,
        goalsConceded,
        cleanSheets,
        homeRecord: {
          matches: homeMatches,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
        },
        awayRecord: {
          matches: awayMatches,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
        },
      }
    },
    [pastFixtures],
  )

  // Fetch team statistics
  const fetchTeamStatistics = useCallback(async () => {
    setStatsLoading(true)
    try {
      // Get Sunderland team ID from fixtures data (football-data only —
      // ESPN-sourced Europa League matches use ESPN team IDs)
      let sunderlandTeamId = null

      // Try to find Sunderland team ID from existing fixtures
      if (fixtures.length > 0) {
        const sunderlandMatch = fixtures.find(
          match =>
            match.source !== 'espn' &&
            (match.homeTeam.name.includes('Sunderland') ||
              match.awayTeam.name.includes('Sunderland')),
        )
        if (sunderlandMatch) {
          sunderlandTeamId = sunderlandMatch.homeTeam.name.includes(
            'Sunderland',
          )
            ? sunderlandMatch.homeTeam.id
            : sunderlandMatch.awayTeam.id
        }
      }

      // If not found in upcoming, try past fixtures
      if (!sunderlandTeamId && pastFixtures.length > 0) {
        const sunderlandMatch = pastFixtures.find(
          match =>
            match.source !== 'espn' &&
            (match.homeTeam.name.includes('Sunderland') ||
              match.awayTeam.name.includes('Sunderland')),
        )
        if (sunderlandMatch) {
          sunderlandTeamId = sunderlandMatch.homeTeam.name.includes(
            'Sunderland',
          )
            ? sunderlandMatch.homeTeam.id
            : sunderlandMatch.awayTeam.id
        }
      }

      if (!sunderlandTeamId) {
        setError('Could not find Sunderland team ID')
        return
      }

      console.log('Found Sunderland team ID:', sunderlandTeamId)
      console.log('Fetching team stats for:', sunderlandTeamId)

      const response = await footballDataGet(`teams/${sunderlandTeamId}`, {
        headers: {
          'X-Auth-Token': footballDataApiKey,
        },
      })

      setTeamStats(response.data)

      // Calculate match statistics from fixtures data
      const matchStatistics = calculateMatchStatistics(sunderlandTeamId)
      setMatchStats(matchStatistics)
      console.log('Match Statistics:', matchStatistics)

      // Fetch top scorers data
      await fetchTopScorers(sunderlandTeamId)
    } catch (err) {
      console.error('Error fetching team statistics:', err)
      let errorMessage = 'Failed to fetch team statistics'
      setError(errorMessage)
    } finally {
      setStatsLoading(false)
    }
  }, [fixtures, pastFixtures, calculateMatchStatistics, fetchTopScorers])

  // Load saved reminders
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const saved = await AsyncStorage.getItem('matchReminders')
        if (saved) {
          setMatchReminders(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading reminders:', error)
      }
    }
    loadReminders()
  }, [])

  const scheduleMatchReminder = async (match: FixtureMatch) => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications to set reminders.',
        )
        return
      }

      const matchDate = new Date(match.utcDate)
      const now = new Date()

      // Check if match is in the past
      if (matchDate <= now) {
        Alert.alert('Invalid Time', 'Cannot set reminder for past matches.')
        return
      }

      // Schedule notification 1 hour before match
      const reminderTime = new Date(matchDate.getTime() - 60 * 60 * 1000)

      // Check if reminder time is in the past (match is less than 1 hour away)
      if (reminderTime <= now) {
        Alert.alert(
          'Match Too Soon',
          'This match starts in less than 1 hour. You can set reminders for future matches.',
        )
        return
      }

      console.log('Current time:', now)
      console.log('Match date:', matchDate)
      console.log('Reminder time (1h before match):', reminderTime)

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Match starting soon ⚽',
          body: `${match.homeTeam.name} vs ${match.awayTeam.name} kicks off in 1 hour`,
          data: { type: 'match_reminder', matchId: match.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      })
      console.log('Scheduled match reminder:', notificationId, reminderTime)

      // Save reminder
      const newReminders = { ...matchReminders, [match.id]: notificationId }
      setMatchReminders(newReminders)
      await AsyncStorage.setItem('matchReminders', JSON.stringify(newReminders))

      // Show confirmation alert (this is NOT a push notification)
      const matchDateStr = matchDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const matchTimeStr = matchDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const reminderDateStr = reminderTime.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const reminderTimeStr = reminderTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      Alert.alert(
        '🔔 Reminder Set!',
        `You'll receive a notification 1 hour before kickoff.\n\n📅 Match: ${matchDateStr} at ${matchTimeStr}\n⏰ Reminder: ${reminderDateStr} at ${reminderTimeStr}\n\n${match.homeTeam.name} vs ${match.awayTeam.name}`,
      )

      console.log('Notification scheduled for:', reminderTime)
    } catch (error) {
      console.error('Error scheduling reminder:', error)
      Alert.alert('Error', 'Failed to set reminder. Please try again.')
    }
  }

  const cancelMatchReminder = async (matchId: number) => {
    try {
      const notificationId = matchReminders[matchId]
      if (notificationId) {
        if (!notificationId.startsWith('disabled_')) {
          await Notifications.cancelScheduledNotificationAsync(notificationId)
        }

        const newReminders = { ...matchReminders }
        delete newReminders[matchId]
        setMatchReminders(newReminders)
        await AsyncStorage.setItem(
          'matchReminders',
          JSON.stringify(newReminders),
        )

        Alert.alert('Reminder Cancelled', 'Match reminder has been removed.')
      }
    } catch (error) {
      console.error('Error cancelling reminder:', error)
      Alert.alert('Error', 'Failed to cancel reminder.')
    }
  }

  const toggleReminder = (match: FixtureMatch) => {
    if (matchReminders[match.id]) {
      cancelMatchReminder(match.id)
    } else {
      scheduleMatchReminder(match)
    }
  }

  const fetchMatchDetails = async (
    matchId: number,
  ): Promise<FixtureMatch | undefined> => {
    try {
      const response = await footballDataGet(`matches/${matchId}`, {
        headers: {
          'X-Auth-Token': footballDataApiKey,
        },
        params: {
          head2head: 10, // Fetch last 10 head-to-head matches
        },
      })
      return response.data
    } catch (err) {
      console.error('Error fetching match details:', err)
      return undefined
    }
  }

  const openMatchDetails = async (match: FixtureMatch) => {
    try {
      // Fetch additional match details for finished football-data matches
      // (ESPN-sourced matches aren't in the football-data API)
      if (match.status === 'FINISHED' && match.source !== 'espn') {
        const detailedMatch = await fetchMatchDetails(match.id)
        setSelectedMatch(detailedMatch || match)
      } else {
        setSelectedMatch(match)
      }
      setMatchDetailsModalVisible(true)
    } catch (err) {
      console.error('Error opening match details:', err)
    }
  }

  const renderFixtureItem = ({
    item,
    isPast,
  }: {
    item: FixtureMatch
    isPast?: boolean
  }) => {
    const hasReminder = matchReminders[item.id]

    return (
      <View style={styles.fixtureItem}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.utcDate)}</Text>
          {item.competition && (
            <Text style={styles.competitionTag}>{item.competition}</Text>
          )}
          {!isPast && (
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => toggleReminder(item)}
            >
              <Ionicons
                name={hasReminder ? 'notifications' : 'notifications-outline'}
                size={20}
                color={hasReminder ? '#e21d38' : '#666'}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.matchContainer}>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: item.homeTeam.crest }}
              style={styles.teamLogo}
              resizeMode='contain'
            />
            <Text style={styles.teamName}>{item.homeTeam.name}</Text>
          </View>
          <View style={styles.vsContainer}>
            {isPast ? (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {item.score?.fullTime?.home ?? '-'} -{' '}
                  {item.score?.fullTime?.away ?? '-'}
                </Text>
              </View>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: item.awayTeam.crest }}
              style={styles.teamLogo}
              resizeMode='contain'
            />
            <Text style={styles.teamName}>{item.awayTeam.name}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    )
  }

  const handleTabChange = useCallback(
    (tab: 'upcoming' | 'past' | 'stats') => {
      console.log(`Tab change initiated: ${tab}`)
      if (isTabChanging) return

      setIsTabChanging(true)

      // Use setTimeout to prevent rapid successive calls
      const timeoutId = setTimeout(
        () => {
          console.log(`Tab change completed: ${tab}`)
          setActiveTab(tab)
          setIsTabChanging(false)
        },
        Platform.OS === 'android' ? 200 : 0,
      )

      // Cleanup function to clear timeout
      return () => clearTimeout(timeoutId)
    },
    [isTabChanging],
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const renderFormBadge = (result: string) => {
    let backgroundColor = '#ccc'
    if (result === 'W') backgroundColor = '#4CAF50'
    if (result === 'L') backgroundColor = '#f44336'
    if (result === 'D') backgroundColor = '#FF9800'

    return (
      <View key={Math.random()} style={[styles.formBadge, { backgroundColor }]}>
        <Text style={styles.formBadgeText}>{result}</Text>
      </View>
    )
  }

  const renderNextMatchCountdown = () => {
    if (fixtures.length === 0 || activeTab !== 'upcoming') return null

    const nextMatch = fixtures[0]
    const hasReminder = matchReminders[nextMatch.id]

    return (
      <View style={styles.countdownContainer}>
        <View style={styles.countdownHeader}>
          <Ionicons name='time-outline' size={24} color='#e21d38' />
          <Text style={styles.countdownTitle}>Next Match</Text>
          <TouchableOpacity
            style={styles.countdownReminderButton}
            onPress={() => toggleReminder(nextMatch)}
          >
            <Ionicons
              name={hasReminder ? 'notifications' : 'notifications-outline'}
              size={24}
              color={hasReminder ? '#e21d38' : '#666'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.countdownMatchInfo}>
          <View style={styles.countdownTeams}>
            <View style={styles.countdownTeamColumn}>
              <Image
                source={{ uri: nextMatch.homeTeam.crest }}
                style={styles.countdownLogo}
              />
              {nextMatchForm && nextMatchForm.homeTeam.length > 0 && (
                <View style={styles.teamFormBadges}>
                  {nextMatchForm.homeTeam.map((result, index) => (
                    <View key={index}>{renderFormBadge(result)}</View>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.countdownVs}>vs</Text>
            <View style={styles.countdownTeamColumn}>
              <Image
                source={{ uri: nextMatch.awayTeam.crest }}
                style={styles.countdownLogo}
              />
              {nextMatchForm && nextMatchForm.awayTeam.length > 0 && (
                <View style={styles.teamFormBadges}>
                  {nextMatchForm.awayTeam.map((result, index) => (
                    <View key={index}>{renderFormBadge(result)}</View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Text style={styles.countdownTimer}>{nextMatchCountdown}</Text>
          <Text style={styles.countdownDate}>
            {formatDate(nextMatch.utcDate)}
          </Text>
        </View>
      </View>
    )
  }

  const renderMatchDetailsModal = () => {
    if (!selectedMatch) return null

    return (
      <Modal
        animationType='slide'
        transparent={true}
        visible={matchDetailsModalVisible}
        onRequestClose={() => setMatchDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Image
                  source={{ uri: selectedMatch.homeTeam.crest }}
                  style={styles.modalTeamLogo}
                  resizeMode='contain'
                />
                <Text style={styles.modalMatchScore}>
                  {selectedMatch.score?.fullTime?.home ?? '-'} -{' '}
                  {selectedMatch.score?.fullTime?.away ?? '-'}
                </Text>
                <Image
                  source={{ uri: selectedMatch.awayTeam.crest }}
                  style={styles.modalTeamLogo}
                  resizeMode='contain'
                />
              </View>
              <Text style={styles.modalTeamNames}>
                {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
              </Text>
              <View style={styles.matchDetailsContainer}>
                <Text style={styles.matchDetailsTitle}>Match Details</Text>
                <View style={styles.matchDetailRow}>
                  <Text style={styles.matchDetailLabel}>Date:</Text>
                  <Text style={styles.matchDetailValue}>
                    {formatDate(selectedMatch.utcDate)}
                  </Text>
                </View>
                <View style={styles.matchDetailRow}>
                  <Text style={styles.matchDetailLabel}>Status:</Text>
                  <Text style={styles.matchDetailValue}>
                    {selectedMatch.status}
                  </Text>
                </View>
                {selectedMatch.score && (
                  <View style={styles.matchDetailRow}>
                    <Text style={styles.matchDetailLabel}>Score:</Text>
                    <Text style={styles.matchDetailValue}>
                      {selectedMatch.score.fullTime.home} -{' '}
                      {selectedMatch.score.fullTime.away}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    )
  }

  useEffect(() => {
    fetchFixtures()
  }, [fetchFixtures])

  // Auto-fetch team stats when fixtures are loaded and stats tab is active
  useEffect(() => {
    if (
      activeTab === 'stats' &&
      !teamStats &&
      !statsLoading &&
      (fixtures.length > 0 || pastFixtures.length > 0)
    ) {
      fetchTeamStatistics()
    }
  }, [activeTab, teamStats, statsLoading, fixtures.length, pastFixtures.length])

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <ActivityIndicator size='large' color='#e21d38' />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchFixtures} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const currentFixtures =
    activeTab === 'upcoming'
      ? fixtures
      : activeTab === 'past'
        ? pastFixtures
        : []
  // Skip first match in upcoming tab since it's shown in the Next Match card
  const listFixtures =
    activeTab === 'upcoming' && currentFixtures.length > 0
      ? currentFixtures.slice(1)
      : currentFixtures

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'upcoming' && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange('upcoming')}
            disabled={isTabChanging}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'upcoming' && styles.activeTabButtonText,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'past' && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange('past')}
            disabled={isTabChanging}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'past' && styles.activeTabButtonText,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'stats' && styles.activeTabButton,
            ]}
            onPress={() => {
              handleTabChange('stats')
              // Only fetch team stats if we have fixture data and haven't fetched stats yet
              if (
                activeTab !== 'stats' &&
                !teamStats &&
                (fixtures.length > 0 || pastFixtures.length > 0)
              ) {
                fetchTeamStatistics()
              }
            }}
            disabled={isTabChanging}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'stats' && styles.activeTabButtonText,
              ]}
            >
              Stats
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'stats' ? (
          statsLoading ? (
            <View style={styles.noDataContainer}>
              <ActivityIndicator size='large' color='#e21d38' />
              <Text style={styles.noDataText}>Loading team statistics...</Text>
            </View>
          ) : teamStats ? (
            <ScrollView
              style={styles.statsContainer}
              contentContainerStyle={styles.statsContent}
            >
              {/* Team Header */}
              <View style={styles.teamHeader}>
                <Image
                  source={{ uri: teamStats.crest }}
                  style={styles.teamCrest}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.statsTeamName}>{teamStats.name}</Text>
                  <Text style={styles.teamDetails}>
                    Founded: {teamStats.founded}
                  </Text>
                  <Text style={styles.teamDetails}>
                    Venue: {teamStats.venue}
                  </Text>
                </View>
              </View>

              {/* Competitions */}
              <View style={styles.statsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name='trophy-outline' size={24} color='#e21d38' />
                  <Text style={styles.sectionTitle}>Current Competitions</Text>
                </View>
                {teamStats.runningCompetitions.map(competition => (
                  <View key={competition.id} style={styles.competitionCard}>
                    <Image
                      source={{ uri: competition.emblem }}
                      style={styles.competitionEmblem}
                    />
                    <View style={styles.competitionInfo}>
                      <Text style={styles.competitionName}>
                        {competition.name}
                      </Text>
                      <Text style={styles.competitionType}>
                        {competition.type}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Season Statistics */}
              {matchStats && (
                <>
                  {/* Overall Record */}
                  <View style={styles.statsSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name='stats-chart-outline'
                        size={24}
                        color='#e21d38'
                      />
                      <Text style={styles.sectionTitle}>Season Record</Text>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                          {matchStats.totalMatches}
                        </Text>
                        <Text style={styles.statLabel}>Matches</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                          {matchStats.wins}
                        </Text>
                        <Text style={styles.statLabel}>Wins</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                          {matchStats.draws}
                        </Text>
                        <Text style={styles.statLabel}>Draws</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#F44336' }]}>
                          {matchStats.losses}
                        </Text>
                        <Text style={styles.statLabel}>Losses</Text>
                      </View>
                    </View>
                  </View>

                  {/* Goals Statistics */}
                  <View style={styles.statsSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name='football-outline'
                        size={24}
                        color='#e21d38'
                      />
                      <Text style={styles.sectionTitle}>Goals & Defense</Text>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                          {matchStats.goalsScored}
                        </Text>
                        <Text style={styles.statLabel}>Goals Scored</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#F44336' }]}>
                          {matchStats.goalsConceded}
                        </Text>
                        <Text style={styles.statLabel}>Goals Conceded</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                          {matchStats.cleanSheets}
                        </Text>
                        <Text style={styles.statLabel}>Clean Sheets</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
                          {matchStats.totalMatches > 0
                            ? (matchStats.goalsScored -
                                matchStats.goalsConceded >
                              0
                                ? '+'
                                : '') +
                              (matchStats.goalsScored -
                                matchStats.goalsConceded)
                            : '0'}
                        </Text>
                        <Text style={styles.statLabel}>Goal Difference</Text>
                      </View>
                    </View>
                  </View>

                  {/* Home vs Away */}
                  <View style={styles.statsSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name='home-outline' size={24} color='#e21d38' />
                      <Text style={styles.sectionTitle}>Home vs Away</Text>
                    </View>
                    <View style={styles.homeAwayContainer}>
                      <View style={styles.homeAwayCard}>
                        <Text style={styles.homeAwayTitle}>🏠 Home</Text>
                        <Text style={styles.homeAwayRecord}>
                          {matchStats.homeRecord.wins}W -{' '}
                          {matchStats.homeRecord.draws}D -{' '}
                          {matchStats.homeRecord.losses}L
                        </Text>
                        <Text style={styles.homeAwayMatches}>
                          {matchStats.homeRecord.matches} matches
                        </Text>
                      </View>
                      <View style={styles.homeAwayCard}>
                        <Text style={styles.homeAwayTitle}>✈️ Away</Text>
                        <Text style={styles.homeAwayRecord}>
                          {matchStats.awayRecord.wins}W -{' '}
                          {matchStats.awayRecord.draws}D -{' '}
                          {matchStats.awayRecord.losses}L
                        </Text>
                        <Text style={styles.homeAwayMatches}>
                          {matchStats.awayRecord.matches} matches
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Top Scorers */}
                  <View style={styles.statsSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <Ionicons
                          name='medal-outline'
                          size={24}
                          color='#e21d38'
                        />
                        <Text style={styles.sectionTitle}>Top Scorers</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => fetchTeamStatistics()}
                        style={styles.refreshButton}
                        disabled={statsLoading}
                      >
                        <Ionicons
                          name='refresh'
                          size={20}
                          color={statsLoading ? '#ccc' : '#e21d38'}
                        />
                      </TouchableOpacity>
                    </View>
                    {topScorers.length > 0 ? (
                      <>
                        {topScorers.map((scorer, index) => (
                          <View key={scorer.id} style={styles.scorerCard}>
                            <View style={styles.scorerRank}>
                              <Text style={styles.scorerRankText}>
                                #{index + 1}
                              </Text>
                            </View>
                            <View style={styles.scorerInfo}>
                              <Text style={styles.scorerName}>
                                {scorer.name}
                              </Text>
                              <Text style={styles.scorerStats}>
                                {scorer.goals} goal
                                {scorer.goals !== 1 ? 's' : ''} in{' '}
                                {scorer.matches} matches
                              </Text>
                            </View>
                            <View style={styles.scorerGoals}>
                              <Text style={styles.scorerGoalsText}>
                                {scorer.goals}
                              </Text>
                              <Ionicons
                                name='football'
                                size={16}
                                color='#e21d38'
                              />
                            </View>
                          </View>
                        ))}
                      </>
                    ) : (
                      <View style={styles.noScorersContainer}>
                        <Ionicons
                          name='football-outline'
                          size={32}
                          color='#ccc'
                        />
                        <Text style={styles.noScorersText}>
                          Loading goal scorer data...
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Top Assists */}
                  {topAssists.length > 0 && (
                    <View style={styles.statsSection}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                          <Ionicons
                            name='hand-left-outline'
                            size={24}
                            color='#e21d38'
                          />
                          <Text style={styles.sectionTitle}>Top Assists</Text>
                        </View>
                      </View>
                      {topAssists.map((assist, index) => (
                        <View key={assist.id} style={styles.scorerCard}>
                          <View style={styles.scorerRank}>
                            <Text style={styles.scorerRankText}>
                              #{index + 1}
                            </Text>
                          </View>
                          <View style={styles.scorerInfo}>
                            <Text style={styles.scorerName}>{assist.name}</Text>
                            <Text style={styles.scorerStats}>
                              {assist.assists} assist
                              {assist.assists !== 1 ? 's' : ''} in{' '}
                              {assist.matches} matches
                            </Text>
                          </View>
                          <View style={styles.scorerGoals}>
                            <Text style={styles.scorerGoalsText}>
                              {assist.assists}
                            </Text>
                            <Ionicons
                              name='hand-left'
                              size={16}
                              color='#e21d38'
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Data source note */}
                  <View style={styles.scorersNote}>
                    <Ionicons
                      name='information-circle-outline'
                      size={16}
                      color='#666'
                    />
                    <Text style={styles.scorersNoteText}>
                      Statistics sourced from ESPN. Data updates automatically
                      with each refresh.
                    </Text>
                  </View>
                </>
              )}

              {/* Note about more stats */}
              <View style={styles.noteContainer}>
                <Ionicons
                  name='information-circle-outline'
                  size={20}
                  color='#666'
                />
                <Text style={styles.noteText}>
                  More detailed statistics like goals, wins/losses, and league
                  position will be available in future updates.
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                Failed to load team statistics
              </Text>
              <TouchableOpacity
                onPress={fetchTeamStatistics}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )
        ) : currentFixtures.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {activeTab === 'upcoming'
                ? 'No upcoming fixtures found'
                : 'No past fixtures available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={listFixtures}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) =>
              renderFixtureItem({
                item,
                isPast: activeTab === 'past',
              })
            }
            ListHeaderComponent={
              activeTab === 'upcoming' ? renderNextMatchCountdown : null
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
        {renderMatchDetailsModal()}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#e21d38',
  },
  tabButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  fixtureItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  competitionTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e21d38',
    backgroundColor: '#fdecee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reminderButton: {
    padding: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  teamName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsText: {
    color: '#666',
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#e21d38',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
    fontSize: 11,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#e21d38',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  countdownContainer: {
    backgroundColor: 'white',
    marginHorizontal: 0,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  countdownReminderButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  countdownMatchInfo: {
    alignItems: 'center',
  },
  countdownTeams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 15,
    width: '100%',
  },
  countdownTeamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  countdownLogo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  teamFormBadges: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  countdownVs: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 15,
    marginTop: 15,
  },
  countdownTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 5,
  },
  countdownDate: {
    fontSize: 14,
    color: '#666',
  },
  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 30,
  },
  modalTeamLogo: {
    width: 30,
    height: 30,
  },
  modalMatchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  modalTeamNames: {
    fontSize: 16,
    marginBottom: 10,
  },
  matchDetailsContainer: {
    marginTop: 10,
  },
  matchDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  matchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  matchDetailValue: {
    fontSize: 14,
    color: '#333',
  },
  // Stats Tab Styles
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    padding: 15,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamCrest: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  teamInfo: {
    flex: 1,
  },
  statsTeamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  teamDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  competitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  competitionEmblem: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  competitionInfo: {
    flex: 1,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  competitionType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
  // Match Statistics Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  homeAwayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  homeAwayCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  homeAwayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  homeAwayRecord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e21d38',
    marginBottom: 4,
  },
  homeAwayMatches: {
    fontSize: 12,
    color: '#666',
  },
  // Top Scorers Styles
  scorerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e21d38',
  },
  scorerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e21d38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scorerRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scorerInfo: {
    flex: 1,
  },
  scorerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  scorerStats: {
    fontSize: 12,
    color: '#666',
  },
  scorerGoals: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorerGoalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginRight: 5,
  },
  noScorersContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noScorersText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  noScorersSubText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  scorersNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  scorersNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
    lineHeight: 16,
  },
})
