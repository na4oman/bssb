/**
 * Shared design tokens for the BSSB app.
 *
 * Centralising colours, shadows, radii and font sizes avoids hard-coded
 * values scattered across screens (see UI-IMPROVEMENTS.md task 6).
 */

export const COLORS = {
  primary: '#e21d38', // Sunderland red
  primaryDark: '#c0142e', // hover / darker variant of primary
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  border: '#f0f0f0',
  disabled: '#ccc',
} as const

export const SHADOW = {
  /** Standard card recipe (EventCard, list cards, etc.) */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  /** Heavier recipe for FABs, overlays, and modals */
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
} as const

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const

export const FONT = {
  size: {
    xs: 12,
    sm: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
} as const
