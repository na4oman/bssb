import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  AppNotification,
} from '../utils/notificationFeedService'

const TYPE_ICONS: Record<string, { name: string; color: string }> = {
  new_event: { name: 'football-outline', color: '#e21d38' },
  like: { name: 'heart', color: '#e21d38' },
  comment: { name: 'chatbubble-ellipses-outline', color: '#1e88e5' },
  attendance: { name: 'people-outline', color: '#2e7d32' },
  payment_confirmed: { name: 'checkmark-circle-outline', color: '#2e7d32' },
}

const NotificationBadge = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [modalVisible, setModalVisible] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  // Subscribe to the user's in-app notification feed
  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToNotifications(user.uid, setNotifications)
    return unsubscribe
  }, [user])

  const openNotification = async (notification: AppNotification) => {
    // Mark as read
    if (!notification.read) {
      markNotificationRead(notification.id)
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n)),
      )
    }

    // Close the list before navigating
    setModalVisible(false)

    // Navigate based on notification type
    if (notification.eventId) {
      const commentParam = notification.commentId
        ? `&commentId=${encodeURIComponent(notification.commentId)}`
        : ''
      router.push(
        `/(tabs)?eventId=${encodeURIComponent(notification.eventId)}${commentParam}`,
      )
    } else if (notification.type === 'payment_confirmed') {
      router.push('/profile')
    }
  }

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return
    await markAllNotificationsRead(user.uid)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getTypeIcon = (type: string) =>
    TYPE_ICONS[type] || { name: 'notifications-outline', color: '#666' }

  return (
    <>
      {/* Bell with unread counter (header) */}
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={() => setModalVisible(true)}
        accessibilityLabel='Notifications'
      >
        <Ionicons name='notifications-outline' size={22} color='#fff' />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification center (bottom sheet) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead}>
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name='close' size={24} color='#e21d38' />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name='notifications-off-outline'
                  size={40}
                  color='#ccc'
                />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              <ScrollView>
                {notifications.map(notification => {
                  const icon = getTypeIcon(notification.type)
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationCard,
                        !notification.read && styles.notificationCardUnread,
                      ]}
                      onPress={() => openNotification(notification)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: icon.color + '22' },
                        ]}
                      >
                        <Ionicons
                          name={icon.name as any}
                          size={20}
                          color={icon.color}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text
                          style={styles.notificationTitle}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        <Text
                          style={styles.notificationMessage}
                          numberOfLines={2}
                        >
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {notification.createdAt
                            ? formatDistanceToNow(notification.createdAt, {
                                addSuffix: true,
                              })
                            : ''}
                        </Text>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  bellContainer: {
    padding: 8,
    marginRight: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: 200,
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllText: {
    color: '#e21d38',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notificationCardUnread: {
    backgroundColor: '#fff5f5',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e21d38',
    marginLeft: 8,
  },
})

export default NotificationBadge
