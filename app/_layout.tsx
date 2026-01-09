import React from 'react';
import { Slot, Tabs, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar
          style="light" 
          backgroundColor="#e21d38" 
          translucent={false}
        />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#e21d38', // Your app's primary color
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShown: false,
            contentStyle: {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false 
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
