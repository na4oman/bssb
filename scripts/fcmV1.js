'use strict'
/**
 * FCM HTTP v1 sender, authenticated as a Firebase service account.
 *
 * This implements the Firebase Cloud Messaging HTTP v1 API
 * (https://firebase.google.com/docs/cloud-messaging/manage-delivery-v1) by
 * minting its own OAuth 2.0 access token from the service-account JSON via a
 * self-signed RS256 JWT (jwt-bearer grant).
 *
 * It uses ONLY Node.js built-ins (crypto, fs, path) + the global `fetch` that
 * ships with Node >= 18, so it adds no new dependencies and is safe to require
 * from a Node backend (firebase-functions, Express, the existing
 * `app/_api/sendPush.ts` route, or a script).
 *
 * It is NOT imported by the Expo client app — a service-account private key must
 * never be bundled into a shipped mobile/web app.
 *
 * Options:
 *   SA_KEY_PATH   absolute path to the service-account JSON (default: the
 *                `*-firebase-adminsdk-*.json` file at the repo root, which is
 *                git-ignored).
 *   FCM_PROJECT   overrides the project_id read from the service account.
 */

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

// --- config ---------------------------------------------------------------
const FCM_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const JWT_TTL_SECONDS = 5 * 60

function fcmSendEndpoint(projectId) {
  return `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
}

// --- service account loading ----------------------------------------------
let _accountCache = null

/** Resolve the service-account JSON. Accepts an explicit path or falls back to
 *  the git-ignored `*-firebase-adminsdk-*.json` at the repo root. */
function loadServiceAccount(keyPath) {
  if (_accountCache && !keyPath) return _accountCache

  let resolved = keyPath
  if (!resolved) {
    const root = path.resolve(__dirname, '..')
    const candidates = fs
      .readdirSync(root)
      .filter((f) => /firebase-adminsdk.*\.json$/i.test(f))
      .sort((a, b) => b.length - a.length) // most descriptive suffix first
    if (candidates.length === 0) {
      throw new Error(
        'FCM: service-account JSON not found at repo root. Set SA_KEY_PATH or pass { keyPath }.',
      )
    }
        resolved = path.join(root, candidates[0])
  }

  const raw = fs.readFileSync(resolved, 'utf8')
  const sa = JSON.parse(raw)
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
    throw new Error('FCM: service-account JSON is missing client_email / private_key / project_id')
  }

  _accountCache = { sa, keyPath: resolved }
  return _accountCache
}

function base64url(json) {
  return Buffer.from(json).toString('base64url')
}

// --- OAuth2 token via self-signed JWT -------------------------------------
/** Build the RS256 signed JWT used as the `assertion` in the token request. */
function createJwt(sa, nowSec) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: FCM_SCOPE,
      aud: FCM_TOKEN_ENDPOINT,
      iat: nowSec,
      exp: nowSec + JWT_TTL_SECONDS,
    }),
  )

  const signer = crypto.createSign('RSA-SHA256').update(`${header}.${payload}`)
  const signature = signer.sign(sa.private_key, 'base64url')
  return `${header}.${payload}.${signature}`
}

/** Exchange the service-account JWT for a short-lived FCM access token. */
async function getFcmV1AccessToken(keyPath) {
  const { sa } = loadServiceAccount(keyPath)
  const now = Math.floor(Date.now() / 1000)
  const jwt = createJwt(sa, now)

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  })

  const res = await fetch(FCM_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) {
    const preview = JSON.stringify(data).slice(0, 300)
    throw new Error(`FCM: access-token request failed: ${res.status} ${preview}`)
  }
  return data.access_token
}

// --- sends ----------------------------------------------------------------
/**
 * Send a single FCM HTTP v1 message.
 *
 * @param {object} message  A single FCM v1 `message` object: one of
 *   `{ token, topic, condition }` plus optional `notification`, `data`,
 *   `android`, `apns`, `webpush`, `fcmOptions`.
 * @param {object} [options]  `{ keyPath?, project? }`
 * @returns {Promise<{ ok: boolean, status: number, body: object|null, name?: string }>}
 */
async function sendFcmV1Message(message, options = {}) {
  if (!message || (!message.token && !message.topic && !message.condition)) {
    throw new Error('FCM: message must include `token`, `topic`, or `condition`')
  }

  const { sa } = loadServiceAccount(options.keyPath)
  const project = options.project || sa.project_id
  const accessToken = await getFcmV1AccessToken(options.keyPath)

  const url = new URL(fcmSendEndpoint(project))
  // `validate_only` accepts the request at the send endpoint and validates the
  // message/auth but performs no actual delivery (useful for self-tests).
  if (options.validateOnly) url.searchParams.set('validate_only', 'true')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  const text = await res.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON response body */
  }

  if (!res.ok) {
    const preview = text.slice(0, 300)
    throw new Error(`FCM: send failed: ${res.status} ${preview}`)
  }

  return { ok: true, status: res.status, body: parsed, name: parsed?.name }
}

/**
 * Send the same notification to many registration tokens (sequential, so a
 * failure on one token doesn't abort the rest).
 * FCM HTTP v1 targets one endpoint per request, so "multicast" is a loop of
 * single-token messages.
 */
async function sendFcmV1Multicast(tokens, payload, options = {}) {
  const { notification, data, ...rest } = payload
  const results = []
  for (const token of tokens) {
    const message = { token, notification, data, ...rest }
    try {
      const res = await sendFcmV1Message(message, options)
      results.push({ token, ok: true, ...res })
    } catch (err) {
      results.push({ token, ok: false, error: err.message })
    }
  }
  return results
}

function maskToken(token) {
  if (!token) return '(none)'
  return `${token.slice(0, 8)}\u{2026}${token.slice(-4)} (len ${token.length})`
}

function maskSaKeyPath(p) {
  return p ? path.basename(p) : '(auto-resolved from repo root)'
}

module.exports = {
  // config
  FCM_TOKEN_ENDPOINT,
  FCM_SCOPE,
  fcmSendEndpoint,
  // account
  loadServiceAccount,
  // auth
  createJwt,
  getFcmV1AccessToken,
  // sends
  sendFcmV1Message,
  sendFcmV1Multicast,
  // helpers
  maskToken,
  maskSaKeyPath,
}
