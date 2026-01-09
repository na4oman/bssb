import {
  collection,
  addDoc,
  getDocs,
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
  eventData: Omit<Event, 'id' | 'likes' | 'comments' | 'attendees'>
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
    return docRef.id
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

// Get all events
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertEventData)
  } catch (error) {
    console.error('Error getting events:', error)
    throw error
  }
}

// Subscribe to events in real-time
export const subscribeToEvents = (callback: (events: Event[]) => void) => {
  const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'))
  
  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(convertEventData)
    callback(events)
  }, (error) => {
    console.error('Error subscribing to events:', error)
  })
}

// Toggle like on an event
export const toggleEventLike = async (eventId: string, userId: string, isLiked: boolean): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(eventRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    throw error
  }
}

// Add comment to an event
export const addEventComment = async (
  eventId: string,
  comment: Omit<EventComment, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    const newComment = {
      ...comment,
      id: Date.now().toString(),
      timestamp: serverTimestamp(),
    }
    
    await updateDoc(eventRef, {
      comments: arrayUnion(newComment),
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

// Update attendance status
export const updateEventAttendance = async (
  eventId: string,
  attendee: EventAttendee
): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    
    // First, get the current event to remove existing attendance
    const events = await getAllEvents()
    const currentEvent = events.find(e => e.id === eventId)
    
    if (currentEvent) {
      // Remove existing attendance for this user
      const existingAttendee = currentEvent.attendees.find(a => a.userId === attendee.userId)
      if (existingAttendee) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(existingAttendee),
        })
      }
      
      // Add new attendance
      await updateDoc(eventRef, {
        attendees: arrayUnion(attendee),
      })
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