import admin from 'firebase-admin';
import * as fs from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Determine the path for the service account file
const serviceAccountFileName = 'safc-8863b-12fc5cd721df.json';
const serviceAccountPath = `${FileSystem.documentDirectory}${serviceAccountFileName}`;

// Function to load service account credentials
async function loadServiceAccount(): Promise<admin.ServiceAccount> {
  try {
    // Check if the file exists in the document directory
    const fileInfo = await FileSystem.getInfoAsync(serviceAccountPath);
    
    if (!fileInfo.exists) {
      // If not, copy the service account file from the assets
      await FileSystem.copyAsync({
        from: `assets/${serviceAccountFileName}`,
        to: serviceAccountPath
      });
    }

    // Read the service account file
    const serviceAccountContent = await FileSystem.readAsStringAsync(serviceAccountPath);
    return JSON.parse(serviceAccountContent);
  } catch (error) {
    console.error('Error loading service account:', error);
    throw error;
  }
}

// Initialize Firebase Admin SDK
async function initializeFirebaseAdmin() {
  try {
    const serviceAccount = await loadServiceAccount();

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

// Call initialization
initializeFirebaseAdmin();

/**
 * Send a push notification to a specific device token
 * @param token Device token to send notification to
 * @param payload Notification payload
 */
export async function sendPushNotification(
  token: string, 
  payload: {
    title?: string, 
    body?: string, 
    notification?: {
      title?: string,
      body?: string
    },
    data?: Record<string, string>
  }
) {
  try {
    // Normalize the payload
    const title = payload.title || payload.notification?.title || 'Notification';
    const body = payload.body || payload.notification?.body || 'New message';
    const data = payload.data || {};

    const message: admin.messaging.Message = {
      notification: {
        title,
        body
      },
      token,
      data
    };

    // Send a message to the device corresponding to the provided registration token.
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Send a broadcast notification to multiple tokens
 * @param tokens Array of device tokens
 * @param payload Notification payload
 */
export async function sendMulticastNotification(
  tokens: string[], 
  payload: {
    title?: string, 
    body?: string, 
    notification?: {
      title?: string,
      body?: string
    },
    data?: Record<string, string>
  }
) {
  try {
    // Normalize the payload
    const title = payload.title || payload.notification?.title || 'Notification';
    const body = payload.body || payload.notification?.body || 'New message';
    const data = payload.data || {};

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body
      },
      tokens,
      data
    };

    // Send a multicast message to multiple tokens
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`${response.successCount} messages were sent successfully`);
    
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('Failed tokens:', failedTokens);
    }

    return response;
  } catch (error) {
    console.error('Error sending multicast message:', error);
    throw error;
  }
}

export default admin;
