import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { isWeb, maxWidthContent } from '../utils/platformStyles'
import { COLORS, FONT } from '../constants/theme'

interface PageTitleProps {
  title: string
}

/**
 * Page heading shown under the web header (web only).
 * Keeps the title aligned with the max-width content container.
 */
const PageTitle: React.FC<PageTitleProps> = ({ title }) => (
  <View style={[styles.container, isWeb && styles.containerWeb]}>
    <Text style={styles.title}>{title}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  containerWeb: {
    ...maxWidthContent,
    width: '100%',
  },
  title: {
    fontSize: FONT.size.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
})

export default PageTitle