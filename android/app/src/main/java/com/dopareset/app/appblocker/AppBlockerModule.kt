package com.dopareset.app.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppBlockerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val blockedApps = mutableSetOf<String>()
    private var isServiceRunning = false

    override fun getName(): String {
        return "AppBlocker"
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        try {
            blockedApps.clear()
            for (i in 0 until apps.size()) {
                apps.getString(i)?.let { blockedApps.add(it) }
            }

            val prefs = reactApplicationContext.getSharedPreferences(
                "AppBlockerPrefs",
                Context.MODE_PRIVATE
            )
            prefs.edit()
                .putStringSet("blocked_apps", blockedApps)
                .apply()

            if (blockedApps.isNotEmpty()) {
                startMonitoringService()
            } else {
                stopMonitoringService()
            }

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putArray("apps", apps)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SET_BLOCKED_APPS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                "AppBlockerPrefs",
                Context.MODE_PRIVATE
            )
            val apps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                val appArray = Arguments.createArray()
                apps.forEach { appArray.pushString(it) }
                putArray("apps", appArray)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_BLOCKED_APPS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val hasUsageStats = hasUsageStatsPermission()
            val hasOverlay = hasOverlayPermission()
            val hasAccessibility = hasAccessibilityPermission()

            val result = Arguments.createMap().apply {
                putBoolean("usageStats", hasUsageStats)
                putBoolean("overlay", hasOverlay)
                putBoolean("accessibility", hasAccessibility)
                putBoolean("allGranted", hasUsageStats && hasOverlay)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSIONS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            sendEvent("AppBlockerError", "Failed to open usage stats settings: ${e.message}")
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${reactApplicationContext.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            sendEvent("AppBlockerError", "Failed to open overlay settings: ${e.message}")
        }
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            sendEvent("AppBlockerError", "Failed to open accessibility settings: ${e.message}")
        }
    }

    @ReactMethod
    fun stopMonitoring(promise: Promise) {
        try {
            stopMonitoringService()
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
            })
        } catch (e: Exception) {
            promise.reject("STOP_MONITORING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isMonitoring(promise: Promise) {
        try {
            promise.resolve(Arguments.createMap().apply {
                putBoolean("isMonitoring", isServiceRunning)
            })
        } catch (e: Exception) {
            promise.reject("IS_MONITORING_ERROR", e.message, e)
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        return try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
            mode == AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            false
        }
    }

    private fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactApplicationContext)
        } else {
            true
        }
    }

    private fun hasAccessibilityPermission(): Boolean {
        return false
    }

    private fun startMonitoringService() {
        try {
            val intent = Intent(reactApplicationContext, AppMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            isServiceRunning = true
        } catch (e: Exception) {
            sendEvent("AppBlockerError", "Failed to start monitoring service: ${e.message}")
        }
    }

    private fun stopMonitoringService() {
        try {
            val intent = Intent(reactApplicationContext, AppMonitorService::class.java)
            reactApplicationContext.stopService(intent)
            isServiceRunning = false
        } catch (e: Exception) {
            sendEvent("AppBlockerError", "Failed to stop monitoring service: ${e.message}")
        }
    }

    private fun sendEvent(eventName: String, message: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, message)
    }
}
