package com.doparesetupdopa

import android.content.Context
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.content.Intent
import android.app.admin.DevicePolicyManager
import android.app.admin.DeviceAdminReceiver
import android.content.ComponentName
import com.facebook.react.bridge.*

/**
 * AppBlockerModule - React Native bridge to native app blocking
 */
class AppBlockerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var blockedApps = mutableSetOf<String>()
  private val context = reactContext
  private var isBroadcastRegistered = false

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

      // Start monitoring if not already
      if (!isBroadcastRegistered && blockedApps.isNotEmpty()) {
        startMonitoring()
      }

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
   * Stop monitoring apps
   */
  @ReactMethod
  fun stopMonitoring(promise: Promise) {
    try {
      blockedApps.clear()

      if (isBroadcastRegistered) {
        context.unregisterReceiver(appBlockerReceiver)
        isBroadcastRegistered = false
      }

      promise.resolve(mapOf("success" to true))
    } catch (e: Exception) {
      promise.reject("stopMonitoring_error", e.message, e)
    }
  }

  /**
   * Start monitoring app launches
   */
  private fun startMonitoring() {
    try {
      val intentFilter = IntentFilter()
      intentFilter.addAction(Intent.ACTION_PACKAGE_FULLY_REMOVED)
      intentFilter.addAction("com.doparesetupdopa.BLOCK_APP_LAUNCH")

      context.registerReceiver(appBlockerReceiver, intentFilter)
      isBroadcastRegistered = true
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Broadcast receiver for app launch interception
   */
  private val appBlockerReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      // This will be used by AppBlockerReceiver device admin
      // to handle blocked app launches
    }
  }
}
