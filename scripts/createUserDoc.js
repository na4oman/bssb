// Script to create a user document in Firestore for existing Firebase Auth users
// This is useful if you already have an account but no Firestore document
// Usage: node scripts/createUserDoc.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Your Firebase config (from firebase.config.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBqxqJqxqJqxqJqxqJqxqJqxqJqxqJqxqJ", // Replace with your actual config
  authDomain: "safc-8863b.firebaseapp.com",
  projectId: "safc-8863b",
  storageBucket: "safc-8863b.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createUserDocument(userId, email, userName, isAdmin = false) {
  try {
    await setDoc(doc(db, 'users', userId), {
      email: email,
      userName: userName,
      isAdmin: isAdmin,
      createdAt: new Date(),
    });
    
    console.log(`✅ Successfully created user document for: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${userName}`);
    console.log(`   Admin: ${isAdmin}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user document:', error);
    process.exit(1);
  }
}

// Example usage - replace with your actual values
const userId = 'YOUR_USER_ID_HERE';      // Get from Firebase Auth console
const email = 'your-email@example.com';   // Your email
const userName = 'YourName';              // Your display name
const isAdmin = true;                     // Set to true to make yourself admin

console.log('Creating user document...');
createUserDocument(userId, email, userName, isAdmin);
