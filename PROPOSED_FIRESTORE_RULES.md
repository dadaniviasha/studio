
# How to Fix the "Missing or insufficient permissions" Error

You've encountered an important Firebase security feature! The error you're seeing is because your database is correctly protecting your users' data. By default, no one can read or write other users' data.

To grant your **admin account** the necessary permissions, you need to update your project's **Firestore Security Rules**.

This is a **one-time setup step** in the Firebase Console, not a bug in the app's code.

---

### Step 1: Go to Your Firebase Project

Open a new browser tab and navigate to the [Firebase Console](https://console.firebase.google.com/). Select the project you are using for this application.

### Step 2: Navigate to Firestore Security Rules

1. In the left-hand menu, under the **Build** section, click on **Firestore Database**.
2. At the top of the Firestore page, click on the **Rules** tab.

### Step 3: Replace the Existing Rules

You will see an editor with some default rules. **Delete all the text** in that editor and **replace it with the rules below**.

This new ruleset specifically allows a user to perform admin actions **only if their own user document has an `isAdmin` field set to `true`**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      // CREATE: Any authenticated user can create their own document.
      allow create: if request.auth.uid == userId;

      // READ: A user can read their own document. An admin can read any user's document.
      allow get: if request.auth.uid == userId ||
                   (request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);

      // UPDATE: Only an admin can update a user's document (e.g., wallet balance).
      // Users are not allowed to change their own balance or admin status.
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;

      // DELETE: For security, no one can delete user documents from the app.
      // This must be done manually in the Firebase console.
      allow delete: if false;

      // LIST: Only an admin can get the list of all users for the User Management panel.
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### Step 4: Publish Your Changes

Click the **Publish** button above the editor. The changes might take a minute to take effect.

---

### **CRITICAL: The Final Check**

If you have already published the rules and you still see a "permission denied" error, the problem is **100% guaranteed** to be the `isAdmin` flag on your user account in the database.

This is the most common point of failure. Please check it very carefully.

1.  Go to your **Firebase Console**.
2.  Navigate to **Firestore Database** -> **Data** tab.
3.  In the `users` collection, find the document that has your admin user's UID. (You can find your UID in the **Authentication** tab).
4.  Look at the fields for that user. You **MUST** have a field that looks exactly like this:

    ```
    isAdmin: (boolean) true
    ```

5.  If the field is missing, you must add it.
    -   Click "**+ Add field**".
    -   Field name: `isAdmin`
    -   Type: `boolean`
    -   Value: `true`

6.  If the field exists but is wrong (e.g., it's a string `"true"`), you must delete it and re-add it with the correct `boolean` type.

Once you publish the rules AND confirm your admin user has the `isAdmin: true` boolean flag, the error will be resolved.
