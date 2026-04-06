# 🚀 Artemis II Mission Control - Firebase Deployment Guide

## What's Been Set Up

Your Artemis II Mission Control app is ready for Firebase deployment. The following configuration files have been created:

### 1. **firebase.json** - Hosting Configuration
- Specifies the public directory as the project root
- Routes all requests to `artemis-mission-control_17.html`
- Ignores node_modules and temporary files

### 2. **.firebaserc** - Project Configuration
- Project ID: `artemisii`
- Firebase Console: https://console.firebase.google.com/project/artemisii

### 3. **Firebase CLI** - Already Installed Globally
- Firebase tools v2 is installed and ready

## Deployment Steps

### Step 1: Login to Firebase
```bash
firebase login
```
This will open your default browser to authenticate with your Google account that has access to the `artemisii` Firebase project.

### Step 2: Deploy
```bash
cd D:\artemis2
firebase deploy
```

### Step 3: Your Live App Will Be At:
```
https://artemisii.web.app
```

## Firebase Project Details

- **Project ID:** artemisii
- **Auth Domain:** artemisii.firebaseapp.com
- **Storage Bucket:** artemisii.firebasestorage.app
- **Messaging Sender ID:** 731491222913
- **App ID:** 1:731491222913:web:1b6791e3ca879c78bfd480

## After Deployment

Once deployed, you can:

1. **Monitor the app** in Firebase Console: https://console.firebase.google.com/project/artemisii
2. **View analytics** (if enabled)
3. **Manage hosting** and rollback to previous versions if needed

## Deployment Automation

To deploy automatically in the future, run:
```bash
firebase deploy
```

To view deployment history:
```bash
firebase hosting:versions:list
```

## Troubleshooting

If you encounter issues:
1. Ensure you're logged in: `firebase auth:import` or `firebase login`
2. Check project connection: `firebase projects:list`
3. Test locally first: `firebase serve` (if added)

---

**Ready to deploy?** Run: `firebase login && firebase deploy`
