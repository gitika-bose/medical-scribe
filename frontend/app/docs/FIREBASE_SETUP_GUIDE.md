# Firebase Configuration Guide

## How to Find Your Firebase Config

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com/
2. Select your project: **patient-scribe-app** (or your project name)

### Step 2: Get Web App Configuration
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app yet:
   - Click **Add app** button
   - Select the **Web** icon (`</>`)
   - Give it a nickname (e.g., "Medical Scribe Web")
   - Click **Register app**
5. You'll see your Firebase configuration object

### Step 3: Copy Configuration
You should see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "patient-scribe-app.firebaseapp.com",
  projectId: "patient-scribe-app",
  storageBucket: "patient-scribe-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Enable Google Sign-In (if not already enabled)
1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Sign-in method** tab
3. Find **Google** in the list
4. Click on it and toggle **Enable**
5. Add your support email
6. Click **Save**

## What to Do Next

Once you have the config, create a file:
**`frontend/.env.local`** with this content:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the values with your actual Firebase config values.

## Security Note
- ✅ The `.env.local` file is already in `.gitignore`
- ✅ Never commit Firebase keys to git
- ✅ These are safe to use in frontend (they're meant to be public)
- ✅ Security is enforced by Firebase Security Rules

## Need Help?
If you can't find the config, share your Firebase project name and I can guide you through the specific steps!
