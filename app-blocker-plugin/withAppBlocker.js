const {
  withAndroidManifest,
  withMainActivity,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo Config Plugin for App Blocker
 * Injects native Kotlin code and permissions during expo prebuild
 */
function withAppBlocker(config) {
  // Copy Kotlin source files
  config = withAppBlockerSources(config);
  
  // Add permissions to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    // Add permissions
    if (!config.modResults.manifest['uses-permission']) {
      config.modResults.manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.POST_NOTIFICATIONS',
    ];

    permissions.forEach((permission) => {
      const existingPermission = config.modResults.manifest[
        'uses-permission'
      ]?.find((p) => p.$['android:name'] === permission);

      if (!existingPermission) {
        config.modResults.manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add services and activities
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    if (!mainApplication.activity) {
      mainApplication.activity = [];
    }

    // Add AppMonitorService (Foreground Service)
    const monitorServiceExists = mainApplication.service.find(
      (s) =>
        s.$['android:name'] === 'com.dopareset.app.appblocker.AppMonitorService'
    );

    if (!monitorServiceExists) {
      mainApplication.service.push({
        $: {
          'android:name': 'com.dopareset.app.appblocker.AppMonitorService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
      });
    }

    // Add AccessibilityService
    const accessibilityServiceExists = mainApplication.service.find(
      (s) =>
        s.$['android:name'] ===
        'com.dopareset.app.appblocker.AppAccessibilityService'
    );

    if (!accessibilityServiceExists) {
      mainApplication.service.push({
        $: {
          'android:name':
            'com.dopareset.app.appblocker.AppAccessibilityService',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
    }

    // Add BlockOverlayActivity
    const overlayActivityExists = mainApplication.activity.find(
      (a) =>
        a.$['android:name'] ===
        'com.dopareset.app.appblocker.BlockOverlayActivity'
    );

    if (!overlayActivityExists) {
      mainApplication.activity.push({
        $: {
          'android:name': 'com.dopareset.app.appblocker.BlockOverlayActivity',
          'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
          'android:excludeFromRecents': 'true',
          'android:exported': 'false',
          'android:launchMode': 'singleInstance',
        },
      });
    }

    return config;
  });

  // Register the module package
  config = withMainActivity(config, async (config) => {
    const mainApplication = config.modResults;
    const packageImport = 'import com.dopareset.app.appblocker.AppBlockerPackage';
    const packageInstance = 'packages.add(AppBlockerPackage())';

    let contents = mainApplication.contents;

    // Add import if not exists
    if (!contents.includes(packageImport)) {
      const importPattern = /import com\.facebook\.react/;
      contents = contents.replace(
        importPattern,
        `${packageImport}\nimport com.facebook.react`
      );
    }

    // Add package to list (look for getPackages or similar)
    if (!contents.includes(packageInstance)) {
      // Try to find ReactNativeHost packages list
      const packagesPattern = /(override fun getPackages.*?ArrayList<ReactPackage>\(\)\.apply\s*\{)/s;
      if (packagesPattern.test(contents)) {
        contents = contents.replace(
          packagesPattern,
          `$1\n        ${packageInstance}`
        );
      }
    }

    mainApplication.contents = contents;
    return config;
  });

  return config;
}

/**
 * Copy Kotlin source files to android/app/src/main/java
 */
function withAppBlockerSources(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const pluginDir = path.join(__dirname, 'android', 'src', 'main');
      const androidProjectDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main'
      );

      // Copy Java/Kotlin sources
      const javaSourceDir = path.join(pluginDir, 'java');
      const javaDestDir = path.join(androidProjectDir, 'java');
      
      if (fs.existsSync(javaSourceDir)) {
        copyRecursive(javaSourceDir, javaDestDir);
      }

      // Copy resources (XML)
      const resSourceDir = path.join(pluginDir, 'res');
      const resDestDir = path.join(androidProjectDir, 'res');
      
      if (fs.existsSync(resSourceDir)) {
        copyRecursive(resSourceDir, resDestDir);
      }

      return config;
    },
  ]);
}

/**
 * Recursively copy directory
 */
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = withAppBlocker;
