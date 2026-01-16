import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToEvents } from '../utils/eventService'
import { getSeenEventIds, countUnseenEvents } from '../utils/seenEventsService'
import { sendLocalNotification } from '../utils/simpleNotificationService'

const NotificationBadge = () => {
  const { user } = useAuth()
  const [unseenCount, setUnseenCount] = useState(0)

  useEffect(() => {
    if (!user) return

    let seenEventIds: string[] = []

    // Load seen events first
    const loadSeenEvents = async () => {
      seenEventIds = await getSeenEventIds(user.uid)
      
      // Subscribe to events and calculate unseen count
      const unsubscribe = subscribeToEvents((events) => {
        const allEventIds = events.map(e => e.id)
        const count = countUnseenEvents(allEventIds, seenEventIds)
        setUnseenCount(count)
      })

      return unsubscribe
    }

    const unsubscribePromise = loadSeenEvents()

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe?.())
    }
  }, [user])

  const testNotification = async () => {
    try {
      await sendLocalNotification(
        'Test Notification 🔔',
        'Push notifications are working! New events will notify all users.',
        { type: 'test' }
      )
      Alert.alert('Success', 'Test notification sent!')
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.')
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={testNotification}>
      <Ionicons name="notifications" size={20} color="#fff" />
      {unseenCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unseenCount > 99 ? '99+' : unseenCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#e21d38',
    fontSize: 10,
    fontWeight: 'bold',
  },
})

export default NotificationBadge
