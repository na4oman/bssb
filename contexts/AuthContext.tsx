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
import { auth } from '../config/firebase'
import { setupNotifications, setupNotificationListeners } from '../utils/simpleNotificationService'

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed:', user ? `User: ${user.email}` : 'No user')
      setUser(user)
      
      if (user) {
        // Setup notifications when user logs in
        try {
          const hasPermission = await setupNotifications()
          setNotificationsEnabled(hasPermission)
          console.log('Notifications setup:', hasPermission ? 'Success' : 'Failed')
        } catch (error) {
          console.error('Error setting up notifications:', error)
        }
      } else {
        // Clear notification state when user logs out
        setNotificationsEnabled(false)
      }
      
      setLoading(false)
    })

    // Setup notification listeners
    const removeListeners = setupNotificationListeners()

    return () => {
      unsubscribe()
      removeListeners()
    }
  }, [])

  const signup = async (email: string, password: string) => {
    try {
      setError(null)
      await createUserWithEmailAndPassword(auth, email, password)
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