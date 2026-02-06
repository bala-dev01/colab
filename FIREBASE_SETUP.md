# Firebase Setup Instructions

## Step 1: Create Firebase Project (FREE)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "ghost-canvas" (or anything you like)
4. Disable Google Analytics (not needed for hackathon)
5. Click "Create Project"

## Step 2: Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **TEST MODE** (allows read/write without auth - perfect for hackathon)
5. Click "Enable"

## Step 3: Get Your Config

1. Click the gear icon ⚙️ > "Project Settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app (name: "Ghost Canvas")
5. **Copy the `firebaseConfig` object**

## Step 4: Add Config to Your Code

1. Open `src/lib/firebase-sync.ts`
2. Replace the `firebaseConfig` object with yours:

```typescript
const firebaseConfig = {
    apiKey: "AIza...",  // Your actual values here
    authDomain: "ghost-canvas-xxxxx.firebaseapp.com",
    databaseURL: "https://ghost-canvas-xxxxx.firebaseio.com",
    projectId: "ghost-canvas-xxxxx",
    storageBucket: "ghost-canvas-xxxxx.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
}
```

## Step 5: Test It!

Once configured, refresh your app and test with:
- **Different browsers** (Chrome + Firefox)
- **Different devices** (laptop + phone)
- **Different networks** (WiFi + mobile hotspot)

All should sync in real-time! 🚀

---

## Free Tier Limits

Firebase Realtime Database free tier includes:
- ✅ 1 GB stored data
- ✅ 10 GB/month downloaded
- ✅ 100 simultaneous connections

**Perfect for hackathons and demos!**
