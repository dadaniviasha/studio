
import admin from 'firebase-admin';

// This file is intended to be used in 'use server' context only.

// Check if the required environment variables are present
const hasAdminConfig = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

let app: admin.app.App;

if (!admin.apps.length) {
  if (hasAdminConfig) {
      try {
        app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log("Firebase Admin SDK initialized successfully.");
      } catch (error: any) {
          console.error("CRITICAL: Firebase Admin SDK initialization failed. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your .env.local file and that the app has been restarted.", error.message);
      }
  } else {
    console.warn(
        "WARNING: Firebase Admin SDK credentials are not set in .env.local. " +
        "Admin features will not work. Please provide FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
} else {
  app = admin.app();
}

const ADMIN_DB_ERROR_MESSAGE = "Admin features are disabled. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your environment and restart the server.";


/**
 * Returns the initialized Firestore Admin instance.
 * Throws an error if the Admin SDK is not configured.
 */
export async function getAdminDb() {
  if (!hasAdminConfig || !app) {
    throw new Error(ADMIN_DB_ERROR_MESSAGE);
  }
  return app.firestore();
}
