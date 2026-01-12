import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function setupNotifications(): Promise<boolean> {
  let hasPermission = false
  
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
    
    if (finalStatus === 'granted') {
      hasPermission = true
      console.log('Notification permissions granted')
    } else {
      console.log('Notification permissions denied')
    }
  } else {
    console.log('Must use physical device for notifications')
  }

  return hasPermission
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

// Function to send local notification (works perfectly)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    })
    console.log('Local notification sent successfully')
  } catch (error) {
    console.error('Error sending local notification:', error)
  }
}

// Function to send notification to all app users (local approach)
export async function notifyAllUsers(title: string, body: string, data?: any) {
  // For now, this will just send a local notification
  // In a production app, you'd want to use a proper push notification service
  await sendLocalNotification(title, body, data)
  
  // TODO: Implement server-side push notifications using:
  // - Firebase Cloud Functions
  // - Expo Push API
  // - Or another push notification service
  console.log('Notification sent to current user (local). For multi-user notifications, implement server-side push.')
}