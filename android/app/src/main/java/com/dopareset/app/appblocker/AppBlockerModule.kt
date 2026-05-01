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

    private val blockedApps = linkedSetOf<String>()
    private var isServiceRunning = false

    override fun getName(): String {
        return "AppBlocker"
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== setBlockedApps() called ===")
            blockedApps.clear()
            for (i in 0 until apps.size()) {
                val app = apps.getString(i)
                app?.let {
                    blockedApps.add(it)
                    android.util.Log.d("AppBlockerModule", "Added blocked app: $it")
                }
            }

            android.util.Log.d("AppBlockerModule", "Total blocked apps: ${blockedApps.size}")
            android.util.Log.d("AppBlockerModule", "All blocked apps: $blockedApps")

            val prefs = reactApplicationContext.getSharedPreferences(
                "AppBlockerPrefs",
                Context.MODE_PRIVATE
            )
            prefs.edit()
                .putStringSet("blocked_apps", blockedApps)
                .apply()

            android.util.Log.d("AppBlockerModule", "Saved to SharedPreferences ✓")

            if (blockedApps.isNotEmpty()) {
                android.util.Log.d("AppBlockerModule", "Starting monitoring service...")
                startMonitoringService()
            } else {
                android.util.Log.d("AppBlockerModule", "No blocked apps, stopping service...")
                stopMonitoringService()
            }

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putArray("apps", apps)
            }
            android.util.Log.d("AppBlockerModule", "setBlockedApps() completed successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in setBlockedApps: ${e.message}", e)
            promise.reject("SET_BLOCKED_APPS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== getBlockedApps() called ===")
            val prefs = reactApplicationContext.getSharedPreferences(
                "AppBlockerPrefs",
                Context.MODE_PRIVATE
            )
            val apps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
            android.util.Log.d("AppBlockerModule", "Retrieved ${apps.size} blocked apps from SharedPreferences: $apps")

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                val appArray = Arguments.createArray()
                apps.forEach { appArray.pushString(it) }
                putArray("apps", appArray)
            }
            android.util.Log.d("AppBlockerModule", "getBlockedApps() returning: $apps")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in getBlockedApps: ${e.message}", e)
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
                putBoolean("allGranted", hasUsageStats && hasOverlay && hasAccessibility)
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
    fun deductPointsForAppOpen(packageName: String, pointsToDeduct: Int, promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== deductPointsForAppOpen() called: $packageName, -$pointsToDeduct ===")
            // Send event to React to handle the actual transaction
            sendEvent(
                "AppBlockerTransaction",
                mapOf(
                    "type" to "app_blocker_open",
                    "packageName" to packageName,
                    "amount" to -pointsToDeduct,
                    "breakdown" to "-$pointsToDeduct points"
                ).toString()
            )
            android.util.Log.d("AppBlockerModule", "✓ Sent event to React for transaction")
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Transaction sent to React")
            })
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in deductPointsForAppOpen: ${e.message}", e)
            promise.reject("DEDUCT_POINTS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addPointsForResist(pointsToAdd: Int, promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== addPointsForResist() called: +$pointsToAdd ===")
            // Send event to React to handle the actual transaction
            sendEvent(
                "AppBlockerTransaction",
                mapOf(
                    "type" to "app_blocker_resist",
                    "amount" to pointsToAdd,
                    "breakdown" to "+$pointsToAdd points (resisted)"
                ).toString()
            )
            android.util.Log.d("AppBlockerModule", "✓ Sent event to React for +$pointsToAdd")
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Resist bonus sent to React")
            })
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in addPointsForResist: ${e.message}", e)
            promise.reject("ADD_POINTS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun syncBalanceAndStreak(balance: Double, hasStreak: Boolean, isVeteran: Boolean, promise: Promise) {
        try {
            val balanceInt = balance.toInt()
            android.util.Log.d("AppBlockerModule", "=== syncBalanceAndStreak() called: balance=$balanceInt, hasStreak=$hasStreak, isVeteran=$isVeteran ===")
            val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putInt("user_balance", balanceInt)
                .putBoolean("user_streak", hasStreak)
                .putBoolean("user_is_veteran", isVeteran)
                .putLong("balance_sync_time", System.currentTimeMillis())
                .putBoolean("balance_synced_once", true)
                .commit() // synchronous — overlay reads immediately after

            android.util.Log.d("AppBlockerModule", "✓ Balance, streak, and tier synced to native storage")
            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Balance and streak synced")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in syncBalanceAndStreak: ${e.message}", e)
            promise.reject("SYNC_BALANCE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getBalanceAndStreak(promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== getBalanceAndStreak() called ===")
            val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
            val balance = prefs.getInt("user_balance", 0)
            val hasStreak = prefs.getBoolean("user_streak", true)

            val result = Arguments.createMap().apply {
                putInt("balance", balance)
                putBoolean("hasStreak", hasStreak)
                putBoolean("success", true)
            }
            android.util.Log.d("AppBlockerModule", "✓ Retrieved balance=$balance, hasStreak=$hasStreak")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in getBalanceAndStreak: ${e.message}", e)
            promise.reject("GET_BALANCE_STREAK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkAppBlockerFlags(promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== checkAppBlockerFlags() called ===")
            val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)

            val result = Arguments.createMap().apply {
                putBoolean("resistPending", prefs.getBoolean("app_blocker_resist_ready", false))
                putBoolean("openPending", prefs.getBoolean("app_blocker_open_pending", false))
                putString("openPackage", prefs.getString("app_blocker_open_package", "") ?: "")
            }

            android.util.Log.d("AppBlockerModule", "✓ Flags: resistPending=${result.getBoolean("resistPending")}, openPending=${result.getBoolean("openPending")}")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in checkAppBlockerFlags: ${e.message}", e)
            promise.reject("CHECK_FLAGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearAppBlockerFlags(promise: Promise) {
        try {
            android.util.Log.d("AppBlockerModule", "=== clearAppBlockerFlags() called ===")
            val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putBoolean("app_blocker_resist_ready", false)
                .putBoolean("app_blocker_open_pending", false)
                .remove("app_blocker_open_package")
                .apply()

            android.util.Log.d("AppBlockerModule", "✓ Flags cleared")
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
            })
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "ERROR in clearAppBlockerFlags: ${e.message}", e)
            promise.reject("CLEAR_FLAGS_ERROR", e.message, e)
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
        return try {
            val enabledServices = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val target = "${reactApplicationContext.packageName}/${AppAccessibilityService::class.java.name}"
            enabledServices.split(":").any { it.equals(target, ignoreCase = true) }
        } catch (e: Exception) {
            false
        }
    }

    private fun startMonitoringService() {
        try {
            android.util.Log.d("AppBlockerModule", "=== startMonitoringService() ===")
            val intent = Intent(reactApplicationContext, AppMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.util.Log.d("AppBlockerModule", "Using startForegroundService (Android 8+)")
                reactApplicationContext.startForegroundService(intent)
            } else {
                android.util.Log.d("AppBlockerModule", "Using startService (Android 7-)")
                reactApplicationContext.startService(intent)
            }
            isServiceRunning = true
            android.util.Log.d("AppBlockerModule", "✓ Service start request sent")
        } catch (e: Exception) {
            android.util.Log.e("AppBlockerModule", "✗ ERROR starting service: ${e.message}", e)
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
