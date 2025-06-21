
// Restarting server to load new environment variables.

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// --- Firebase Initialization and Debugging ---
console.log("--- Initializing Firebase: Checking environment variables... ---");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check each key and log a specific error if it's missing
let configIsValid = true;
// A map to convert camelCase keys from firebaseConfig to the snake_case format in .env.local
const keyToEnvVarMap: { [key: string]: string } = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID'
};

for (const [key, value] of Object.entries(firebaseConfig)) {
  const envVarName = keyToEnvVarMap[key];
  if (!value) {
    console.error(`CRITICAL: Firebase config key '${envVarName}' is missing. Please check your .env.local file.`);
    configIsValid = false;
  } else {
    console.log(`- ${envVarName}: Found.`);
  }
}

export const FBCONFIG_MISSING = !configIsValid;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (FBCONFIG_MISSING) {
  console.error("Firebase initialization failed due to missing configuration. Please check the errors above, correct your .env.local file, and ensure the app has restarted.");
} else {
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
