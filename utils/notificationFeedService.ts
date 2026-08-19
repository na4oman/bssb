import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const NOTIFICATIONS_COLLECTION = 'notifications'

export type NotificationType =
  | 'new_event'
  | 'like'
  | 'comment'
  | 'attendance'
  | 'payment_confirmed'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  eventId?: string
  read: boolean
  createdAt: Date
}

export interface NotificationInput {
  type: NotificationType
  title: string
  message: string
  eventId?: string
}

// Convert a Firestore notification doc to the AppNotification shape
const convertNotification = (doc: any): AppNotification => {
  const data = doc.data()
  return {
    id: doc.id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    eventId: data.eventId,
    read: data.read === true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
  }
}

/**
 * Write a single in-app notification for one user.
 * Swallows errors — a feed failure must never break the primary action (event, like, etc).
 */
export async function addNotification(
  userId: string,
  notification: NotificationInput
): Promise<string | null> {
  try {
    if (!userId) return null
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      eventId: notification.eventId || null,
      read: false,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding notification to feed:', error)
    return null
  }
}

/**
 * Write an in-app notification for every user that has a registered device token.
 * Used for broadcasts (e.g. "New event created"), mirroring notifyAllUsers.
 */
export async function addNotificationToAllUsers(
  notification: NotificationInput,
  excludeUserId?: string
): Promise<void> {
  try {
    const tokensSnapshot = await getDocs(collection(db, 'deviceTokens'))
    const userIds: string[] = []
    tokensSnapshot.forEach(tokenDoc => {
      const userId = tokenDoc.data().userId
      if (userId && userId !== excludeUserId && !userIds.includes(userId)) {
        userIds.push(userId)
      }
    })
    await Promise.all(userIds.map(userId => addNotification(userId, notification)))
  } catch (error) {
    console.error('Error adding notifications to all users:', error)
  }
}

/**
 * Subscribe to a user's in-app notification feed (newest first).
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    snapshot => {
      const notifications = snapshot.docs.map(convertNotification)
      callback(notifications)
    },
    error => {
      console.error('Error subscribing to notifications:', error)
    }
  )
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { read: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Mark all of a user's notifications as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    )
    const snapshot = await getDocs(q)
    await Promise.all(snapshot.docs.map(d => updateDoc(d.ref, { read: true })))
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}
