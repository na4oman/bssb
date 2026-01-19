import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Direct configuration - this ensures it works in production builds
const firebaseConfig = {
  apiKey: "AIzaSyCzvTjOga8WxaTaQknnlh8cxpT5Qp7Nb6g",
  authDomain: "safc-8863b.firebaseapp.com",
  projectId: "safc-8863b",
  storageBucket: "safc-8863b.firebasestorage.app",
  messagingSenderId: "661308293819",
  appId: "1:661308293819:web:21092699f39a75f11cdf9e",
  measurementId: "G-B6RPB5DFQR"
}

console.log('Firebase Config loaded successfully')

const app = initializeApp(firebaseConfig)

// Use regular getAuth instead of initializeAuth
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

console.log('Firebase initialized successfully')

export { app, auth, db, storage }