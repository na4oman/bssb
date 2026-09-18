import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// "Remember me" credentials stored in the OS hardware-backed vault
// (Keychain on iOS, Keystore on Android). Used for the silent auto-login
// fallback when Firebase's JS SDK fails to restore the session at cold
// start. Never stored on web (browser sessions persist via localStorage).
const SECURE_CREDENTIALS_KEY = 'bssb_secure_credentials'

export interface SecureCredentials {
  email: string
  password: string
}

export async function saveSecureCredentials(
  email: string,
  password: string,
): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await SecureStore.setItemAsync(
      SECURE_CREDENTIALS_KEY,
      JSON.stringify({ email, password }),
    )
  } catch (error) {
    console.error('Error saving secure credentials:', error)
  }
}

export async function getSecureCredentials(): Promise<SecureCredentials | null> {
  if (Platform.OS === 'web') return null
  try {
    const stored = await SecureStore.getItemAsync(SECURE_CREDENTIALS_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (
      parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.password === 'string'
    ) {
      return { email: parsed.email, password: parsed.password }
    }
    return null
  } catch (error) {
    console.error('Error getting secure credentials:', error)
    return null
  }
}

export async function clearSecureCredentials(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await SecureStore.deleteItemAsync(SECURE_CREDENTIALS_KEY)
  } catch (error) {
    console.error('Error clearing secure credentials:', error)
  }
}