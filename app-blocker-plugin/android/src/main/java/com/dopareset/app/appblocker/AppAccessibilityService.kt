package com.dopareset.app.appblocker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility Service fallback for app detection
 * Used when UsageStatsManager is unavailable or permission denied
 */
class AppAccessibilityService : AccessibilityService() {

    private var blockedApps = setOf<String>()
    private var lastBlockedApp: String? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        
        serviceInfo = info
        loadBlockedApps()
        
        android.util.Log.d("AppAccessibilityService", "Service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val packageName = event.packageName?.toString()
                
                if (packageName != null && blockedApps.contains(packageName)) {
                    // Debounce: only trigger if different from last blocked
                    if (packageName != lastBlockedApp) {
                        lastBlockedApp = packageName
                        blockApp(packageName)
                    }
                } else {
                    // Reset when returning to DopaReset
                    if (packageName == applicationContext.packageName) {
                        lastBlockedApp = null
                    }
                }
            }
        }
    }

    override fun onInterrupt() {
        android.util.Log.d("AppAccessibilityService", "Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        android.util.Log.d("AppAccessibilityService", "Service destroyed")
    }

    private fun loadBlockedApps() {
        val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
        blockedApps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
        android.util.Log.d("AppAccessibilityService", "Loaded ${blockedApps.size} blocked apps")
    }

    private fun blockApp(packageName: String) {
        try {
            android.util.Log.d("AppAccessibilityService", "Blocking app via accessibility: $packageName")
            
            val intent = Intent(this, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("blocked_package", packageName)
            }
            startActivity(intent)
        } catch (e: Exception) {
            android.util.Log.e("AppAccessibilityService", "Error blocking app", e)
        }
    }
}
