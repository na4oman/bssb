import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export interface NotificationToken {
  token: string
  userId: string
  createdAt: Date
  platform: string
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  let token: string | null = null
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BSSB Events',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e21d38',
      description: 'Notifications for new events and updates',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return null
    }
    
    try {
      // Use Expo's push token system (not Firebase FCM directly)
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
      token = expoPushToken.data
      console.log('Expo Push Token:', token)
      
      // Store token using a separate service to avoid import issues
      if (token) {
        await storeNotificationToken(token, userId)
      }
      
    } catch (error) {
      console.error('Error getting push token:', error)
      // Don't fail completely - local notifications still work
      console.log('Continuing without push token - local notifications will still work')
    }
  } else {
    console.log('Must use physical device for Push Notifications')
  }

  return token
}

async function storeNotificationToken(token: string, userId: string): Promise<void> {
  try {
    // Import Firebase functions dynamically to avoid TypeScript issues
    const { doc, setDoc } = await import('firebase/firestore')
    const { db } = await import('../config/firebase')
    
    const tokenData: NotificationToken = {
      token,
      userId,
      createdAt: new Date(),
      platform: Platform.OS,
    }
    
    // Store in Firestore under user's document
    await setDoc(doc(db, 'users', userId, 'tokens', token), tokenData)
    console.log('Notification token stored successfully')
  } catch (error) {
    console.error('Error storing notification token:', error)
  }
}

export async function removeNotificationToken(userId: string, token: string): Promise<void> {
  try {
    // In a real implementation, you'd remove the token from Firestore
    // For now, we'll just log it
    console.log('Removing notification token for user:', userId)
  } catch (error) {
    console.error('Error removing notification token:', error)
  }
}

export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification)
  })

  // Handle notification response (when user taps notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response)
    
    // Handle navigation based on notification data
    const data = response.notification.request.content.data
    if (data?.eventId) {
      // Navigate to specific event
      console.log('Navigate to event:', data.eventId)
    }
  })

  return () => {
    Notifications.removeNotificationSubscription(notificationListener)
    Notifications.removeNotificationSubscription(responseListener)
  }
}

// Function to send local notification (for testing)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  })
}