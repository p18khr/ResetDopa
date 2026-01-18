# Google Play Store Update Checklist

## Before Each Release

### 1. Update Version Numbers in `app.json`
- [ ] Increment `version` (e.g., 1.0.0 → 1.0.1)
- [ ] Increment `android.versionCode` (e.g., 1 → 2)
  - ⚠️ **IMPORTANT**: versionCode must ALWAYS increase. Play Store rejects same or lower values.

**Example:**
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

### 2. Code Changes
- [ ] Make your feature updates/bug fixes
- [ ] Test the app locally
- [ ] Commit changes to git

### 3. Build New APK
```bash
cd c:\Users\prakh\OneDrive\Desktop\dopaReset1
eas build -p android
```
- [ ] Wait for build to complete (15-20 minutes)
- [ ] Verify build succeeded in EAS dashboard
- [ ] Download APK from EAS (save to backups folder)

### 4. Upload to Google Play Console
- [ ] Go to https://play.google.com/console
- [ ] Select ResetDopa app
- [ ] Click **Release** → **Production**
- [ ] Click **Create New Release**
- [ ] Upload the new APK
- [ ] Add release notes (describe changes)
- [ ] Click **Review Release**
- [ ] Click **Start Rollout to Production**

### 5. Monitor Review
- [ ] Wait for Google Play review (usually 1-2 hours)
- [ ] Check email for approval or rejection
- [ ] If rejected, fix issues and retry

---

## Version Numbering Guide

**Semantic Versioning Format**: `MAJOR.MINOR.PATCH`

| Change | Version Update | Example |
|--------|---|---------|
| Bug fixes, minor improvements | Patch | 1.0.0 → 1.0.1 |
| New features (backward compatible) | Minor | 1.0.0 → 1.1.0 |
| Major new version/breaking changes | Major | 1.0.0 → 2.0.0 |

---

## Important Notes

⚠️ **versionCode Rules:**
- Must be integer (1, 2, 3, not 1.1, 1.2)
- Must ALWAYS increase with each build
- Cannot go backwards

⚠️ **EAS Free Builds:**
- You have ~6 builds remaining from 30 free tier
- Plan updates wisely

⚠️ **After First Release:**
- Keep your signing keystore safe: `resetdopa.keystore`
- Use same keystore for all future releases
- If lost, you cannot update your app

---

## Quick Command Reference

**Build:**
```bash
eas build -p android
```

**View build status:**
```bash
eas build:list
```

**Download APK:**
Visit EAS dashboard → select build → download APK

---

## Release History

| Version | versionCode | Date | Changes |
|---------|---|---|---------|
| 1.0.0 | 1 | [TBD] | Initial release |
| | | | |

(Update this table after each release)
