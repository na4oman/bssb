import { Tabs, Redirect, router, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import HamburgerMenu from '../../components/HamburgerMenu'
import NotificationBadge from '../../components/NotificationBadge'
import { isWeb } from '../../utils/platformStyles'

// Import the logo using the correct path
const LogoImage = require('../../assets/images/logo.jpg')

// Native header. The web header is intentionally a separate composition below.
const CustomHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <Image source={LogoImage} style={styles.logo} resizeMode='contain' />
      <Text style={styles.headerTitle}>
        Bulgarian Sunderland{'\n'}Supporters Branch
      </Text>
      <NotificationBadge />
      <HamburgerMenu />
    </View>
  )
}

const WEB_NAV_ITEMS = [
  { label: 'Events', path: '/(tabs)' },
  { label: 'Posts', path: '/(tabs)/posts' },
  { label: 'News', path: '/(tabs)/news' },
  { label: 'Table', path: '/(tabs)/table' },
  { label: 'Fixtures', path: '/(tabs)/fixtures' },
]

const WebHeader = () => {
  const pathname = usePathname()

  return (
    <View style={styles.webHeader}>
      <View style={styles.webBrand}>
        <Image source={LogoImage} style={styles.webLogo} resizeMode='contain' />
        <Text style={styles.webBrandTitle}>
          Bulgarian Sunderland{'\n'}Supporters Branch
        </Text>
      </View>
      <View style={styles.webNav}>
        {WEB_NAV_ITEMS.map(item => {
          const active =
            item.path === '/(tabs)'
              ? pathname === '/'
              : pathname.includes(item.path.replace('/(tabs)', ''))

          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.webNavItem, active && styles.webNavItemActive]}
              onPress={() => router.push(item.path as never)}
              accessibilityRole='link'
              accessibilityLabel={item.label}
            >
              <Text
                style={[styles.webNavLabel, active && styles.webNavLabelActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={styles.webActions}>
        <NotificationBadge />
        <HamburgerMenu />
      </View>
    </View>
  )
}

function TabsLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // or a loading screen
  }

  if (!user) {
    return <Redirect href='/(auth)/login' />
  }

  return (
    <SafeAreaProvider>
      <StatusBar style='light' backgroundColor='#e21d38' translucent={false} />
      <View style={styles.tabsShell}>
        {isWeb && <WebHeader />}
        <Tabs
          screenOptions={{
            header: () => <CustomHeader />,
            headerStyle: {
              backgroundColor: '#e21d38',
              height: 100,
            },
            headerTitleStyle: {
              fontSize: 16,
              fontWeight: 'bold',
            },
            headerShown: !isWeb,
            tabBarStyle: isWeb
              ? {
                  display: 'none',
                }
              : {
                  backgroundColor: '#e21d38',
                  borderTopWidth: 0,
                  elevation: 0,
                  height: 60,
                },
            tabBarLabelPosition: 'below-icon',
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
          }}
        >
          <Tabs.Screen
            name='index'
            options={{
              title: 'Events',
              tabBarLabel: 'Events',
              tabBarIcon: ({ color }) => (
                <Ionicons name='ticket-outline' size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='posts'
            options={{
              title: 'Posts',
              tabBarLabel: 'Posts',
              tabBarIcon: ({ color }) => (
                <Ionicons name='newspaper-outline' size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='news'
            options={{
              title: 'News',
              tabBarLabel: 'News',
              tabBarIcon: ({ color }) => (
                <Ionicons name='globe-outline' size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='table'
            options={{
              title: 'Table',
              tabBarLabel: 'Table',
              tabBarIcon: ({ color }) => (
                <Ionicons name='podium-outline' size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='fixtures'
            options={{
              title: 'Fixtures',
              tabBarLabel: 'Fixtures',
              tabBarIcon: ({ color }) => (
                <Ionicons name='football-outline' size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='profile'
            options={{
              href: null, // Hide from tabs
            }}
          />
        </Tabs>
      </View>
    </SafeAreaProvider>
  )
}

export default TabsLayout

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#e21d38',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#e21d38',
  },
  tabsShell: {
    flex: 1,
    width: '100%',
  },
  webBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 310,
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
    width: 116,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  webNavItem: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  webNavItemActive: {
    borderBottomColor: '#fff',
  },
  webNavLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  webNavLabelActive: {
    color: '#fff',
  },
})
