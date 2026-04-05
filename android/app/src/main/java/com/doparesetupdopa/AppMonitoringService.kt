package com.doparesetupdopa

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityEvent
import android.content.Intent.ACTION_MAIN
import android.content.Intent.CATEGORY_LAUNCHER

/**
 * AppMonitoringService - Uses accessibility service to detect when blocked apps are launched
 * This sends an event back to React Native to show the VagusGatekeeper gate
 */
class AppMonitoringService : AccessibilityService() {

  private lateinit var sharedPref: SharedPreferences
  private var blockedApps = setOf<String>()

  override fun onServiceConnected() {
    super.onServiceConnected()

    sharedPref = getSharedPreferences("doparesetupdopa", Context.MODE_PRIVATE)
    updateBlockedApps()

    // Configure accessibility service
    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 100
    }
    setServiceInfo(info)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      val packageName = event.packageName?.toString() ?: return

      // Reload blocked apps from prefs
      updateBlockedApps()

      // Check if this app is blocked
      if (isAppBlocked(packageName)) {
        // Notify React Native to show VagusGatekeeper
        sendBlockedAppEvent(packageName)

        // Kill the app (if admin)
        if (AppBlockerReceiver.isAdminActive(this)) {
          killBlockedApp(packageName)
        }
      }
    }
  }

  override fun onInterrupt() {
    // Service interrupted
  }

  /**
   * Check if app package is in blocked list
   */
  private fun isAppBlocked(packageName: String): Boolean {
    // Ignore our own app and system apps
    if (packageName == "com.doparesetupdopa" || packageName.startsWith("android.")) {
      return false
    }

    return blockedApps.contains(packageName)
  }

  /**
   * Kill the blocked app
   */
  private fun killBlockedApp(packageName: String) {
    try {
      val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as? android.app.admin.DevicePolicyManager
      if (dpm != null && AppBlockerReceiver.isAdminActive(this)) {
        // Try to stop the app
        val packageManager = packageManager
        val intent = Intent(Intent.ACTION_MAIN)
        intent.addCategory(Intent.CATEGORY_HOME)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
        startActivity(intent)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Send event to React Native (via EventEmitter)
   */
  private fun sendBlockedAppEvent(packageName: String) {
    try {
      val intent = Intent("com.doparesetupdopa.BLOCKED_APP_LAUNCHED")
      intent.putExtra("packageName", packageName)
      sendBroadcast(intent)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Update blocked apps from SharedPreferences
   */
  private fun updateBlockedApps() {
    blockedApps = sharedPref.getStringSet("blockedApps", setOf()) ?: setOf()
  }
}
