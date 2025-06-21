import { db } from './config';
import { doc, getDoc, setDoc, updateDoc, type DocumentData } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';

export const SIGNUP_BONUS = 50;

/**
 * Creates a new user document in Firestore when a user signs up.
 * @param user The Firebase user object from authentication.
 */
export async function createUserDocument(user: FirebaseUser) {
  if (!db) return;
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    id: user.uid,
    email: user.email,
    username: user.displayName,
    walletBalance: SIGNUP_BONUS,
  };
  await setDoc(userRef, userData);
}

/**
 * Fetches a user's data from Firestore.
 * @param uid The user's unique ID.
 * @returns The user data or null if not found.
 */
export async function getUserDocument(uid: string): Promise<AppUser | null> {
  if (!db) return null;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as AppUser;
  } else {
    // This case might happen if a user was created but their doc failed to write.
    // Returning null allows the caller to handle this scenario.
    console.warn("No user document found for UID:", uid);
    return null;
  }
}


/**
 * Updates a user's wallet balance in Firestore.
 * @param uid The user's unique ID.
 * @param newBalance The new wallet balance.
 */
export async function updateUserBalanceInDb(uid: string, newBalance: number) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    walletBalance: newBalance
  });
}
