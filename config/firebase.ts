import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyCzvTjOga8WxaTaQknnlh8cxpT5Qp7Nb6g",
  authDomain: "safc-8863b.firebaseapp.com",
  projectId: "safc-8863b",
  storageBucket: "safc-8863b.firebasestorage.app",
  messagingSenderId: "661308293819",
  appId: "1:661308293819:web:21092699f39a75f11cdf9e",
  measurementId: "G-B6RPB5DFQR"
}

const app = initializeApp(firebaseConfig)

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})

const db = getFirestore(app)

export { app, auth, db }