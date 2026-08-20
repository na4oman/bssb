#!/usr/bin/env node
'use strict'
/**
 * CLI for sending a push notification via the FCM HTTP v1 API using a service
 * account. Implementation lives in scripts/fcmV1.js.
 *
 * Usage:
 *   node scripts/sendFcmV1.js <token> "<title>" "<body>" [dataJson] [options]
 *
 * Options:
 *   --key PATH        Path to the service-account JSON (default: auto-resolved
 *                     repo-root *-firebase-adminsdk-*.json, git-ignored).
 *   --project ID      Override the Firebase project id read from the SA.
 *   --dry-run         Build the signed JWT + request payload, print, send nothing.
 *   --token-only      Mint & print a masked FCM access token, then exit.
 *   --validate-only   Send validate_only=true (FCM checks auth + schema, no delivery).
 *   --help, -h        Show this help.
 *
 * Examples:
  *   node scripts/sendFcmV1.js "ek:..." "New event" "Someone created an event" '{"eventId":"abc"}'
 *   node scripts/sendFcmV1.js --token-only
 *   node scripts/sendFcmV1.js --validate-only
 */

const {
  loadServiceAccount,
  createJwt,
  getFcmV1AccessToken,
  sendFcmV1Message,
  maskSaKeyPath,
  maskToken,
} = require('./fcmV1.js')

const argv = process.argv.slice(2)
const opts = { keyPath: undefined, project: undefined, dryRun: false, tokenOnly: false, validateOnly: false }
const positionals = []

for (const arg of argv) {
  if (arg === '--help' || arg === '-h') {
    process.stdout.write(helpText())
    process.exit(0)
  } else if (arg === '--dry-run') {
    opts.dryRun = true
  } else if (arg === '--token-only') {
    opts.tokenOnly = true
  } else if (arg === '--validate-only') {
    opts.validateOnly = true
  } else if (arg === '--key') {
    opts.expectKey = true
  } else if (arg === '--project') {
    opts.expectProject = true
  } else if (opts.expectKey) {
    opts.keyPath = arg
    opts.expectKey = false
  } else if (opts.expectProject) {
    opts.project = arg
    opts.expectProject = false
  } else {
    positionals.push(arg)
  }
}

function helpText() {
  return `FCM HTTP v1 CLI (service-account auth)

Usage: node scripts/sendFcmV1.js <token> "<title>" "<body>" [dataJson] [options]

Options:
  --key PATH        Service-account JSON path (default: auto-resolved)
  --project ID      Override Firebase project id
  --dry-run         Build JWT + request payload, print, send nothing (no network)
  --validate-only   Send validate_only=true (checks auth + schema, no delivery)
  --token-only      Only fetch a masked FCM access token, then exit
  --help, -h        Show this help
`
}

function die(msg, code = 1) {
  console.error('')
  console.error('X ' + msg)
  process.exit(code)
}

async function main() {
  if (!opts.tokenOnly && !opts.dryRun && !opts.validateOnly && positionals.length === 0) {
    process.stdout.write(helpText())
    process.exit(0)
  }

  try {
    const { sa, keyPath } = loadServiceAccount(opts.keyPath)
    const project = opts.project || sa.project_id

    console.log('FCM HTTP v1 sender')
    console.log('  service account :', sa.client_email)
    console.log('  project id      :', project)
    console.log('  key file        :', maskSaKeyPath(keyPath))

    if (opts.dryRun) {
      // Build (but do not send) the signed JWT + request to validate the
      // pipeline without network access or side effects.
      const now = Math.floor(Date.now() / 1000)
      const jwt = createJwt(sa, now)
      const [h, p] = jwt.split('.')
      const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'))
      const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
      console.log('')
      console.log('(dry-run) signed JWT:')
      console.log('  header :', JSON.stringify(header))
      console.log('  payload:', JSON.stringify(payload))
      console.log('  kid    :', (header.kid && header.kid) || '(none - Google auto-derives)')
      console.log('')
      console.log('(dry-run) token endpoint: https://oauth2.googleapis.com/token')
      console.log('(dry-run) scope          : ' + 'https://www.googleapis.com/auth/firebase.messaging')
      console.log('(dry-run) send endpoint   : https://fcm.googleapis.com/v1/projects/' + project + '/messages:send')
      console.log('(dry-run) no network calls were made.')
      return
    }

    if (opts.tokenOnly) {
      const accessToken = await getFcmV1AccessToken(opts.keyPath)
      console.log('')
      console.log('OK Got FCM access token (masked):')
      console.log(' ', maskToken(accessToken))
      return
    }

    if (opts.validateOnly) {
      // validate_only hits the send endpoint with auth + a schema check but
      // performs no delivery, so no real device token is required.
      const message = {
        topic: 'validate-test',
        notification: { title: 'FCM HTTP v1 self-test', body: 'validate_only check' },
        data: { test: 'true' },
      }
      console.log('')
      console.log('(validate-only) message:', JSON.stringify(message))
      const result = await sendFcmV1Message(message, {
        keyPath: opts.keyPath,
        project,
        validateOnly: true,
      })
      console.log('')
      console.log('OK FCM v1 send endpoint accepted the request (validate_only=true)')
      console.log('   status:', result.status)
      if (result.body) console.log('   response:', JSON.stringify(result.body).slice(0, 400))
      return
    }

    const [token, title, body, dataJson] = positionals
    if (!token) die('missing <token> positional argument. Run with --help.')
    if (!title) die('missing <title>.')

    const data = dataJson ? JSON.parse(dataJson) : undefined

    const message = {
      token,
      notification: {
        title,
        ...(body ? { body } : {}),
      },
      ...(data ? { data } : {}),
    }

    console.log('')
    console.log('Sending to token:', maskToken(token))
    const result = await sendFcmV1Message(message, { keyPath: opts.keyPath, project })
    console.log('')
    console.log('OK FCM v1 send succeeded:', result.name)
    console.log('   status:', result.status)
    if (result.body) console.log('   response:', JSON.stringify(result.body).slice(0, 400))
  } catch (err) {
    die(err && err.message ? err.message : String(err))
  }
}

main()

