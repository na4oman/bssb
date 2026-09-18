import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth, db } from '../config/firebase'
import {
  getSecureCredentials,
  clearSecureCredentials,
} from './secureCredentialStorage'
import { clearStoredCredentials } from './credentialStorage'

/**
 * Permanently deletes the signed-in user's account:
 * 1. Re-authenticates — required by Firebase for deleteUser() (recent-login
 *    rule) and refreshes the token so the Firestore deletions stay authorized.
 * 2. Deletes all of the user's Firestore data.
 * 3. Deletes the Firebase Auth account.
 * 4. Clears locally stored credentials.
 *
 * Order matters: Firestore data must be deleted BEFORE the auth account,
 * because deleteUser() invalidates the token and Firestore would reject
 * every subsequent write.
 */
export async function deleteAccount(password?: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('No authenticated user')
  }

  // 1. Re-authenticate with the provided password, or fall back to the
  //    keychain credentials saved by "Remember me" (mobile only).
  if (password) {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    )
  } else {
    const stored = await getSecureCredentials()
    if (stored) {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(stored.email, stored.password),
      )
    }
    // No credentials available — proceed without re-auth; deleteUser() may
    // throw auth/requires-recent-login, which the caller surfaces.
  }

  // 2. Firestore data. users/{uid} is deleted LAST because the posts delete
  //    rule checks the creator's users doc for isAdmin.
  await deleteUserFirestoreData(user.uid)

  // 3. Auth account
  await deleteUser(user)

  // 4. Local cleanup
  await clearSecureCredentials()
  await clearStoredCredentials()
  await AsyncStorage.removeItem('matchReminders')
}

async function deleteUserFirestoreData(uid: string): Promise<void> {
  // users/{uid}/matchReminders/*
  await deleteCollectionDocs(collection(db, 'users', uid, 'matchReminders'))

  // users/{uid}/tokens/*
  await deleteCollectionDocs(collection(db, 'users', uid, 'tokens'))

  // deviceTokens where userId == uid
  await deleteQueryDocs(
    query(collection(db, 'deviceTokens'), where('userId', '==', uid)),
  )

  // notifications where userId == uid
  await deleteQueryDocs(
    query(collection(db, 'notifications'), where('userId', '==', uid)),
  )

  // userSeenEvents/{uid}
  await safeDelete(doc(db, 'userSeenEvents', uid))

  // events created by the user
  await deleteQueryDocs(
    query(collection(db, 'events'), where('createdBy.userId', '==', uid)),
  )

  // posts created by the user (admins only; the delete rule requires the
  // creator's users doc to still exist, so this runs before users/{uid})
  await deleteQueryDocs(
    query(collection(db, 'posts'), where('createdBy.userId', '==', uid)),
  )

  // users/{uid} — last
  await safeDelete(doc(db, 'users', uid))
}

async function deleteCollectionDocs(ref: any): Promise<void> {
  try {
    const snapshot = await getDocs(ref)
    await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)))
  } catch (error) {
    console.warn('Account deletion: failed to clear a collection:', error)
  }
}

async function deleteQueryDocs(q: any): Promise<void> {
  try {
    const snapshot = await getDocs(q)
    await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)))
  } catch (error) {
    console.warn('Account deletion: failed to clear a query:', error)
  }
}

async function safeDelete(ref: any): Promise<void> {
  try {
    await deleteDoc(ref)
  } catch (error) {
    console.warn('Account deletion: failed to delete a document:', error)
  }
}