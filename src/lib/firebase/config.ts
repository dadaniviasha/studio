// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Start of Debugging Logs ---
console.log("--- Firebase Config Check ---");
console.log("API Key found in environment:", !!firebaseConfig.apiKey);
console.log("Project ID found in environment:", !!firebaseConfig.projectId);
// --- End of Debugging Logs ---

export const FBCONFIG_MISSING = !firebaseConfig.apiKey || !firebaseConfig.projectId;

if (FBCONFIG_MISSING) {
  console.error("CRITICAL: FIREBASE CONFIG IS MISSING. Verify your .env.local file and restart the server.");
}


// Initialize Firebase
const app: FirebaseApp | null = FBCONFIG_MISSING ? null : !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth | null = FBCONFIG_MISSING || !app ? null : getAuth(app);
const db: Firestore | null = FBCONFIG_MISSING || !app ? null : getFirestore(app);

export { app, auth, db };
