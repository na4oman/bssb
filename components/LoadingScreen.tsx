import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native'

const LogoImage = require('../assets/images/logo.jpg')

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Bulgarian Sunderland</Text>
      <Text style={styles.subtitle}>Supporters Branch</Text>
      <ActivityIndicator size="large" color="#e21d38" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
})