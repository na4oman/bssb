import { Platform, StyleSheet } from 'react-native'

/**
 * Shared platform detection + reusable web/mobile style objects.
 *
 * Centralising these here avoids scattering `Platform.OS === 'web'` checks
 * across components (see PLAN.md Phase 3.5).
 */

export const isWeb = Platform.OS === 'web'

export const WEB_MAX_WIDTH = 1280

/** Convenience: a centred, max-width container for FlatList / ScrollView content. */
export const maxWidthContent = isWeb
  ? { maxWidth: WEB_MAX_WIDTH, marginHorizontal: 'auto' as const }
  : undefined

/** Root-level wrapper style so non-FlatList screens (profile, table, etc.)
 *  don't bleed to the viewport edges on web. */
export const maxWidthWrapper = isWeb
  ? {
      maxWidth: WEB_MAX_WIDTH as number,
      width: '100%' as const,
      marginHorizontal: 'auto' as const,
      flex: 1,
    }
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
  borderRadius: 12,
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
