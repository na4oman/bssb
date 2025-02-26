import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet 
} from 'react-native';

// Import the logo
import LogoImage from '@/assets/logo.jpg';

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

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar 
        style="dark" 
        backgroundColor="#f5f5f5" 
        translucent={false}
      />
      <Tabs 
        screenOptions={{
          header: () => <CustomHeader />,
          headerStyle: {
            backgroundColor: '#f5f5f5',
            height: 100, // Adjust height to accommodate logo and text
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
          headerShown: true, // Enable header
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
      </Tabs>
    </SafeAreaProvider>
  );
}

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
    flexShrink: 1, // Allow text to wrap if too long
  },
});