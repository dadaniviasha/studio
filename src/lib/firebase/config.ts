// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// --- Firebase Initialization and Debugging ---
console.log("--- Initializing Firebase ---");

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log("Checking for NEXT_PUBLIC_FIREBASE_API_KEY:", apiKey ? "Found" : "MISSING");
console.log("Checking for NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectId ? "Found" : "MISSING");

export const FBCONFIG_MISSING = !apiKey || !projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (FBCONFIG_MISSING) {
  console.error("CRITICAL: Firebase config is missing or incomplete. Please verify your .env.local file and ensure the server has restarted.");
} else {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // This might happen if keys are present but invalid.
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };
