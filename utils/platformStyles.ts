import { Platform, StyleSheet } from 'react-native'
import { RADIUS } from '../constants/theme'

/**
 * Shared platform detection + reusable web/mobile style objects.
 *
 * Centralising these here avoids scattering `Platform.OS === 'web'` checks
 * across components (see PLAN.md Phase 3.5).
 */

export const isWeb = Platform.OS === 'web'

export const WEB_MAX_WIDTH = 1280

/** Width of the card column on web (EventCard / PostCard and list header actions). */
export const WEB_CARD_MAX_WIDTH = 920

/** Width of the auth form column on web (login / signup). */
export const WEB_AUTH_MAX_WIDTH = 440

/** Convenience: a centred, max-width container for FlatList / ScrollView content. */
export const maxWidthContent = isWeb
  ? { maxWidth: WEB_MAX_WIDTH, marginHorizontal: 'auto' as const }
  : undefined

/**
 * Centred, card-width column for web.
 *
 * Cards cap themselves at WEB_CARD_MAX_WIDTH and centre inside the wider
 * maxWidthContent container, so header actions must use the same column or they
 * stretch beyond the cards and look detached from the page content.
 */
export const maxWidthCard = isWeb
  ? { maxWidth: WEB_CARD_MAX_WIDTH, marginHorizontal: 'auto' as const }
  : undefined

/**
 * Centred, auth-form-width column for web (login / signup).
 * Keeps the form from stretching edge-to-edge on desktop.
 */
export const maxWidthAuth = isWeb
  ? { maxWidth: WEB_AUTH_MAX_WIDTH, marginHorizontal: 'auto' as const }
  : undefined

/**
 * EventCard / PostCard layout switch.
 *
 * Web  → horizontal: image-left (200×140), text-right
 * Mobile → vertical:  image-top (100%, 180), text-below
 */
export const cardContainer = StyleSheet.create({
  web: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobile: {
    flexDirection: 'column',
  },
})

export const cardImageWeb = {
  width: 200,
  height: 140,
  borderRadius: RADIUS.md,
  marginRight: 16,
  resizeMode: 'cover' as const,
}

export const cardImageMobile = {
  width: '100%' as const,
  height: 180,
  resizeMode: 'cover' as const,
}

export const cardContentWeb = {
  flex: 1,
}

export const cardContentMobile = {
  flex: 0,
}
