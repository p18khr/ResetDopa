# Legal Acceptance Implementation

## Overview
Implemented a Terms & Conditions / Privacy Policy acceptance flow that appears after users sign up or log in. This is a **critical requirement** for app store compliance (both Apple App Store and Google Play Store).

## Implementation Details

### 1. **LegalAcceptanceModal Component** (`src/components/LegalAcceptanceModal.js`)
- **Scroll-to-Accept Pattern**: Users must scroll to the bottom of the key points before the Accept button is enabled
- **External Links**: Opens full Privacy Policy and Terms of Service documents in browser
- **Key Points Summary**: Shows important highlights from both documents
- **Modal Overlay**: Fullscreen modal that blocks app usage until terms are accepted or declined
- **Decline Action**: Signs user out if they decline the terms

**Features:**
- ✅ Prevents "blind acceptance" by requiring scrolling
- ✅ Provides links to full legal documents
- ✅ Clear accept/decline actions
- ✅ User-friendly design with proper styling

### 2. **Context State Management** (`src/context/AppContext.js`)

Added tracking for legal acceptance:

```javascript
const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
```

**Functions:**
- `acceptTerms()`: Updates state and saves acceptance to Firestore with timestamp
- Loads `hasAcceptedTerms` from Firestore in `loadUserData()`
- Exports `hasAcceptedTerms` and `acceptTerms` for use throughout the app

**Firestore Fields:**
- `hasAcceptedTerms`: boolean - Whether user has accepted
- `termsAcceptedAt`: ISO string - Timestamp of acceptance

### 3. **App Integration** (`App.js`)

Created `LegalAcceptanceLayer` component that:
- Shows modal when `user` exists AND `hasAcceptedTerms === false`
- **Accept**: Calls `acceptTerms()` to save acceptance
- **Decline**: Signs user out with Firebase `signOut(auth)`
- Rendered as a layer above all screens in the navigation

### 4. **User Creation** (`src/screens/Signup.js`)

Updated initial user document to include:
```javascript
hasAcceptedTerms: false // Will be set to true after modal acceptance
```

This ensures new users see the legal acceptance modal on first login.

### 5. **Legal Document Hosting**

Documents are hosted on GitHub Pages:
- **Privacy Policy**: https://resetdopa.com/privacy
- **Terms of Service**: https://resetdopa.com/terms

URLs are configured in `app.json`:
```json
"extra": {
  "privacyPolicyUrl": "https://resetdopa.com/privacy",
  "termsUrl": "https://resetdopa.com/terms"
}
```

## User Flow

### For New Users (Signup):
1. User signs up with email/password
2. Account created with `hasAcceptedTerms: false`
3. User is logged in automatically
4. Legal acceptance modal appears immediately
5. User must scroll through key points
6. User clicks "Accept" → saved to Firestore → can use app
7. OR User clicks "Decline" → logged out

### For Existing Users (Login):
1. User logs in with credentials
2. App loads `hasAcceptedTerms` from Firestore
3. If `false` → modal appears
4. If `true` → user proceeds to app normally

### Persistence:
- Once accepted, `hasAcceptedTerms` is saved to Firestore
- User never sees the modal again (unless you manually reset the field)
- Acceptance timestamp stored in `termsAcceptedAt`

## App Store Compliance

This implementation satisfies requirements for:
- ✅ **Apple App Store**: Explicit consent before data collection
- ✅ **Google Play Store**: Clear disclosure and acceptance of terms
- ✅ **GDPR**: Documented consent with timestamp
- ✅ **CCPA**: Clear privacy notice and opt-out (decline)

## Testing Checklist

Before launch, test these scenarios:

- [ ] **New signup flow**: Sign up → see modal → accept → access app
- [ ] **New signup decline**: Sign up → decline → logged out
- [ ] **Scroll requirement**: Cannot click Accept until scrolled to bottom
- [ ] **Links work**: Privacy Policy and Terms links open in browser
- [ ] **Existing users**: Users who already accepted don't see modal
- [ ] **Persistence**: After accepting, modal doesn't show again after logout/login
- [ ] **Firestore update**: Check that `hasAcceptedTerms` and `termsAcceptedAt` are saved

## Manual Testing Commands

To test the modal with an existing user:

```javascript
// In Firebase Console → Firestore → users → [user-id]
// Set: hasAcceptedTerms = false (or delete the field)
// Then log in to see the modal again
```

## Future Enhancements (Optional)

- [ ] Version tracking (e.g., `termsVersion: '1.0'`) if you update terms in future
- [ ] Re-prompt users if terms are updated significantly
- [ ] Analytics event when users decline terms
- [ ] A/B test different modal designs
- [ ] Add accessibility labels for screen readers

## Files Modified/Created

**Created:**
- `src/components/LegalAcceptanceModal.js` - Modal component
- `LEGAL_ACCEPTANCE_IMPLEMENTATION.md` - This document

**Modified:**
- `App.js` - Added LegalAcceptanceLayer
- `src/context/AppContext.js` - Added hasAcceptedTerms state and acceptTerms function
- `src/screens/Signup.js` - Initialize hasAcceptedTerms: false for new users

## Notes

- Modal is **blocking** - users cannot access app without accepting
- This is intentional and required for legal compliance
- If user declines, they are logged out (standard practice)
- Legal documents are hosted externally (GitHub Pages) for easy updates
- In-app links in Settings allow users to review terms anytime

## Support

For questions or issues with this implementation:
1. Check that Firebase is properly configured
2. Verify GitHub Pages URLs are accessible
3. Test with a fresh user account
4. Check Firestore rules allow writing to `hasAcceptedTerms` field
