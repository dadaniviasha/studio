
# How to Fix the "Missing or insufficient permissions" Error

You've encountered a common and important Firebase security feature! The error you're seeing is because your Firestore database has security rules that are currently preventing the "User Management" panel from loading the list of users.

This is not a bug in the app's code, but rather a configuration setting in your Firebase project that needs to be updated. Here's how to fix it by applying a more secure set of rules.

### Step 1: Go to Your Firebase Project

Open a new browser tab and navigate to the [Firebase Console](https://console.firebase.google.com/). Select the project that you are using for this application.

### Step 2: Navigate to Firestore Security Rules

1. In the left-hand menu, under the **Build** section, click on **Firestore Database**.
2. At the top of the Firestore page, click on the **Rules** tab.

### Step 3: Replace the Existing Rules

You will see an editor with some existing rules. **Delete all the text** in that editor and **replace it with the following ruleset**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if the user making the request is an admin
    function isRequestingUserAdmin() {
      // Checks the 'isAdmin' field on the requesting user's own document.
      // request.auth.uid is the unique ID of the currently logged-in user.
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    match /users/{userId} {
      // CREATE: Any authenticated user can create their own document.
      allow create: if request.auth.uid == userId;

      // READ: A user can read their own document. An admin can read any user's document.
      allow get: if request.auth.uid == userId || isRequestingUserAdmin();

      // UPDATE: Only an admin can update a user's document (e.g., wallet balance).
      // Users are not allowed to change their own balance or admin status.
      allow update: if isRequestingUserAdmin();

      // DELETE: For security, no one can delete user documents from the app.
      // This must be done manually in the Firebase console.
      allow delete: if false;

      // LIST: Only an admin can get the list of all users for the User Management panel.
      allow list: if isRequestingUserAdmin();
    }
  }
}
```

### Step 4: Publish Your Changes

Click the **Publish** button above the editor. The changes should take effect within a minute.

Once you have published these new rules, go back to your application and refresh the admin page. The error should be gone, and you should see the list of users.
    