
"use server";

import admin from 'firebase-admin';
import { serviceAccountKey } from './serviceAccountKey';

// This file is intended to be used in 'use server' context only.
// It initializes the Firebase Admin SDK using a hardcoded service account key.
// For production environments, it is STRONGLY recommended to use environment variables instead.
// See the Vercel or Firebase Hosting documentation for setting up server-side environment variables.

console.log("--- Initializing Firebase Admin SDK from local serviceAccountKey.ts ---");

let app: admin.app.App | null = null;
const ADMIN_INIT_ERROR = "Firebase Admin SDK initialization failed. Check the service account key in src/lib/firebase/serviceAccountKey.ts and ensure the server has been restarted.";

if (admin.apps.length) {
    app = admin.app();
    console.log("Firebase Admin SDK was already initialized.");
} else {
    try {
        // The serviceAccountKey must have projectId, clientEmail, and privateKey fields.
        if (!serviceAccountKey.project_id || !serviceAccountKey.client_email || !serviceAccountKey.private_key) {
             throw new Error("The service account key object is missing one or more required properties (project_id, client_email, private_key).");
        }

        app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccountKey.project_id,
                clientEmail: serviceAccountKey.client_email,
                // The private key from the JSON file often has escaped newlines, so we replace them.
                privateKey: serviceAccountKey.private_key.replace(/\\n/g, '\n'),
            }),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error("CRITICAL: Firebase Admin SDK initialization failed.", error.message);
        app = null;
    }
}


/**
 * Returns the initialized Firestore Admin instance.
 * Throws an error if the Admin SDK is not configured.
 */
export async function getAdminDb() {
  if (!app) {
    throw new Error(ADMIN_INIT_ERROR);
  }
  return app.firestore();
}

/**
 * Returns the initialized Firebase Auth Admin instance.
 * Throws an error if the Admin SDK is not configured.
 */
export async function getAdminAuth() {
  if (!app) {
    throw new Error(ADMIN_INIT_ERROR);
  }
  return app.auth();
}
