package com.dopareset.app.appblocker

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import java.util.*

/**
 * Monitors app usage using UsageStatsManager
 * Primary detection method for foreground app
 */
class AppUsageMonitor(private val context: Context) {

    private val usageStatsManager: UsageStatsManager? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        } else {
            null
        }
    }

    /**
     * Get the currently running foreground app package name
     * Returns null if unable to determine or no permission
     */
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    fun getForegroundApp(): String? {
        if (usageStatsManager == null) return null

        return try {
            val currentTime = System.currentTimeMillis()
            // Query usage stats for last 1 second
            val stats = usageStatsManager?.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                currentTime - 1000,
                currentTime
            )

            if (stats.isNullOrEmpty()) {
                return null
            }

            // Find the most recently used app
            val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
            val mostRecent = sortedStats.firstOrNull()

            // Additional check: make sure it was very recently used (within last 500ms)
            if (mostRecent != null && (currentTime - mostRecent.lastTimeUsed) < 500) {
                mostRecent.packageName
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("AppUsageMonitor", "Error getting foreground app", e)
            null
        }
    }

    /**
     * Check if a specific package is currently in foreground
     */
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    fun isAppInForeground(packageName: String): Boolean {
        val foregroundApp = getForegroundApp()
        return foregroundApp == packageName
    }

    /**
     * Check if permission is granted
     */
    fun hasPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return false
        }

        return try {
            val currentTime = System.currentTimeMillis()
            val stats = usageStatsManager?.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                currentTime - 1000,
                currentTime
            )
            // If we can query stats, permission is granted
            !stats.isNullOrEmpty() || stats != null
        } catch (e: Exception) {
            false
        }
    }
}
