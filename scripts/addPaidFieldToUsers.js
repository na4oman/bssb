// Script to add 'paid' field to existing users
// Usage: node scripts/addPaidFieldToUsers.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Your Firebase config
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

async function addPaidFieldToAllUsers() {
  try {
    console.log('Fetching all users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    console.log(`Found ${usersSnapshot.size} users`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if 'paid' field already exists
      if (userData.paid === undefined) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          paid: false, // Default to unpaid
        });
        console.log(`✅ Updated user: ${userData.email || userDoc.id}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped user (already has paid field): ${userData.email || userDoc.id}`);
        skipped++;
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${updated} users`);
    console.log(`Skipped: ${skipped} users`);
    console.log(`Total: ${usersSnapshot.size} users`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('Starting migration to add "paid" field to all users...\n');
addPaidFieldToAllUsers();
