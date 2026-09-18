import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

interface SkeletonListProps {
  /** Number of placeholder cards to render. */
  count?: number
}

/**
 * Web-only skeleton placeholder cards with a soft pulse animation.
 * Shown while list screens load (UI-IMPROVEMENTS.md task 8).
 * Mobile keeps the plain spinner (LoadingState).
 */
const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3 }) => {
  const opacity = useRef(new Animated.Value(0.45)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          // This component only renders on web, where the JS driver is used.
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity }]}>
          <View style={styles.imageBlock} />
          <View style={styles.content}>
            <View style={[styles.line, styles.lineWide]} />
            <View style={[styles.line, styles.lineMedium]} />
            <View style={[styles.line, styles.lineShort]} />
          </View>
        </Animated.View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    padding: 12,
    ...SHADOW.card,
  },
  imageBlock: {
    width: 200,
    height: 140,
    borderRadius: RADIUS.md,
    backgroundColor: '#e8e8e8',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  line: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e8e8e8',
    marginBottom: 10,
  },
  lineWide: {
    width: '85%',
    height: 18,
  },
  lineMedium: {
    width: '60%',
  },
  lineShort: {
    width: '40%',
    marginBottom: 0,
  },
})

export default SkeletonList