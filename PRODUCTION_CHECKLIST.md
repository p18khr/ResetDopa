# Production Launch Checklist

## 🔴 Critical (Must Complete Before Launch)

### Security & Configuration
- [ ] **Move Firebase credentials to environment variables**
  - Create `.env` file from `.env.example`
  - Remove hardcoded credentials from `firebase.js`
  - Test that app works with env vars
  
- [ ] **Deploy Firestore Security Rules**
  - Copy `firestore.rules` to Firebase Console
  - Test rules with Firebase Emulator
  - Verify unauthorized access is blocked
  
- [ ] **Enable Firebase App Check**
  - Go to Firebase Console → App Check
  - Register iOS and Android apps
  - Enable enforcement mode

### App Store Assets
- [ ] **Create app icon** (1024x1024px)
  - Place at `assets/icon.png`
  - Create adaptive icon for Android at `assets/adaptive-icon.png`
  
- [ ] **Create splash screen** (1242x2436px)
  - Place at `assets/splash.png`
  
- [ ] **Create notification icon** (96x96px, white with transparency)
  - Place at `assets/notification-icon.png`

- [ ] **Add favicon** (for web version)
  - Place at `assets/favicon.png`

### Legal & Compliance
- [ ] **Create Privacy Policy**
  - Include data collection practices
  - Mention Firebase/Google services
  - Add cookie policy if using web
  - Host publicly and add URL to `app.json`
  
- [ ] **Create Terms of Service**
  - Define acceptable use
  - Liability disclaimers
  - Account termination policy
  - Host publicly
  
- [ ] **Add GDPR compliance** (if targeting EU)
  - User data export functionality
  - Account deletion flow
  - Cookie consent banner

### Monitoring & Analytics
- [ ] **Set up crash reporting**
  ```bash
  npm install @sentry/react-native
  # OR
  npm install @react-native-firebase/crashlytics
  ```
  - Initialize in `App.js`
  - Test crash reporting works
  
- [ ] **Enable Firebase Analytics**
  - Already included, just verify events tracking
  - Set up custom events for key actions
  
- [ ] **Set up monitoring dashboard**
  - Firebase Console → Analytics
  - Set up conversion funnels
  - Monitor DAU/MAU metrics

### Testing
- [ ] **Test on real iOS device**
  - Test all screens and flows
  - Verify notifications work
  - Test offline mode
  
- [ ] **Test on real Android device**
  - Test all screens and flows
  - Verify notifications work
  - Test offline mode
  
- [ ] **Test edge cases**
  - Poor/no internet connection
  - Low storage scenarios
  - Background/foreground transitions
  - Rapid screen switching
  
- [ ] **Load testing**
  - Create test accounts
  - Simulate 30 days of data
  - Verify performance

---

## 🟡 Important (Should Complete Before Launch)

### Performance
- [ ] **Enable Firestore offline persistence**
  - Add `enableIndexedDbPersistence()` for web
  - Configure offline settings
  
- [ ] **Optimize bundle size**
  - Run `npx expo-optimize`
  - Remove unused dependencies
  
- [ ] **Add loading states**
  - Show spinners during async operations
  - Add skeleton screens for data loading

### User Experience
- [ ] **Add onboarding tutorial**
  - Already partially implemented
  - Test first-time user experience
  
- [ ] **Implement data archiving**
  - Archive urges older than 90 days
  - Create background cleanup task
  
- [ ] **Add error boundaries**
  - Catch React errors gracefully
  - Show friendly error messages

### DevOps
- [ ] **Set up CI/CD pipeline**
  - GitHub Actions or similar
  - Automated testing
  - Automated builds
  
- [ ] **Configure EAS Build**
  ```bash
  npm install -g eas-cli
  eas login
  eas build:configure
  ```
  
- [ ] **Set up staging environment**
  - Separate Firebase project for testing
  - Test builds before production

---

## 🟢 Nice to Have (Post-Launch)

### Features
- [ ] Social sharing of achievements
- [ ] Backup/restore functionality
- [ ] Dark mode support
- [ ] Multiple language support
- [ ] Widget support (iOS 14+, Android)

### Analytics
- [ ] A/B testing framework
- [ ] User feedback system
- [ ] In-app surveys
- [ ] Conversion tracking

### Marketing
- [ ] App Store screenshots
- [ ] App Store description
- [ ] Demo video
- [ ] Landing page

---

## Pre-Launch Commands

```bash
# 1. Install production dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env with your actual values

# 3. Test build locally
npm start

# 4. Build for production
eas build --platform all

# 5. Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Launch Day Checklist

- [ ] Monitor Firebase Console for errors
- [ ] Watch Firestore quota usage
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Prepare hotfix pipeline
- [ ] Have rollback plan ready
- [ ] Monitor server costs

---

## Week 1 Post-Launch

- [ ] Analyze user retention (Day 1, 3, 7)
- [ ] Review crash-free rate (target: >99%)
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Plan first update
- [ ] Scale Firestore if needed
