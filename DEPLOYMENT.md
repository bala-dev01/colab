# Vercel Deployment Guide

## Step 1: Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

## Step 3: Deploy

From your project directory:

```bash
vercel --prod
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? (Choose your account)
- Link to existing project? **N**
- Project name? **ghost-canvas** (or press Enter for default)
- Directory? **./** (press Enter)
- Override settings? **N**

## Step 4: Set Environment Variables

After deployment, you need to add your Gemini API key:

```bash
vercel env add GEMINI_API_KEY
```

When prompted:
- Value: Paste your API key from `.env.local`
- Environment: Choose **Production**

Then redeploy:

```bash
vercel --prod
```

## Step 5: Test Your Deployment

Vercel will give you a URL like: `https://ghost-canvas.vercel.app`

Test it:
1. Open the URL on your laptop
2. Open the same URL on your phone
3. Add `?meetSessionId=test1` to both
4. Generate an image on one device → should appear on both!

## Step 6: Update Google Meet Manifest

Once deployed, update `public/meet-addon-manifest.json` with your Vercel URL.

---

## Troubleshooting

**If build fails:**
- Check that all dependencies are in `package.json`
- Make sure `.env.local` is NOT committed to git
- Check Vercel logs for specific errors

**If API key doesn't work:**
- Verify it's set: `vercel env ls`
- Make sure you redeployed after adding the env var
