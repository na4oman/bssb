import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  query,
  orderBy,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COLLECTION = 'users';

export type UserData = {
  id: string;
  email: string;
  userName: string;
  isAdmin: boolean;
  paid: boolean;
  createdAt: Date;
};

// Get user's push tokens
const getUserPushTokens = async (userId: string): Promise<string[]> => {
  try {
    const tokensRef = collection(db, USERS_COLLECTION, userId, 'tokens');
    const tokensSnapshot = await getDocs(tokensRef);
    
    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });
    
    console.log(`Found ${tokens.length} push token(s) for user ${userId}`);
    return tokens;
  } catch (error: any) {
    console.error('Error getting user push tokens:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return [];
  }
};

// Send push notification
const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { type: 'payment_confirmed' },
  };

  try {
    console.log('📤 Sending push notification...');
    console.log('Token:', expoPushToken);
    console.log('Title:', title);
    console.log('Body:', body);
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('📥 Push notification response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data[0]) {
      const result = data.data[0];
      if (result.status === 'ok') {
        console.log('✅ Push notification sent successfully!');
      } else if (result.status === 'error') {
        console.error('❌ Push notification error:', result.message);
        console.error('Error details:', result.details);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
};

// Check if user is admin
export const checkIsUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Subscribe to all users (admin only)
export const subscribeToUsers = (callback: (users: UserData[]) => void) => {
  const q = query(
    collection(db, USERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const users: UserData[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        userName: data.userName || '',
        isAdmin: data.isAdmin || false,
        paid: data.paid || false,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    callback(users);
  });
};

// Toggle user paid status (admin only)
export const toggleUserPaidStatus = async (
  userId: string, 
  currentUserId: string, 
  paid: boolean,
  userName: string
) => {
  try {
    // Check if current user is admin
    const isAdmin = await checkIsUserAdmin(currentUserId);
    if (!isAdmin) {
      throw new Error('Only admins can update user paid status');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      paid: paid,
    });

    console.log(`✅ Updated paid status for ${userName} to ${paid ? 'paid' : 'unpaid'}`);
    console.log('💡 User will see payment status when they log in');
  } catch (error) {
    console.error('Error updating paid status:', error);
    throw error;
  }
};

// Toggle user admin status (admin only)
export const toggleUserAdminStatus = async (userId: string, currentUserId: string, isAdmin: boolean) => {
  try {
    // Check if current user is admin
    const isCurrentUserAdmin = await checkIsUserAdmin(currentUserId);
    if (!isCurrentUserAdmin) {
      throw new Error('Only admins can update user admin status');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      isAdmin: isAdmin,
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    throw error;
  }
};
