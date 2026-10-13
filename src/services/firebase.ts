import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, FamilyProfile, MedicalDocument, MedicineReminder } from '../types/health';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Always pass firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / check configuration.');
    }
    return false;
  }
}

// Firestore Repository Functions

export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getProfilesFromFirestore(userId: string): Promise<FamilyProfile[]> {
  const path = `users/${userId}/profiles`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'profiles'));
    const profiles: FamilyProfile[] = [];
    snap.forEach((d) => profiles.push(d.data() as FamilyProfile));
    return profiles;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveProfileToFirestore(userId: string, profile: FamilyProfile): Promise<void> {
  const path = `users/${userId}/profiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'profiles', profile.id), profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getDocumentsFromFirestore(userId: string, profileId: string): Promise<MedicalDocument[]> {
  const path = `users/${userId}/profiles/${profileId}/documents`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'profiles', profileId, 'documents'));
    const docs: MedicalDocument[] = [];
    snap.forEach((d) => docs.push(d.data() as MedicalDocument));
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveDocumentToFirestore(userId: string, profileId: string, document: MedicalDocument): Promise<void> {
  const path = `users/${userId}/profiles/${profileId}/documents/${document.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'profiles', profileId, 'documents', document.id), document);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteDocumentFromFirestore(userId: string, profileId: string, docId: string): Promise<void> {
  const path = `users/${userId}/profiles/${profileId}/documents/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'profiles', profileId, 'documents', docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getRemindersFromFirestore(userId: string, profileId: string): Promise<MedicineReminder[]> {
  const path = `users/${userId}/profiles/${profileId}/reminders`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'profiles', profileId, 'reminders'));
    const reminders: MedicineReminder[] = [];
    snap.forEach((d) => reminders.push(d.data() as MedicineReminder));
    return reminders;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveReminderToFirestore(userId: string, profileId: string, reminder: MedicineReminder): Promise<void> {
  const path = `users/${userId}/profiles/${profileId}/reminders/${reminder.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'profiles', profileId, 'reminders', reminder.id), reminder, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
