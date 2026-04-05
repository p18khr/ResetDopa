package com.doparesetupdopa

import android.content.Context
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import com.facebook.react.bridge.*

/**
 * AppBlockerModule - React Native bridge to native app blocking
 * Simplified version focusing on core functionality
 */
class AppBlockerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var blockedApps = mutableSetOf<String>()
  private val context = reactContext

  override fun getName() = "AppBlocker"

  /**
   * Set list of blocked apps
   * Called from React Native whenever user toggles an app
   */
  @ReactMethod
  fun setBlockedApps(apps: ReadableArray, promise: Promise) {
    try {
      blockedApps.clear()

      for (i in 0 until apps.size()) {
        blockedApps.add(apps.getString(i))
      }

      // Save to SharedPreferences for persistence
      val sharedPref = context.getSharedPreferences("doparesetupdopa", Context.MODE_PRIVATE)
      sharedPref.edit().putStringSet("blockedApps", blockedApps).apply()

      promise.resolve(mapOf(
        "success" to true,
        "message" to "Blocked apps updated: ${blockedApps.size}",
        "apps" to blockedApps.toList()
      ))
    } catch (e: Exception) {
      promise.reject("setBlockedApps_error", e.message, e)
    }
  }

  /**
   * Get current blocked apps
   */
  @ReactMethod
  fun getBlockedApps(promise: Promise) {
    try {
      promise.resolve(mapOf(
        "success" to true,
        "apps" to blockedApps.toList(),
        "count" to blockedApps.size
      ))
    } catch (e: Exception) {
      promise.reject("getBlockedApps_error", e.message, e)
    }
  }

  /**
   * Check if admin permission is granted
   */
  @ReactMethod
  fun isAdminActive(promise: Promise) {
    try {
      val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
      val componentName = ComponentName(context, AppBlockerReceiver::class.java)
      val isAdmin = dpm.isAdminActive(componentName)

      promise.resolve(mapOf(
        "success" to true,
        "isAdmin" to isAdmin
      ))
    } catch (e: Exception) {
      promise.reject("isAdminActive_error", e.message, e)
    }
  }

  /**
   * Request admin permissions (stub for now)
   */
  @ReactMethod
  fun requestAdminPermission() {
    // This will be triggered by the AccessibilityService or DeviceAdminReceiver
  }

  /**
   * Stop monitoring apps
   */
  @ReactMethod
  fun stopMonitoring(promise: Promise) {
    try {
      blockedApps.clear()
      promise.resolve(mapOf("success" to true))
    } catch (e: Exception) {
      promise.reject("stopMonitoring_error", e.message, e)
    }
  }
}

