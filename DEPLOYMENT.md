# Deployment Guide

## Environment Setup

### 1. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your actual Firebase credentials:
```env
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=dopareset.firebaseapp.com
FIREBASE_PROJECT_ID=dopareset
FIREBASE_STORAGE_BUCKET=dopareset.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PROJECT_ID=your_expo_project_id
```

### 3. Update firebase.js

Replace hardcoded values in `src/config/firebase.js`:
```javascript
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
  measurementId: Constants.expoConfig.extra.firebaseMeasurementId
};
```

### 4. Update app.json

Add extra config:
```json
"extra": {
  "firebaseApiKey": process.env.FIREBASE_API_KEY,
  "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN,
  "firebaseProjectId": process.env.FIREBASE_PROJECT_ID,
  "firebaseStorageBucket": process.env.FIREBASE_STORAGE_BUCKET,
  "firebaseMessagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
  "firebaseAppId": process.env.FIREBASE_APP_ID,
  "firebaseMeasurementId": process.env.FIREBASE_MEASUREMENT_ID,
  "eas": {
    "projectId": "your-project-id-here"
  }
}
```

## Firebase Configuration

### 1. Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### 2. Enable App Check

1. Go to Firebase Console → App Check
2. Click "Get Started"
3. Register your apps:
   - **iOS**: Use App Attest
   - **Android**: Use Play Integrity API
4. Enable enforcement mode

### 3. Configure Firebase Authentication

1. Go to Firebase Console → Authentication
2. Enable Email/Password provider
3. Set up authorized domains
4. Configure password policy (min 6 chars)

### 4. Set Firestore Indexes

Create indexes for efficient queries:
```bash
firebase deploy --only firestore:indexes
```

Create `firestore.indexes.json`:
```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

## Building for Production

### iOS Build

```bash
# Configure build
eas build:configure

# Create build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android Build

```bash
# Create build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### Create EAS Build Profiles

Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "FIREBASE_API_KEY": "from-secret"
      },
      "ios": {
        "bundleIdentifier": "com.dopareset.app",
        "buildNumber": "1.0.0"
      },
      "android": {
        "package": "com.dopareset.app",
        "versionCode": 1
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Monitoring Setup

### 1. Sentry Integration (Recommended)

```bash
npm install @sentry/react-native
npx sentry-wizard -i reactNative -p ios android
```

Update `App.js`:
```javascript
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "your-sentry-dsn",
  enableInExpoDevelopment: false,
  debug: false,
});
```

### 2. Firebase Crashlytics (Alternative)

```bash
npm install @react-native-firebase/crashlytics
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Firebase security rules deployed
- [ ] App Check enabled
- [ ] Crash reporting set up
- [ ] Privacy policy URL added to stores
- [ ] App icons and splash screens created
- [ ] Version numbers set correctly
- [ ] Build tested on real devices
- [ ] Signing certificates configured

## Rollout Strategy

### Phase 1: Soft Launch (Week 1)
- Release to 5% of users
- Monitor crash-free rate
- Watch Firestore costs
- Gather initial feedback

### Phase 2: Gradual Rollout (Week 2-3)
- Increase to 25% → 50% → 100%
- Monitor key metrics daily
- Fix critical bugs immediately

### Phase 3: Full Launch (Week 4)
- 100% rollout
- Marketing push
- Monitor scaling issues

## Scaling Plan

### At 500 Users
- Current architecture sufficient
- Stay on Firebase free tier
- Monitor quota usage

### At 1,000+ Users
- Upgrade to Blaze plan (~$5-10/month)
- Implement urge archiving
- Add database indexes

### At 5,000+ Users
- Consider Cloud Functions for heavy operations
- Implement Redis caching
- Optimize notification system
- Add CDN for assets

### At 10,000+ Users
- Architectural review needed
- Consider microservices
- Implement rate limiting
- Add load balancing

## Maintenance

### Weekly Tasks
- Review crash reports
- Monitor Firestore costs
- Check user feedback
- Update dependencies

### Monthly Tasks
- Security audit
- Performance review
- Feature planning
- Cost optimization

## Emergency Procedures

### Critical Bug Found
1. Pause rollout immediately
2. Deploy hotfix build
3. Submit urgent review to stores
4. Notify affected users

### Firestore Outage
1. App will work offline (cached data)
2. Enable offline persistence
3. Queue failed writes
4. Retry when connection restored

### Cost Spike
1. Check Firebase Console → Usage
2. Identify expensive operations
3. Add rate limiting
4. Optimize queries
5. Consider caching

## OAuth Setup (Google)

### Google Sign-In
1. Create OAuth client IDs in Google Cloud Console:
   - iOS client (bundle: com.dopareset.app)
   - Android client (package: com.dopareset.app)
2. In Firebase Console → Authentication → Sign-in method → enable Google.
3. Provide client IDs to the app via env vars (Expo public):
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

## Support

- Firebase Console: https://console.firebase.google.com
- EAS Dashboard: https://expo.dev
- Documentation: https://docs.expo.dev
