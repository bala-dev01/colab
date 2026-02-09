# Google Meet Add-on Setup Guide

## Prerequisites
- ✅ Deployed app: https://ghost-canvas.vercel.app
- ✅ Firebase configured
- ✅ Gemini API key set

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name: `Ghost Canvas Meet Add-on`
   - Click "Create"

2. **Note your Project Number**
   - Go to "Dashboard"
   - Copy the "Project number" (you'll need this for the manifest)

## Step 2: Enable Required APIs

1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - ✅ **Google Workspace Add-ons API**
   - ✅ **Google Meet API** (if available)

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose **"External"** (allows testing with any Google account)
3. Fill in App Information:
   - App name: `Ghost Canvas`
   - User support email: Your email
   - App logo: Upload `public/logo.png`
   - Developer contact: Your email
4. Click "Save and Continue"
5. **Scopes**: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/meetings.space.created`
   - Click "Update" → "Save and Continue"
6. **Test users**: Add your email and any judges/testers
7. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure:
   - Application type: **Web application**
   - Name: `Ghost Canvas Web Client`
   - Authorized JavaScript origins:
     - `https://ghost-canvas.vercel.app`
   - Authorized redirect URIs:
     - `https://ghost-canvas.vercel.app`
     - `https://ghost-canvas.vercel.app/auth/callback`
4. Click "Create"
5. **Save the Client ID** (you'll need it)

## Step 5: Update Manifest with Project Number

1. Open `public/meet-addon-manifest.json`
2. Add your project number:
   ```json
   {
     "name": "Ghost Canvas - AI Collaborative AR Workspace",
     "cloudProjectNumber": "YOUR_PROJECT_NUMBER_HERE"
   }
   ```
3. Deploy the update:
   ```bash
   vercel --prod
   ```

## Step 6: Test the Add-on

### Option A: Direct URL Testing
1. Start a Google Meet call
2. In the URL, add your add-on:
   - `https://meet.google.com/YOUR-MEET-CODE?addon=https://ghost-canvas.vercel.app`
3. Your app should load in the Meet interface!

### Option B: Workspace Marketplace (For Official Release)
1. Go to: https://console.cloud.google.com/marketplace
2. Click "Publish" → "Upload Add-on"
3. Upload your manifest JSON
4. Fill in marketplace listing:
   - Description
   - Screenshots
   - Demo video
5. Submit for review

## Step 7: Share with Testers

**For Hackathon Demo:**
- Share this URL with judges: `https://ghost-canvas.vercel.app/?meetSessionId=hackathon-demo`
- Or use the Meet URL parameter method above

**For Production:**
- Wait for Marketplace approval (1-2 weeks)
- Users can install from Google Workspace Marketplace

---

## Quick Commands

```bash
# Deploy updates
cd "H:\Gemini 3 Hackathon\ghost-canvas"
vercel --prod

# View deployment logs
vercel logs

# Check environment variables
vercel env ls
```

## Troubleshooting

**"Add-on not loading"**
- Check OAuth consent screen is configured
- Verify redirect URIs match exactly
- Check browser console for errors

**"Permission denied"**
- Add test users to OAuth consent screen
- Verify scopes are correct

**"Session not syncing"**
- Check Firebase rules allow read/write
- Verify all users use same `meetSessionId`
- Check browser console for Firebase errors

---

## For Hackathon Judges

**Demo URL:** `https://ghost-canvas.vercel.app/?meetSessionId=hackathon-demo`

**Features to showcase:**
1. Real-time collaboration across devices
2. AI image generation with Gemini
3. Hand tracking and gesture controls
4. Firebase sync (works across different networks)

**Test it:**
- Open the URL on multiple devices
- Generate an image on one device
- Watch it appear on all devices in real-time!
