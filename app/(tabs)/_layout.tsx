import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

// Import the logo using the correct path
const LogoImage = require('../../assets/images/logo.jpg');

// Custom Header Component
const CustomHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <Image 
        source={LogoImage} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <Text style={styles.headerTitle}>
        Bulgarian Sunderland Supporters Branch
      </Text>
    </View>
  );
};

function TabsLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // or a loading screen
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        style="light" 
        backgroundColor="#e21d38" 
        translucent={false}
      />
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
          headerShown: true, 
          tabBarStyle: {
            backgroundColor: '#e21d38',
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
          },
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{
            title: 'Events',
            tabBarLabel: 'Events',
            tabBarIcon: ({ color }) => (
              <Ionicons name="ticket-outline" size={24} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="news" 
          options={{
            title: 'News',
            tabBarLabel: 'News',
            tabBarIcon: ({ color }) => (
              <Ionicons name="newspaper-outline" size={24} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="table" 
          options={{
            title: 'Table',
            tabBarLabel: 'Table',
            tabBarIcon: ({ color }) => (
              <Ionicons name="podium-outline" size={24} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="fixtures" 
          options={{
            title: 'Fixtures',
            tabBarLabel: 'Fixtures',
            tabBarIcon: ({ color }) => (
              <Ionicons name="football-outline" size={24} color={color} />
            )
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            )
          }} 
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

export default TabsLayout;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 1, 
  },
});