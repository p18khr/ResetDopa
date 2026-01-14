# Security Best Practices

## Firebase Security Rules

### Current Rules
The `firestore.rules` file includes:
- Authentication requirement for all operations
- User data isolation (users can only access their own data)
- Email/createdAt immutability after creation
- Field validation

### Testing Rules

```bash
# Install Firebase emulator
npm install -g firebase-tools

# Initialize
firebase init emulators

# Start emulator
firebase emulators:start

# Run tests
npm test
```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

## Environment Variables

### Never Commit
- `.env` file (actual credentials)
- Firebase service account keys
- API keys
- Signing certificates

### Always Commit
- `.env.example` (template)
- `firestore.rules` (security rules)
- Public configuration

## Data Sanitization

### Current Implementation
All Firestore writes sanitize data:
```javascript
// Removes undefined, null, and array values
const sanitized = Object.entries(data)
  .filter(([_, v]) => v !== undefined && v !== null)
  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
```

### Why This Matters
- Prevents Firestore errors
- Avoids data corruption
- Reduces storage costs
- Improves query performance

## Authentication Best Practices

### Password Requirements
- Minimum 6 characters (Firebase requirement)
- Recommended: letters + numbers
- Maximum 128 characters
- Email validation with regex

### Rate Limiting
Firebase Auth automatically handles:
- Too many login attempts
- Too many password resets
- Suspicious activity

### Session Management
- Firebase handles token refresh automatically
- Sessions persist across app restarts
- Use `AsyncStorage` for React Native
- Use `browserLocalPersistence` for web

## API Key Security

### Firebase API Keys
Firebase API keys are **public** and safe to include in client code because:
- They identify the Firebase project
- Security is enforced by Firestore rules
- App Check provides additional protection

### But Still
- Use environment variables for organization
- Enable App Check for production
- Monitor unusual traffic patterns
- Set up Firebase quota alerts

## App Check

### What It Does
- Verifies requests come from your legitimate app
- Blocks requests from unauthorized sources
- Prevents abuse and quota theft

### Setup
1. Go to Firebase Console → App Check
2. Register your iOS app (App Attest)
3. Register your Android app (Play Integrity)
4. Enable enforcement mode after testing

## Data Privacy

### GDPR Compliance
If targeting EU users, implement:

1. **Data Export**
```javascript
const exportUserData = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return JSON.stringify(userDoc.data(), null, 2);
};
```

2. **Account Deletion**
```javascript
const deleteAccount = async () => {
  const user = auth.currentUser;
  await deleteDoc(doc(db, 'users', user.uid));
  await user.delete();
};
```

3. **Cookie Consent**
- Required for web version
- Show banner on first visit
- Store consent in localStorage

### Data Retention
Current policy:
- User data kept indefinitely while account active
- Implement archiving for data older than 90 days
- Soft delete for 30 days before permanent deletion

## Sensitive Data

### What We Store
- Email (hashed by Firebase Auth)
- Task completion data
- Urge logs (encrypted in transit)
- Daily mood entries

### What We DON'T Store
- Passwords (handled by Firebase Auth)
- Payment information (none required)
- Personal identifiable info beyond email
- Location data
- Device identifiers

## Network Security

### HTTPS Only
- Firebase enforces HTTPS for all API calls
- Expo enforces HTTPS for asset loading

### Certificate Pinning
Not required for Firebase (they handle it), but can add for extra security:
```javascript
// Only needed for additional API endpoints
```

## Code Security

### Prevent Code Injection
- Never use `eval()`
- Sanitize all user inputs
- Use TextInput validation
- Escape special characters

### Dependency Security
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Crash Reporting

### What to Log
- Error messages
- Stack traces
- User actions leading to crash
- Device info

### What NOT to Log
- Passwords
- API keys
- Personal data
- Email addresses

### Recommended Tools
- **Sentry**: Best for detailed error tracking
- **Firebase Crashlytics**: Good for basic crash data

## Monitoring & Alerts

### Set Up Alerts For
- Unusual spike in users
- Firestore quota approaching limit
- High error rates
- Slow query performance
- Authentication failures

### Firebase Alerts
1. Go to Firebase Console
2. Project Settings → Integrations
3. Enable Cloud Functions alerts
4. Set up budget alerts

## Backup Strategy

### Firestore Backups
```bash
# Export all data
gcloud firestore export gs://[BUCKET_NAME]

# Schedule automated backups
# Set up in Firebase Console → Firestore → Import/Export
```

### Backup Schedule
- Daily: Last 7 days
- Weekly: Last 4 weeks
- Monthly: Last 12 months

## Incident Response

### Security Breach Detected
1. Immediately revoke Firebase credentials
2. Force logout all users
3. Deploy security fix
4. Notify affected users within 72 hours (GDPR requirement)
5. Document incident

### Data Leak
1. Identify scope of leak
2. Patch vulnerability immediately
3. Reset affected user credentials
4. Notify users
5. Report to authorities if required

## Security Audit Checklist

### Monthly
- [ ] Review Firestore security rules
- [ ] Check for dependency vulnerabilities
- [ ] Review authentication logs
- [ ] Verify App Check is active
- [ ] Check for unusual access patterns

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review user permissions
- [ ] Update dependencies
- [ ] Review privacy policy

### Yearly
- [ ] Third-party security audit
- [ ] Compliance review
- [ ] Disaster recovery test
- [ ] Update security documentation

## Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Expo Security](https://docs.expo.dev/guides/security/)
