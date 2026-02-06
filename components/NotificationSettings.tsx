import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../contexts/AuthContext'
import { sendLocalNotification } from '../utils/simpleNotificationService'

export default function NotificationSettings() {
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [newEventsEnabled, setNewEventsEnabled] = useState(true)
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [likesEnabled, setLikesEnabled] = useState(false)

  useEffect(() => {
    checkNotificationPermissions()
  }, [])

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync()
    setNotificationsEnabled(status === 'granted')
  }

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status === 'granted') {
        setNotificationsEnabled(true)
        Alert.alert('Success', 'Notifications enabled successfully!')
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.')
      }
    } else {
      setNotificationsEnabled(false)
      Alert.alert('Notifications Disabled', 'You can re-enable them anytime in settings.')
    }
  }

  const testNotification = async () => {
    if (!notificationsEnabled) {
      Alert.alert('Error', 'Please enable notifications first.')
      return
    }

    try {
      await sendLocalNotification(
        'Test Notification 🔔',
        'This is a test notification from BSSB app!',
        { type: 'test' }
      )
      Alert.alert('Success', 'Test notification sent!')
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      {/* Main notifications toggle */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="notifications" size={24} color="#e21d38" />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications from BSSB app
            </Text>
          </View>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#ccc', true: '#e21d38' }}
          thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* Notification type settings */}
      {notificationsEnabled && (
        <>
          <View style={styles.separator} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={24} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>New Events</Text>
                <Text style={styles.settingDescription}>
                  Get notified when new events are created
                </Text>
              </View>
            </View>
            <Switch
              value={newEventsEnabled}
              onValueChange={setNewEventsEnabled}
              trackColor={{ false: '#ccc', true: '#e21d38' }}
              thumbColor={newEventsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble" size={24} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Comments</Text>
                <Text style={styles.settingDescription}>
                  Get notified when someone comments on your events
                </Text>
              </View>
            </View>
            <Switch
              value={commentsEnabled}
              onValueChange={setCommentsEnabled}
              trackColor={{ false: '#ccc', true: '#e21d38' }}
              thumbColor={commentsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={24} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Likes</Text>
                <Text style={styles.settingDescription}>
                  Get notified when someone likes your events
                </Text>
              </View>
            </View>
            <Switch
              value={likesEnabled}
              onValueChange={setLikesEnabled}
              trackColor={{ false: '#ccc', true: '#e21d38' }}
              thumbColor={likesEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.separator} />

          {/* Test notification button */}
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  testButton: {
    backgroundColor: '#e21d38',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})