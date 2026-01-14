# Google OAuth "Access Blocked" Fix - Precise Steps

## CRITICAL: Do These Steps Exactly in This Order

### Step 1: Configure OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/consent
2. Select project "dopareset"
3. Click "EDIT APP" (or "CREATE CONSENT SCREEN" if not done)
4. Choose **User Type: External** (for testing)
5. Fill in:
   - **App name**: ResetDopa
   - **User support email**: your-email@gmail.com
   - **Developer contact info**: your-email@gmail.com
6. Click "SAVE AND CONTINUE"

### Step 2: Add Required Scopes
1. Click "ADD OR REMOVE SCOPES"
2. Search for and **select**:
   - `userinfo.profile` (for profile data)
   - `userinfo.email` (for email)
3. Click "UPDATE"
4. Click "SAVE AND CONTINUE"

### Step 3: Add Test Users
1. On "Test users" page, click "ADD USERS"
2. Add your Gmail account(s) that you want to test with
3. Click "SAVE AND CONTINUE"
4. Click "BACK TO DASHBOARD"

---

### Step 4: Verify iOS OAuth Client Configuration
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on the **iOS OAuth client**: `900804786470-2ibtanel6adftppg3j8c1i6tft6nm66p.apps.googleusercontent.com`
3. Verify these settings:
   - **Bundle ID**: `com.dopareset.app` ✓
   - **Team ID**: (should be filled in)
4. If using EAS Build, run this to get iOS team ID:
   ```bash
   eas credentials
   # Select iOS, view Apple Team ID
   ```
5. Add to OAuth client if missing
6. **Click "SAVE"**

---

### Step 5: Verify Android OAuth Client Configuration
1. Go back to Credentials
2. Click on the **Android OAuth client**: `900804786470-ovo5i0qq85j6af6tt4c8lqoo5qs3hobk.apps.googleusercontent.com`
3. Verify:
   - **Package name**: `com.dopareset.app` ✓
   - **SHA-1 certificate fingerprint**: Should be filled in
4. If SHA-1 is missing, get it:
   ```bash
   # If using EAS Build:
   eas credentials
   # Select Android, view SHA-1 fingerprint
   
   # OR manually with keystores:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Add to OAuth client if missing
6. **Click "SAVE"**

---

### Step 6: Code Fix - Add Explicit Scopes in auth.js
Replace the OAuth URL construction in `src/utils/auth.js`:

**OLD:**
```javascript
const result = await WebBrowser.openAuthSessionAsync(
  `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=id_token&` +
    `scope=${encodeURIComponent('profile email')}&` +
    `nonce=${Math.random().toString(36)}`,
  redirectUri
);
```

**NEW:**
```javascript
const result = await WebBrowser.openAuthSessionAsync(
  `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=id_token&` +
    `scope=${encodeURIComponent('openid profile email')}&` +
    `nonce=${Math.random().toString(36)}&` +
    `prompt=consent`,
  redirectUri
);
```

**Key changes:**
- Added `openid` to scopes
- Added `prompt=consent` to force consent screen (not cached credentials)

---

### Step 7: Update app.json Scheme (if needed for Android)
Your `app.json` should have:
```json
"scheme": "com.dopareset.app",
"android": {
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": {
        "scheme": "https",
        "host": "*.com.dopareset.app"
      },
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

---

## Testing Checklist

After these changes:

- [ ] You added yourself as a test user in OAuth Consent Screen
- [ ] iOS client has team ID
- [ ] Android client has SHA-1 fingerprint
- [ ] auth.js has `openid` in scopes
- [ ] auth.js has `prompt=consent`
- [ ] You cleared the app cache and reinstalled

**Test command:**
```bash
npm start
# On your phone: Click "Continue with Google"
# Select your test email
# Should proceed to Dashboard (no "access blocked")
```

---

## If Still Blocked: Troubleshooting

**Error: "This app isn't verified"**
- Your consent screen is set to External
- Add your email as test user
- Google shows warning but login should work

**Error: "Client mismatch"**
- Bundle ID in OAuth client doesn't match app.json
- Make sure both use: `com.dopareset.app`

**Error: "Redirect URI mismatch"**
- The redirect URI in auth.js must match OAuth client settings
- Your code uses: `useProxy: true` (handles redirect automatically)
- This is correct for Expo

**Still not working?**
1. Reinstall app: `npm start` → clear cache
2. Check console.log in auth.js to see exact error
3. Get clientId being used: `console.log('ClientID:', clientId)`
4. Verify it matches your OAuth client in Google Console
