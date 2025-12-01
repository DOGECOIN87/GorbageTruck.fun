# Firebase Setup Guide for GorbageTruck.fun

This document outlines the necessary steps to configure Firebase and x.com (Twitter) authentication for the GorbageTruck.fun game.

## Prerequisites

- A Firebase project (already created)
- An x.com (Twitter) Developer Account with API access
- Admin access to the Firebase Console

## Step 1: Configure x.com (Twitter) Developer App

1. Go to [x.com Developer Portal](https://developer.x.com/)
2. Create a new project and app (or use an existing one)
3. In the app settings, enable **"Sign in with X"** (OAuth 2.0)
4. Set the following callback URL:
   ```
   https://<YOUR-FIREBASE-PROJECT-ID>.firebaseapp.com/__/auth/handler
   ```
   Replace `<YOUR-FIREBASE-PROJECT-ID>` with your actual Firebase project ID.

5. Note down your **API Key** and **API Secret** from the app settings.

## Step 2: Enable Twitter Authentication in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Twitter** and enable it
5. Paste your **API Key** and **API Secret** from Step 1
6. Save the configuration

## Step 3: Deploy Firestore Security Rules

1. In the Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the default rules with the following security rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write to the 'leaderboard' collection
    match /leaderboard/{userId} {
      // Allow read access to all for the public leaderboard
      allow read: if true; 
      
      // Allow write access only if:
      // 1. The user is authenticated (request.auth != null).
      // 2. The document ID being written to matches the user's ID (userId == request.auth.uid).
      // 3. The new score is greater than the existing score (to prevent score lowering).
      allow write: if request.auth != null 
                     && userId == request.auth.uid
                     && (resource == null || request.resource.data.score > resource.data.score);
    }
  }
}
```

3. Click **Publish** to deploy the rules.

## Step 4: Create Firestore Collection (Optional)

The `leaderboard` collection will be created automatically when the first score is saved. However, you can manually create it:

1. In Firestore Database, click **Create collection**
2. Name it `leaderboard`
3. Add a test document with the following structure:
   ```json
   {
     "userId": "test-user-id",
     "username": "Test User",
     "email": "test@example.com",
     "score": 1000,
     "timestamp": 1234567890
   }
   ```

## Step 5: Verify the Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open the game in your browser
3. Click the "Sign in with X" button
4. Authorize the app with your x.com account
5. Play the game and verify that your score is saved to Firestore
6. Check the Firestore Database console to see the saved score

## Troubleshooting

### Issue: "Sign in with X" button doesn't work
- **Solution**: Ensure that the Twitter provider is enabled in Firebase Authentication
- **Solution**: Verify that the callback URL matches your Firebase project ID

### Issue: Scores are not being saved
- **Solution**: Check the Firestore security rules. Ensure they allow authenticated users to write to the `leaderboard` collection
- **Solution**: Open the browser console and check for any error messages

### Issue: Leaderboard shows no scores
- **Solution**: Ensure that at least one user has played and saved a score
- **Solution**: Check the Firestore Database to see if the `leaderboard` collection exists and contains documents

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [x.com OAuth 2.0 Documentation](https://developer.x.com/en/docs/authentication/oauth-2-0)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
