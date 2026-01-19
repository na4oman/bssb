import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'

console.log('IndexScreen: Starting...')

export default function IndexScreen() {
  console.log('IndexScreen: Rendering - redirecting to login immediately')
  
  // Always redirect to login first, let login handle auth state
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