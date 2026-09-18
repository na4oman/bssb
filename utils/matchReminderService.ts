import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../config/firebase'
import { isWeb } from './platformStyles'

export type MatchReminder = {
  matchId: number
  utcDate: string
  homeTeamName: string
  awayTeamName: string
}

const remindersRef = (userId: string) =>
  collection(db, 'users', userId, 'matchReminders')

// Fetch all match reminders for a user (per-account, synced across devices)
export const getMatchReminders = async (
  userId: string,
): Promise<MatchReminder[]> => {
  try {
    const snapshot = await getDocs(remindersRef(userId))
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        matchId: data.matchId,
        utcDate: data.utcDate,
        homeTeamName: data.homeTeamName,
        awayTeamName: data.awayTeamName,
      }
    })
  } catch (error) {
    console.error('Error fetching match reminders:', error)
    return []
  }
}

// Save a match reminder for a user
export const saveMatchReminder = async (
  userId: string,
  reminder: MatchReminder,
) => {
  try {
    await setDoc(doc(remindersRef(userId), String(reminder.matchId)), {
      ...reminder,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Error saving match reminder:', error)
    throw error
  }
}

// Delete a match reminder for a user
export const deleteMatchReminder = async (userId: string, matchId: number) => {
  try {
    await deleteDoc(doc(remindersRef(userId), String(matchId)))
  } catch (error) {
    console.error('Error deleting match reminder:', error)
    throw error
  }
}

// Sync the account's reminders onto this device: schedule local
// notifications for reminders that aren't scheduled here yet (native),
// mark them on web (management only), and clean up stale ones.
export const syncMatchRemindersToDevice = async (
  userId: string,
  localReminders: { [key: number]: string },
  onUpdate: (merged: { [key: number]: string }) => void,
): Promise<{ [key: number]: string }> => {
  const cloudReminders = await getMatchReminders(userId)
  const merged = { ...localReminders }
  let changed = false

  for (const reminder of cloudReminders) {
    const matchTime = new Date(reminder.utcDate).getTime()

    // Match already started — drop the stale reminder from the account
    if (matchTime < Date.now()) {
      try {
        await deleteMatchReminder(userId, reminder.matchId)
      } catch (error) {
        console.warn('Stale reminder cleanup failed:', error)
      }
      changed = true
      continue
    }

    // Already scheduled/handled on this device
    if (merged[reminder.matchId]) continue

    if (isWeb) {
      // Web is a management surface only — no browser notifications
      merged[reminder.matchId] = `web_${reminder.matchId}`
    } else {
      const { status } = await Notifications.getPermissionsAsync()
      if (status === 'granted') {
        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Match starting soon ⚽',
              body: `${reminder.homeTeamName} vs ${reminder.awayTeamName} kicks off in 1 hour`,
              data: { type: 'match_reminder', matchId: reminder.matchId },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(matchTime - 60 * 60 * 1000),
            },
          })
          merged[reminder.matchId] = notificationId
        } catch (error) {
          console.error('Error scheduling synced reminder:', error)
          merged[reminder.matchId] = `synced_${reminder.matchId}`
        }
      } else {
        // No permission on this device yet — keep the reminder in the
        // account, just don't schedule locally
        merged[reminder.matchId] = `synced_${reminder.matchId}`
      }
    }
    changed = true
  }

  if (changed) {
    onUpdate(merged)
    await AsyncStorage.setItem('matchReminders', JSON.stringify(merged))
  }

  return merged
}