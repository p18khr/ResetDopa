# Settings Screen - Production Definition

## Overview
The Settings screen is a comprehensive user control panel for notifications, account management, appearance, and legal information. All features are production-ready.

---

## Screen Components

### 1. **Header Section**
- **Back Button**: Navigate back to previous screen
- **Title**: "Settings" (bold, 20px)
- **Spacing**: Safe area aware on top, left, right

---

### 2. **Notifications Section**

#### 2.1 Daily Reminders Toggle
- **Icon**: `notifications-outline` (Ionicons, Indigo #6366F1)
- **Title**: "Daily Reminders"
- **Subtitle**: "Get motivated every day at 9:00 AM"
- **Control**: Toggle Switch
  - On: Registers push notifications, schedules daily at 9:00 AM
  - Off: Cancels all notifications
  - Persists to AsyncStorage as `notificationsEnabled`
- **Status**: ✅ Production Ready
  - Auto-saves to AsyncStorage
  - Handles Expo Go limitations gracefully

#### 2.2 Send Test Notification Button
- **Type**: Outlined button with Indigo border
- **Icon**: `notifications` (filled)
- **Text**: "Send Test Notification"
- **Function**: 
  - Registers push notifications if not already registered
  - Sends milestone test notification (streak_7)
  - Shows success/error alert
  - Warns if running in Expo Go (limited functionality)
- **Status**: ✅ Production Ready

#### 2.3 Daily Mood Prompt Toggle
- **Icon**: `happy-outline` (Ionicons, Indigo #6366F1)
- **Title**: "Daily Mood Prompt"
- **Subtitle**: Dynamic - shows current mood time (e.g., "Ask for mood at 8:00 PM")
- **Control**: Toggle Switch
  - On: Registers push notifications, schedules daily mood prompt at selected time
  - Off: Cancels mood prompts
  - Persists: `moodEnabled` (boolean), `moodHour`, `moodMinute` (AsyncStorage)
- **Quick Time Selectors**: 
  - 3 preset buttons: 8:00 PM, 9:00 PM, 10:00 PM
  - Only visible when Mood Prompt is enabled
  - Tap to instantly change mood prompt time
- **Status**: ✅ Production Ready
  - Default: 8:00 PM (20:00)
  - 12-hour format display
  - Persists user preference

---

### 3. **Appearance Section**

#### 3.1 Theme Selector
- **Icon**: `sunny` (Ionicons, Indigo #6366F1)
- **Title**: "Theme"
- **Subtitle**: "Light mode" (static - dark mode coming)
- **Status**: ✅ Placeholder (future enhancement)
- **Note**: Theme toggle exists in ThemeContext but not fully exposed in Settings yet

---

### 4. **Account Section**

#### 4.1 User Email Display
- **Icon**: `mail-outline` (Gray #6B7280)
- **Display**: Shows logged-in user's email address
- **Type**: Read-only info card
- **Status**: ✅ Production Ready

#### 4.2 Edit Profile Button
- **Type**: Outlined button with blue border
- **Icon**: `person-outline` (Blue #4A90E2)
- **Text**: "Edit Profile"
- **Navigation**: Routes to Profile screen
- **Status**: ✅ Production Ready

#### 4.3 Program Start Information
- **Component**: Info card with two rows
  - **Row 1**: Calendar icon + "Program Start: [DATE]"
    - Displays user's program start date
    - Format: MM/DD/YYYY (localized)
    - Shows "Not set" if no start date
  - **Row 2**: Refresh icon + "Resets used: [X]/2"
    - Tracks how many times user has reset program day
    - Max 2 resets allowed
- **Status**: ✅ Production Ready

#### 4.4 Reset Program Day Button
- **Icon**: `refresh-outline` (Blue #4A90E2)
- **Title**: "Reset Program Day"
- **Subtitle**: "Set start date to today and recalculate day"
- **Control**: 
  - Button disabled if resets used >= 2 (shows gray #D1D5DB)
  - Tap shows confirmation alert
  - On confirm: Sets today as Day 1, increments reset counter
  - Updates current day calculation based on new start date
- **Status**: ✅ Production Ready

#### 4.5 Logout Button
- **Type**: Filled button (light red background #FEE2E2)
- **Icon**: `log-out-outline` (Red #EF4444)
- **Text**: "Logout" (Red #EF4444)
- **Behavior**:
  - Shows confirmation alert: "Are you sure you want to logout?"
  - On confirm: Clears `devDayOffset`, signs out from Firebase
  - Redirects to Login screen
  - Clears dev testing state
- **Status**: ✅ Production Ready

#### 4.6 Delete Account Button
- **Type**: Filled button (red background #DC2626)
- **Icon**: `trash-outline` (White)
- **Text**: "Delete Account" (White, bold)
- **Behavior**: Multi-confirmation flow
  1. **First Alert**: Shows warning with permanent consequences
     - Lists what will be deleted: progress, streaks, urges, badges, settings
     - Three options: Cancel, Keep Account, Delete Everything
  2. **Second Alert**: Final confirmation (text-based)
     - Requires user to confirm intent
     - Option to Cancel or Delete
  3. **Deletion Process**:
     - Deletes Firestore user document
     - Clears AsyncStorage
     - Deletes Firebase Auth user (last, to maintain session for feedback)
     - Shows success alert with navigation to Login
  4. **Error Handling**:
     - Handles `auth/requires-recent-login` (suggests logout & login again)
     - Handles `auth/network-request-failed` (network error message)
     - Shows generic error message for other failures
- **Status**: ✅ Production Ready - Robust error handling

---

### 5. **Testing Section** (Dev Only)

#### 5.1 TestingControls Component
- **Visibility**: Only shows when `__DEV__` is true
- **Contents**: Imported TestingControls component
- **Status**: ✅ Hidden in production builds

---

### 6. **Legal Section**

#### 6.1 Privacy Policy Link
- **Type**: Touchable card with icon and forward chevron
- **Icon**: `shield-checkmark-outline` (Blue #4A90E2)
- **Title**: "Privacy Policy"
- **Subtitle**: "Learn how we handle your data"
- **URL**: `https://resetdopa.com/privacy.html` (configurable via app.json extra)
- **Behavior**: Taps open link in native browser using WebBrowser.openBrowserAsync()
- **Status**: ✅ Production Ready - Links to live GitHub Pages site

#### 6.2 Terms of Service Link
- **Type**: Touchable card with icon and forward chevron
- **Icon**: `document-text-outline` (Blue #4A90E2)
- **Title**: "Terms of Service"
- **Subtitle**: "Understand your rights and obligations"
- **URL**: `https://resetdopa.com/terms.html` (configurable via app.json extra)
- **Behavior**: Taps open link in native browser using WebBrowser.openBrowserAsync()
- **Status**: ✅ Production Ready - Links to live GitHub Pages site

---

### 7. **Footer Section**

#### 7.1 App Info
- **App Name & Version**: "ResetDopa™ v1.0.0" (Gray text)
- **Tagline**: "Your journey to brain rewiring" (Light gray text)
- **Styling**: Centered, bottom margin (40px)
- **Status**: ✅ Production Ready

---

## State Management

### Local State (Component)
```javascript
const [notificationsEnabled, setNotificationsEnabled] = useState(false);
const [moodEnabled, setMoodEnabled] = useState(true);
const [moodHour, setMoodHour] = useState(20);
const [moodMinute, setMoodMinute] = useState(0);
```

### Persisted State (AsyncStorage)
- `notificationsEnabled` (boolean string)
- `moodEnabled` (boolean string)
- `moodHour` (number string)
- `moodMinute` (number string)
- `devDayOffset` (cleared on logout)

### Context State (AppContext)
- `user` (Firebase user object)
- `startDate` (program start date)
- `getCurrentDay()` (function)
- `startDateResets` (reset counter)
- `resetProgramStartDate()` (function)

---

## External Services Used

### Firebase Authentication
- `signOut()` - Logout user
- `deleteUser()` - Delete user account
- `auth.currentUser` - Get current user

### Firebase Firestore
- `deleteDoc()` - Delete user data document

### Notifications
- `registerForPushNotifications()` - Register device for push
- `scheduleDailyReminder()` - Schedule daily reminder
- `scheduleDailyMoodPrompt()` - Schedule mood prompt
- `cancelAllNotifications()` - Cancel all pending notifications
- `scheduleMilestoneNotification()` - Send test notification
- `isExpoGo()` - Check if running in Expo Go

### Web Browser
- `WebBrowser.openBrowserAsync()` - Open external links

### Async Storage
- Get/set notification preferences
- Clear storage on account deletion

---

## Styling

### Color Scheme
- **Primary**: Indigo #6366F1 (toggles, primary actions)
- **Secondary**: Blue #4A90E2 (secondary actions, links)
- **Background**: Light #F5F7FA (container), White #fff (cards)
- **Text Primary**: Dark gray #1A1A1A
- **Text Secondary**: Medium gray #6B7280
- **Text Tertiary**: Light gray #9CA3AF
- **Success**: Green (implicit, via notifications)
- **Warning/Destructive**: Red #EF4444 (logout), Red #DC2626 (delete)

### Layout
- Cards: 12px border-radius, subtle shadow, 16px padding
- Buttons: 12px border-radius, 16px padding, flex row alignment
- Spacing: 20px horizontal padding, 20px vertical sections
- Icons: 20px base size (18px in some contexts)

---

## Production Checklist

- [x] All components functional and tested
- [x] Error handling for all async operations
- [x] Alerts for user confirmations
- [x] AsyncStorage persistence working
- [x] Firebase integration complete
- [x] Notification system integrated
- [x] Legal links pointing to live site
- [x] Account deletion fully implemented
- [x] Testing section hidden in production
- [x] Accessibility considerations (labels, colors)
- [x] Version display accurate

---

## Known Limitations & Future Enhancements

| Item | Status | Notes |
|------|--------|-------|
| Dark Mode Toggle | Planned | Theme context exists, not exposed in Settings |
| Custom Notification Times | Planned | Currently limited to preset times |
| Notification Test Feedback | Current | Limited in Expo Go, works in production builds |
| Account Recovery | Not Implemented | No account recovery after deletion |
| Backup/Export Data | Not Implemented | Consider for future release |
| Notification History | Not Implemented | Users can't see past notifications |

---

## Production Deployment Notes

✅ **Fully Production Ready**

This Settings screen is complete and ready for Google Play Store deployment. All core functionality works:
- Notifications persist across app sessions
- Account management is secure
- Legal compliance links are active
- User data deletion is thorough
- All UI interactions are responsive

No changes needed before initial launch.

