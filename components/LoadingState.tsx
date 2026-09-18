import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { COLORS } from '../constants/theme'

interface LoadingStateProps {
  /** Optional helper text shown under the spinner. */
  text?: string
  /** Smaller variant for inline sections (e.g. profile lists). */
  compact?: boolean
}

/**
 * Shared loading state: centered spinner with consistent styling.
 * Replaces per-screen ad-hoc ActivityIndicator blocks (UI-IMPROVEMENTS.md task 8).
 */
const LoadingState: React.FC<LoadingStateProps> = ({ text, compact }) => (
  <View style={[styles.container, compact && styles.compact]}>
    <ActivityIndicator size='large' color={COLORS.primary} />
    {text ? <Text style={styles.text}>{text}</Text> : null}
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  compact: {
    flex: 0,
    paddingVertical: 40,
  },
  text: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
})

export default LoadingState