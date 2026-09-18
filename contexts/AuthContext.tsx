import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

console.log('AuthContext: Starting to import Firebase auth...')

try {
  const { auth } = require('../config/firebase')
  console.log('AuthContext: Firebase auth imported successfully')
} catch (error) {
  console.error('AuthContext: Error importing Firebase:', error)
}

import { auth, db } from '../config/firebase'
import {
  setupNotifications,
  setupNotificationListeners,
} from '../utils/simpleNotificationService'
import { syncMatchRemindersToDevice } from '../utils/matchReminderService'
import {
  getSecureCredentials,
  clearSecureCredentials,
} from '../utils/secureCredentialStorage'

console.log('AuthContext: All imports completed')

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      console.log(
        'AuthContext: Auth state changed:',
        user ? `User: ${user.email}` : 'No user',
      )
      setUser(user)

      if (user) {
        // Setup notifications when user logs in
        try {
          if (Platform.OS === 'web') {
            setNotificationsEnabled(false)
            setLoading(false)
            return
          }

          const hasPermission = await setupNotifications(user.uid)
          setNotificationsEnabled(hasPermission)
          console.log(
            'Notifications setup:',
            hasPermission ? 'Success' : 'Failed',
          )

          // Sync match reminders set on other devices (e.g. web) onto this
          // device so the notification fires even if Fixtures is never opened
          try {
            const saved = await AsyncStorage.getItem('matchReminders')
            const local = saved ? JSON.parse(saved) : {}
            await syncMatchRemindersToDevice(user.uid, local, () => {})
          } catch (error) {
            console.error('Error syncing match reminders:', error)
          }
        } catch (error) {
          console.error('Error setting up notifications:', error)
        }
      } else {
        // Clear notification state when user logs out
        setNotificationsEnabled(false)

        // Silent auto-login fallback (native only): Firebase's JS SDK
        // sometimes fails to restore/refresh the session at cold start
        // (no network, or a revoked refresh token), which signs the user
        // out. If "Remember me" credentials are stored in the OS keychain,
        // re-authenticate silently so the login screen never appears.
        // Credentials are cleared on explicit logout and when they become
        // invalid, so this can't loop.
        if (Platform.OS !== 'web') {
          try {
            const stored = await getSecureCredentials()
            if (stored) {
              console.log('AuthContext: Attempting silent auto-login...')
              await signInWithEmailAndPassword(
                auth,
                stored.email,
                stored.password,
              )
              // onAuthStateChanged fires again with the user; keep loading
              // true until then so the login screen never flashes.
              return
            }
          } catch (error: any) {
            const code = error?.code || ''
            if (
              code === 'auth/invalid-credential' ||
              code === 'auth/wrong-password' ||
              code === 'auth/user-not-found' ||
              code === 'auth/invalid-login-credentials'
            ) {
              console.warn(
                'AuthContext: Stored credentials invalid, clearing:',
                code,
              )
              await clearSecureCredentials()
            } else {
              console.warn(
                'AuthContext: Auto-login failed (transient):',
                code || error,
              )
            }
          }
        }
      }

      setLoading(false)
    })

    // Setup notification listeners
    const removeListeners =
      Platform.OS === 'web' ? () => undefined : setupNotificationListeners()

    return () => {
      unsubscribe()
      removeListeners()
    }
  }, [])

  const signup = async (email: string, password: string) => {
    try {
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )

      // Create user document in Firestore
      const userName = email.split('@')[0] // Use email prefix as default username
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        userName: userName,
        isAdmin: false, // Default to non-admin
        paid: false, // Default to unpaid
        createdAt: new Date(),
      })

      console.log('User document created in Firestore')
    } catch (error: any) {
      setError(error.message || 'Signup failed')
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      setError(error.message || 'Login failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout...')
      setError(null)

      await firebaseSignOut(auth)
      // Explicit logout must disable the silent auto-login fallback,
      // otherwise the stored keychain credentials would log the user
      // straight back in.
      await clearSecureCredentials()
      console.log('AuthContext: Firebase signOut completed')
    } catch (error: any) {
      console.error('AuthContext: Logout error:', error)
      setError(error.message || 'Logout failed')
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      await clearSecureCredentials()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
