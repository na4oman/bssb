import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { db } from '../firebase.config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e21d38',
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
      alert('Failed to get push token for push notification!')
      return
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: 'a3c53e83-f2dc-4268-9f88-e1d31032c95e', // Your Expo project ID
      })
    ).data
  }

  return token
}

export async function saveUserPushToken(userId: string, token: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      await setDoc(userRef, { pushToken: token }, { merge: true })
    }
  } catch (error) {
    console.error('Error saving push token:', error)
  }
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string
) {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  }))

  await Promise.all(
    messages.map(message =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
    )
  )
}
