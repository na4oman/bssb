import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/theme'

interface EmptyStateProps {
  /** Ionicons name for the large icon above the title. */
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  /** Smaller variant for inline sections (e.g. profile lists). */
  compact?: boolean
}

/**
 * Shared empty state: icon + title + subtitle on the standard background.
 * Replaces per-screen ad-hoc empty blocks (UI-IMPROVEMENTS.md task 8).
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  compact,
}) => (
  <View style={[styles.container, compact && styles.compact]}>
    <Ionicons name={icon} size={compact ? 48 : 64} color={COLORS.disabled} />
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  compact: {
    paddingVertical: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
    textAlign: 'center',
  },
})

export default EmptyState