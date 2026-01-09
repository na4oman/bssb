import React from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

export default function IndexScreen() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}