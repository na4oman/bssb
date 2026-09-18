import React from 'react'
import { Tabs, Redirect, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import HamburgerMenu from '../../components/HamburgerMenu'
import NotificationBadge from '../../components/NotificationBadge'
import WebHeader from '../../components/WebHeader'
import { isWeb } from '../../utils/platformStyles'

// Import the logo using the correct path
const LogoImage = require('../../assets/images/logo.jpg')

// Native header. The web header is intentionally a separate composition below.
const CustomHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.headerBrand}
        onPress={() => router.push('/')}
        accessibilityRole='link'
        accessibilityLabel='Go to home'
      >
        <Image source={LogoImage} style={styles.logo} resizeMode='contain' />
        <Text style={styles.headerTitle}>
          Bulgarian Sunderland{'\n'}Supporters Branch
        </Text>
      </TouchableOpacity>
      <NotificationBadge />
      <HamburgerMenu />
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  tabsShell: {
    flex: 1,
    width: '100%',
  },
})
