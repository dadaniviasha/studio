// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const FBCONFIG_MISSING = !firebaseConfig.apiKey || !firebaseConfig.projectId;

// Initialize Firebase
const app: FirebaseApp | null = FBCONFIG_MISSING ? null : !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth | null = FBCONFIG_MISSING || !app ? null : getAuth(app);

export { app, auth, FBCONFIG_MISSING };
