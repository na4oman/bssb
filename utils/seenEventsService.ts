import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'

const SEEN_EVENTS_COLLECTION = 'userSeenEvents'

/**
 * Mark an event as seen by the user
 */
export const markEventAsSeen = async (userId: string, eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, SEEN_EVENTS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, {
        seenEventIds: arrayUnion(eventId),
      })
    } else {
      // Create new document
      await setDoc(docRef, {
        seenEventIds: [eventId],
      })
    }
  } catch (error) {
    console.error('Error marking event as seen:', error)
  }
}

/**
 * Get all seen event IDs for a user
 */
export const getSeenEventIds = async (userId: string): Promise<string[]> => {
  try {
    const docRef = doc(db, SEEN_EVENTS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data().seenEventIds || []
    }
    return []
  } catch (error) {
    console.error('Error getting seen events:', error)
    return []
  }
}

/**
 * Count unseen events
 */
export const countUnseenEvents = (allEventIds: string[], seenEventIds: string[]): number => {
  return allEventIds.filter(id => !seenEventIds.includes(id)).length
}
