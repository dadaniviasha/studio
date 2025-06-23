
import admin from 'firebase-admin';

// This file is intended to be used in 'use server' context only.

// Check if the required environment variables are present
const hasAdminConfig = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!hasAdminConfig) {
    console.warn(
        "WARNING: Firebase Admin SDK credentials are not set in .env.local. " +
        "Admin features will not work. Please provide FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key from the .env file needs to have its newlines escaped.
  // We replace them back to actual newlines here.
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    // We only initialize the app if the config is valid
    if (hasAdminConfig) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as any),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    }
  } catch (error: any) {
    if (error.code === 'app/invalid-credential') {
        console.error(
            "CRITICAL: Firebase Admin SDK initialization failed due to invalid credentials. " +
            "Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your .env.local file and that the app has been restarted."
        );
    } else {
        console.error("Firebase Admin SDK initialization failed:", error);
    }
  }
}

// Only export the db instance if it's initialized
export const adminDb = hasAdminConfig ? admin.firestore() : null;
