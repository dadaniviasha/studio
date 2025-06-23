
import admin from 'firebase-admin';

// This file is intended to be used in 'use server' context only.

console.log("--- Initializing Firebase Admin SDK: Checking server environment variables... ---");

const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

let configIsValid = true;
const keyToEnvVarMap: { [key: string]: string } = {
  projectId: 'FIREBASE_PROJECT_ID',
  clientEmail: 'FIREBASE_CLIENT_EMAIL',
  privateKey: 'FIREBASE_PRIVATE_KEY'
};

for (const [key, value] of Object.entries(adminConfig)) {
  const envVarName = keyToEnvVarMap[key];
  if (!value) {
    console.error(`CRITICAL: Firebase Admin config key '${envVarName}' is missing. Please check your .env.local file. This is required for all admin features.`);
    configIsValid = false;
  } else {
     console.log(`- ${envVarName}: Found.`);
  }
}

let app: admin.app.App | null = null;
const ADMIN_INIT_ERROR = "Firebase Admin SDK is not configured. Admin features will be disabled. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.local and that the server has been restarted.";

if (admin.apps.length) {
    app = admin.app();
} else if (configIsValid) {
    try {
        app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: adminConfig.projectId,
                clientEmail: adminConfig.clientEmail,
                privateKey: adminConfig.privateKey!.replace(/\\n/g, '\n'),
            }),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error("CRITICAL: Firebase Admin SDK initialization failed with an error. Ensure your service account credentials in .env.local are correct and that the server has been restarted.", error.message);
        app = null;
    }
} else {
    console.error("CRITICAL: Firebase Admin SDK not initialized due to missing configuration. See logs above.");
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
