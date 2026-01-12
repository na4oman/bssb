import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../config/firebase'

// Expo Push API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'

export interface PushNotificationData {
  eventId?: string
  type?: string
  [key: string]: any
}

export interface PushMessage {
  to: string
  title: string
  body: string
  data?: PushNotificationData
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

// Get all user notification tokens from Firestore
async function getAllNotificationTokens(): Promise<string[]> {
  try {
    const tokens: string[] = []
    
    // Get all users
    const usersQuery = query(collection(db, 'users'))
    const usersSnapshot = await getDocs(usersQuery)
    
    // For each user, get their notification tokens
    for (const userDoc of usersSnapshot.docs) {
      const tokensQuery = query(collection(db, 'users', userDoc.id, 'tokens'))
      const tokensSnapshot = await getDocs(tokensQuery)
      
      tokensSnapshot.docs.forEach(tokenDoc => {
        const tokenData = tokenDoc.data()
        if (tokenData.token) {
          tokens.push(tokenData.token)
        }
      })
    }
    
    return tokens
  } catch (error) {
    console.error('Error getting notification tokens:', error)
    return []
  }
}

// Send push notification to specific tokens
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<void> {
  if (tokens.length === 0) {
    console.log('No tokens to send notifications to')
    return
  }

  const messages: PushMessage[] = tokens.map(token => ({
    to: token,
    title,
    body,
    data,
    sound: 'default',
    channelId: 'default',
  }))

  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('Push notifications sent successfully:', result)
    } else {
      console.error('Error sending push notifications:', result)
    }
  } catch (error) {
    console.error('Network error sending push notifications:', error)
  }
}

// Send notification to all users
export async function sendNotificationToAllUsers(
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<void> {
  try {
    const tokens = await getAllNotificationTokens()
    console.log(`Sending notification to ${tokens.length} devices`)
    
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data)
    } else {
      console.log('No notification tokens found')
    }
  } catch (error) {
    console.error('Error sending notification to all users:', error)
  }
}

// Send notification to specific user
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<void> {
  try {
    // Get user's notification tokens
    const tokensQuery = query(collection(db, 'users', userId, 'tokens'))
    const tokensSnapshot = await getDocs(tokensQuery)
    
    const tokens: string[] = []
    tokensSnapshot.docs.forEach(tokenDoc => {
      const tokenData = tokenDoc.data()
      if (tokenData.token) {
        tokens.push(tokenData.token)
      }
    })
    
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data)
    } else {
      console.log(`No notification tokens found for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error sending notification to user:', error)
  }
}