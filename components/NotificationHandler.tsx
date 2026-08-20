import React, { useEffect, useRef } from 'react'
import { Alert, AppState, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'

const NotificationHandler = () => {
  const notificationListener = useRef<Notifications.EventSubscription | any>()
  const responseListener = useRef<Notifications.EventSubscription | any>()

  // Route the app based on a notification that the user tapped
  const routeFromNotification = (
    response: Notifications.NotificationResponse | null,
  ) => {
    if (!response) return

    const data: any = response.notification.request.content.data || {}
    console.log('Routing from notification:', data)

    // Event-related notifications open the event (events feed is the index tab)
    if (data.eventId) {
      const commentParam = data.commentId
        ? `&commentId=${encodeURIComponent(data.commentId)}`
        : ''
      router.push(
        `/(tabs)?eventId=${encodeURIComponent(data.eventId)}${commentParam}`,
      )
      return
    }

    // Payment confirmation opens the profile page to show membership status
    if (data?.type === 'payment_confirmed') {
      router.push('/profile')
    }
  }

  useEffect(() => {
    if (Platform.OS === 'web') return

    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        alert('Permission not granted for notifications')
      }
    }

    requestPermissions()

    // Handle notification received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification)

        const data = notification.request.content.data

        // Show alert for payment confirmation
        if (data?.type === 'payment_confirmed') {
          Alert.alert(
            notification.request.content.title || 'Notification',
            notification.request.content.body || '',
            [{ text: 'OK' }],
          )
        }
      })

    // Handle notification tap/interaction
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response)
        routeFromNotification(response)
      })

    // Cold start: app was launched by tapping a notification
    // Only navigate if the app is being opened from scratch (not already active)
    const appState = AppState.currentState
    if (appState !== 'active') {
      Notifications.getLastNotificationResponseAsync().then(lastResponse => {
        if (lastResponse) {
          routeFromNotification(lastResponse)
        }
      })
    }

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])

  return null // This component does not render anything
}

export default NotificationHandler
