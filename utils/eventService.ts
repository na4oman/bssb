import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Event, EventComment, EventAttendee } from '../types/event'
import { notifyAllUsers } from '../utils/simpleNotificationService'
import { sendNotificationToUser } from '../utils/pushNotificationService'
import {
  addNotification,
  addNotificationToAllUsers,
} from '../utils/notificationFeedService'

const EVENTS_COLLECTION = 'events'

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000)
  }
  return new Date(timestamp)
}

// Convert Event data from Firestore
const convertEventData = (doc: any): Event => {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title,
    date: convertTimestamp(data.date),
    location: data.location,
    locationCoordinates: data.locationCoordinates,
    description: data.description,
    imageUrl: data.imageUrl,
    createdBy: data.createdBy,
    likes: data.likes || [],
    comments: (data.comments || []).map((comment: any) => ({
      ...comment,
      timestamp: convertTimestamp(comment.timestamp),
    })),
    attendees: data.attendees || [],
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : undefined,
  }
}

// Create a new event
export const createEvent = async (
  eventData: Omit<Event, 'id' | 'likes' | 'comments' | 'attendees'>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      date: Timestamp.fromDate(eventData.date),
      likes: [],
      comments: [],
      attendees: [],
      createdAt: serverTimestamp(),
    })

    // Send notification about the new event
    try {
      await notifyAllUsers(
        'New Event Created! 🎉',
        `${eventData.title} - ${eventData.location}`,
        {
          eventId: docRef.id,
          type: 'new_event',
        },
      )
      console.log('Event notification sent')
    } catch (notificationError) {
      console.error('Error sending event notification:', notificationError)
      // Don't throw here - event creation should succeed even if notification fails
    }

    // Add in-app feed notification for the new event (web + mobile notification center)
    try {
      await addNotificationToAllUsers(
        {
          type: 'new_event',
          title: 'New Event Created! 🎉',
          message: `${eventData.title} - ${eventData.location}`,
          eventId: docRef.id,
        },
        eventData.createdBy?.userId,
      )
      console.log('Event feed notification added')
    } catch (feedError) {
      console.error('Error adding event feed notification:', feedError)
      // Don't throw here - event creation should succeed even if the feed write fails
    }

    return docRef.id
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

// Get all events
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      orderBy('createdAt', 'desc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertEventData)
  } catch (error) {
    console.error('Error getting events:', error)
    throw error
  }
}

// Subscribe to events in real-time
export const subscribeToEvents = (callback: (events: Event[]) => void) => {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    q,
    querySnapshot => {
      const events = querySnapshot.docs.map(convertEventData)
      callback(events)
    },
    error => {
      console.error('Error subscribing to events:', error)
    },
  )
}

// Toggle like on an event
export const toggleEventLike = async (
  eventId: string,
  userId: string,
  isLiked: boolean,
  likerName?: string,
): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(eventRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    })

    if (!isLiked) {
      const eventSnap = await getDoc(eventRef)
      const eventData = eventSnap.data()
      const creatorId = eventData?.createdBy?.userId
      if (creatorId && creatorId !== userId) {
        // Push notification (unchanged)
        await sendNotificationToUser(
          creatorId,
          'New like ❤️',
          `${likerName || 'Someone'} liked ${eventData?.title || 'your event'}`,
          { eventId, type: 'like' },
        )
        // In-app feed notification
        await addNotification(creatorId, {
          type: 'like',
          title: 'New like ❤️',
          message: `${likerName || 'Someone'} liked ${eventData?.title || 'your event'}`,
          eventId,
        })
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    throw error
  }
}

// Add comment to an event
export const addEventComment = async (
  eventId: string,
  comment: Omit<EventComment, 'id' | 'timestamp'>,
): Promise<void> => {
  try {
    console.log('Adding comment to event:', eventId, comment)

    const eventRef = doc(db, EVENTS_COLLECTION, eventId)

    // Build comment object without undefined values
    const commentId = `${Date.now()}-${comment.userId}`
    const newComment: any = {
      id: commentId,
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text || '', // Ensure text is never undefined
      timestamp: new Date(), // Use regular Date instead of serverTimestamp()
    }

    // Only add imageUrl if it exists and is not undefined/null
    if (comment.imageUrl && comment.imageUrl.trim() !== '') {
      newComment.imageUrl = comment.imageUrl
    }

    console.log('New comment object:', newComment)

    await updateDoc(eventRef, {
      comments: arrayUnion(newComment),
    })

    const eventSnap = await getDoc(eventRef)
    const eventData = eventSnap.data()
    const creatorId = eventData?.createdBy?.userId
    if (creatorId && creatorId !== comment.userId) {
      // Push notification (unchanged)
      await sendNotificationToUser(
        creatorId,
        'New comment 💬',
        `${comment.userName} commented on ${eventData?.title || 'your event'}`,
        { eventId, commentId, type: 'comment' },
      )
      // In-app feed notification
      await addNotification(creatorId, {
        type: 'comment',
        title: 'New comment 💬',
        message: `${comment.userName} commented on ${eventData?.title || 'your event'}`,
        eventId,
        commentId,
      })
    }

    console.log('Comment added successfully to Firestore')
  } catch (error) {
    console.error('Error adding comment to Firestore:', error)
    throw error
  }
}

// Update attendance status
export const updateEventAttendance = async (
  eventId: string,
  attendee: EventAttendee,
): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)

    // First, get the current event to remove existing attendance
    const events = await getAllEvents()
    const currentEvent = events.find(e => e.id === eventId)

    if (currentEvent) {
      // Remove existing attendance for this user
      const existingAttendee = currentEvent.attendees.find(
        a => a.userId === attendee.userId,
      )
      if (existingAttendee) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(existingAttendee),
        })
      }

      // Add new attendance
      await updateDoc(eventRef, {
        attendees: arrayUnion(attendee),
      })

      // Notify the event creator that someone responded (going / maybe / not going)
      try {
        const creatorId = currentEvent.createdBy?.userId
        if (creatorId && creatorId !== attendee.userId) {
          const statusText =
            attendee.status === 'not going'
              ? 'is not going'
              : attendee.status === 'maybe'
                ? 'is a maybe'
                : 'is going'
          const title = 'New RSVP 📋'
          const message = `${attendee.userName} ${statusText} to ${currentEvent.title || 'your event'}`
          // Push notification (unchanged)
          await sendNotificationToUser(creatorId, title, message, {
            eventId,
            type: 'attendance',
          })
          // In-app feed notification
          await addNotification(creatorId, {
            type: 'attendance',
            title,
            message,
            eventId,
          })
          console.log('Attendance notification sent')
        }
      } catch (notificationError) {
        console.error(
          'Error sending attendance notification:',
          notificationError,
        )
        // Don't fail the attendance update if the notification fails
      }
    }
  } catch (error) {
    console.error('Error updating attendance:', error)
    throw error
  }
}

// Delete an event (only by creator)
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}
