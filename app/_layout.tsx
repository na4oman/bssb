import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

console.log('RootLayout: Starting...')

export default function RootLayout() {
  console.log('RootLayout: Rendering...')
  
  try {
    // Try to load AuthProvider, but fallback if it fails
    const { AuthProvider } = require('../contexts/AuthContext')
    console.log('RootLayout: AuthProvider loaded successfully')
    
    return (
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#e21d38" translucent={false} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('RootLayout: Error loading AuthProvider, using fallback:', error)
    
    // Fallback UI
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#e21d38" translucent={false} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>BSSB App</Text>
          <Text style={styles.fallbackSubtext}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e21d38',
  },
  fallbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  fallbackSubtext: {
    fontSize: 16,
    color: 'white',
  },
});
