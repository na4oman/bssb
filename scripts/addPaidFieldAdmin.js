// Script to add 'paid' field to existing users using Firebase Admin SDK
// Usage: node scripts/addPaidFieldAdmin.js

const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
// You need to download the service account key from Firebase Console
// Project Settings → Service Accounts → Generate New Private Key
// Save it as serviceAccountKey.json in the project root

try {
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error: Could not load serviceAccountKey.json');
  console.error('Please download your service account key from:');
  console.error('Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  console.error('Save it as serviceAccountKey.json in the project root');
  process.exit(1);
}

const db = admin.firestore();

async function addPaidFieldToAllUsers() {
  try {
    console.log('Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if 'paid' field already exists
      if (userData.paid === undefined) {
        await db.collection('users').doc(userDoc.id).update({
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
