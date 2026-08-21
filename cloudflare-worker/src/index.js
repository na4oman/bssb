const FOOTBALL_DATA_API = 'https://api.football-data.org/v4'
const ALLOWED_ORIGINS = new Set([
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:19006',
])

const ALLOWED_PATH = /^(competitions|teams|matches)(\/|$)/

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
    },
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) })
    }

    if (request.method !== 'GET') {
      return jsonResponse(
        { error: 'Only GET requests are supported' },
        405,
        request,
      )
    }

    const url = new URL(request.url)
    const requestedPath = url.pathname.replace(/^\/+/, '')
    if (!ALLOWED_PATH.test(requestedPath) || requestedPath.includes('..')) {
      return jsonResponse({ error: 'Invalid Football Data path' }, 400, request)
    }

    if (!env.FOOTBALL_DATA_API_KEY) {
      return jsonResponse(
        { error: 'Proxy key is not configured' },
        500,
        request,
      )
    }

    const target = new URL(`${FOOTBALL_DATA_API}/${requestedPath}`)
    url.searchParams.forEach((value, key) =>
      target.searchParams.set(key, value),
    )

    try {
      const upstream = await fetch(target, {
        headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY },
      })
      const body = await upstream.text()
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...corsHeaders(request),
          'Content-Type':
            upstream.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      })
    } catch (error) {
      console.error('Football Data proxy failed', error)
      return jsonResponse(
        { error: 'Football Data service unavailable' },
        502,
        request,
      )
    }
  },
}
