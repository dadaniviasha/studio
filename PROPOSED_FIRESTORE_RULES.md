# Firestore Security Rules for Crotos

These rules are designed to be simple and secure. They ensure that users can only interact with their own data.

**All administrative actions (like approving deposits or changing balances) are now handled securely on the server using the Firebase Admin SDK, which bypasses these rules. This means you no longer need complex `isAdmin` checks in your security rules.**

---

### Step 1: Go to Your Firebase Project

Open a new browser tab and navigate to the [Firebase Console](https://console.firebase.google.com/). Select the project you are using for this application.

### Step 2: Navigate to Firestore Security Rules

1. In the left-hand menu, under the **Build** section, click on **Firestore Database**.
2. At the top of the Firestore page, click on the **Rules** tab.

### Step 3: Replace the Existing Rules

You will see an editor with some default rules. **Delete all the text** in that editor and **replace it with the simple ruleset below.**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      // Any authenticated user can create their own document (e.g., on signup).
      allow create: if request.auth.uid == userId;

      // A user can only read their own document.
      allow get: if request.auth.uid == userId;

      // A user can only update their own document.
      // NOTE: For security, sensitive fields like `walletBalance` and `isAdmin`
      // can only be changed by trusted server-side code (Admin SDK), not directly by the user.
      // This rule allows updates to non-sensitive fields if you add them later.
      allow update: if request.auth.uid == userId;

      // For security, no one can delete user documents from the app.
      // This must be done manually in the Firebase console.
      allow delete: if false;

      // Listing all users is a privileged action handled by the server (Admin SDK).
      // No client is allowed to list all users.
      allow list: if false;
    }
  }
}
```

### Step 4: Publish Your Changes

Click the **Publish** button above the editor. The changes might take a minute to take effect.

---

With these rules, your database is secure, and you don't have to worry about the `isAdmin` flag inside the rules anymore, as all admin tasks are now handled by trusted server code.
