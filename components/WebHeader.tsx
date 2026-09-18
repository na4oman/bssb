import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router, usePathname } from 'expo-router'
import NotificationBadge from './NotificationBadge'
import UserMenu from './UserMenu'

// Import the logo using the correct path
const LogoImage = require('../assets/images/logo.jpg')

const WEB_NAV_ITEMS = [
  { label: 'Events', path: '/(tabs)' },
  { label: 'Posts', path: '/(tabs)/posts' },
  { label: 'News', path: '/(tabs)/news' },
  { label: 'Table', path: '/(tabs)/table' },
  { label: 'Fixtures', path: '/(tabs)/fixtures' },
]

/**
 * Shared red web header (brand + nav + actions).
 * Used by the tabs layout and root-level web screens (e.g. /users)
 * so every page keeps the same header on desktop.
 */
const WebHeader = () => {
  const pathname = usePathname()
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [brandHovered, setBrandHovered] = useState(false)

  return (
    <View style={styles.webHeader}>
      <TouchableOpacity
        style={[
          styles.webBrand,
          brandHovered && styles.webBrandHovered,
        ]}
        onPress={() => router.push('/')}
        onMouseEnter={() => setBrandHovered(true)}
        onMouseLeave={() => setBrandHovered(false)}
        accessibilityRole='link'
        accessibilityLabel='Go to home'
      >
        <Image source={LogoImage} style={styles.webLogo} resizeMode='contain' />
        <Text style={styles.webBrandTitle}>
          Bulgarian Sunderland{'\n'}Supporters Branch
        </Text>
      </TouchableOpacity>
      <View style={styles.webNav}>
        {WEB_NAV_ITEMS.map(item => {
          const active =
            item.path === '/(tabs)'
              ? pathname === '/'
              : pathname.includes(item.path.replace('/(tabs)', ''))

          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.webNavItem,
                active && styles.webNavItemActive,
                hoveredNav === item.label && styles.webNavItemHovered,
              ]}
              onPress={() => router.push(item.path as never)}
              onMouseEnter={() => setHoveredNav(item.label)}
              onMouseLeave={() => setHoveredNav(null)}
              accessibilityRole='link'
              accessibilityLabel={item.label}
            >
              <Text
                style={[
                  styles.webNavLabel,
                  active && styles.webNavLabelActive,
                  hoveredNav === item.label && styles.webNavLabelHovered,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={styles.webActions}>
        <NotificationBadge />
        <UserMenu />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#e21d38',
    position: 'relative',
    zIndex: 1000,
  },
  webBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 310,
    borderRadius: 8,
    transition: 'background-color 0.15s ease',
  },
  webBrandHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  webLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  webBrandTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  webNav: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  webActions: {
    width: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  webNavItem: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    borderRadius: 6,
    transition: 'background-color 0.15s ease',
  },
  webNavItemActive: {
    borderBottomColor: '#fff',
  },
  webNavItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  webNavLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    transition: 'color 0.15s ease',
  },
  webNavLabelActive: {
    color: '#fff',
  },
  webNavLabelHovered: {
    color: '#fff',
  },
})

export default WebHeader