import AsyncStorage from '@react-native-async-storage/async-storage'

const CREDENTIALS_KEY = '@user_credentials'

export interface StoredCredentials {
  email: string
  rememberMe: boolean
}

export const saveCredentials = async (email: string, rememberMe: boolean = true): Promise<void> => {
  try {
    const credentials: StoredCredentials = {
      email,
      rememberMe
    }
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
  } catch (error) {
    console.error('Error saving credentials:', error)
  }
}

export const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
  try {
    const stored = await AsyncStorage.getItem(CREDENTIALS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.error('Error getting stored credentials:', error)
    return null
  }
}

export const clearStoredCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CREDENTIALS_KEY)
  } catch (error) {
    console.error('Error clearing credentials:', error)
  }
}

export const hasStoredCredentials = async (): Promise<boolean> => {
  try {
    const credentials = await getStoredCredentials()
    return credentials !== null && credentials.rememberMe
  } catch (error) {
    console.error('Error checking stored credentials:', error)
    return false
  }
}