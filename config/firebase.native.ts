import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { initializeAuth } from 'firebase/auth'
// Firebase's public facade omits this RN-only export from its TypeScript types,
// but Metro resolves the package's React Native entry at runtime.
// @ts-expect-error Firebase's RN conditional export is missing from public typings.
import { getReactNativePersistence } from '@firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCzvTjOga8WxaTaQknnlh8cxpT5Qp7Nb6g',
  authDomain: 'safc-8863b.firebaseapp.com',
  projectId: 'safc-8863b',
  storageBucket: 'safc-8863b.firebasestorage.app',
  messagingSenderId: '661308293819',
  appId: '1:661308293819:web:21092699f39a75f11cdf9e',
  measurementId: 'G-B6RPB5DFQR',
}

const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
