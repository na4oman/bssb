import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

console.log('IndexScreen: Starting...')

export default function IndexScreen() {
  console.log('IndexScreen: Rendering...')
  const { user, loading } = useAuth()

  // While the auth state is being restored (e.g. on web refresh), show a
  // splash instead of flashing the login screen.
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
      </View>
    )
  }

  // Persisted session present → go straight to the app.
  if (user) {
    return <Redirect href="/(tabs)" />
  }

  // No session → require login.
  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e21d38',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: 'white',
  },
})