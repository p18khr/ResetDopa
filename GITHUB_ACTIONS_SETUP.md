# GitHub Actions Build Setup

## Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ResetDopa app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/resetdopa.git
   git push -u origin main
   ```

2. **Add EAS Token to GitHub Secrets**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EAS_PROJECT_ID`
   - Value: `125af98b-699c-4bfe-8b77-0b0d78c914c0`

3. **Trigger Build**
   - Go to repo → Actions → "Build Android APK" → Run workflow
   - Wait 20 minutes for build to complete
   - Download APK from artifacts

That's it! The workflow will:
- Use your gradle-wrapper.properties (Gradle 8.1.3)
- Build on Ubuntu (not EAS cloud)
- Output ready APK for Play Store upload

Done ✅
