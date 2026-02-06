// Script to set admin status for a user
// Usage: node scripts/setAdmin.js <userId>

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminStatus(userId, isAdmin = true) {
  try {
    await db.collection('users').doc(userId).set(
      { isAdmin: isAdmin },
      { merge: true }
    );
    
    console.log(`✅ Successfully set isAdmin=${isAdmin} for user: ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin status:', error);
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  console.log('Usage: node scripts/setAdmin.js <userId>');
  process.exit(1);
}

setAdminStatus(userId);
