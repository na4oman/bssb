import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export function tokenDocId(token: string): string {
  return token.replace(/[\[\]\/.#$]/g, '_')
}

export async function setupNotifications(userId?: string): Promise<boolean> {
  let hasPermission = false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BSSB Events',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e21d38',
      description: 'Notifications for new events, comments, likes and match reminders',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions denied')
    return false
  }

  hasPermission = true
  console.log('Notification permissions granted')

  if (userId) {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      const expoPushToken = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
      const token = expoPushToken.data
      console.log('Expo Push Token:', token)

      await setDoc(doc(db, 'deviceTokens', tokenDocId(token)), {
        token,
        userId,
        platform: Platform.OS,
        createdAt: new Date(),
      })
      await setDoc(doc(db, 'users', userId), { pushToken: token }, { merge: true })
      console.log('Push token stored for user:', userId)
    } catch (error) {
      console.warn('Push token not registered. Local notifications still work. Rebuild the Android app after adding FCM credentials if this persists.')
      if (!Device.isDevice) {
        console.log('Push tokens require a physical device')
      }
    }
  }

  return hasPermission
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification)
  })

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response)
    const data = response.notification.request.content.data
    if (data?.eventId) {
      console.log('Navigate to event:', data.eventId)
    }
  })

  return () => {
    Notifications.removeNotificationSubscription(notificationListener)
    Notifications.removeNotificationSubscription(responseListener)
  }
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    })
    console.log('Local notification sent successfully')
  } catch (error) {
    console.error('Error sending local notification:', error)
  }
}

export async function notifyAllUsers(title: string, body: string, data?: any) {
  const { sendNotificationToAllUsers } = await import('./pushNotificationService')
  const { auth } = await import('../config/firebase')
  await sendNotificationToAllUsers(title, body, data, auth.currentUser?.uid)
}
