package com.dopareset.app.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.dopareset.app.R

/**
 * Foreground service that monitors app usage
 * Checks every 500ms if a blocked app is in foreground
 */
class AppMonitorService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageMonitor: AppUsageMonitor
    private var blockedApps = setOf<String>()
    private var isMonitoring = false
    private var lastBlockedApp: String? = null
    private var temporarilyAllowedApps = mutableSetOf<String>()  // Apps allowed for this session

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "app_blocker_channel"
        private const val CHECK_INTERVAL = 500L // 500ms
    }

    private val monitoringRunnable = object : Runnable {
        override fun run() {
            if (isMonitoring) {
                checkForegroundApp()
                handler.postDelayed(this, CHECK_INTERVAL)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        android.util.Log.d("AppMonitorService", "=== onCreate() SERVICE CREATED ===")
        try {
            usageMonitor = AppUsageMonitor(this)
            android.util.Log.d("AppMonitorService", "AppUsageMonitor initialized ✓")

            loadBlockedApps()
            android.util.Log.d("AppMonitorService", "Blocked apps loaded ✓")

            createNotificationChannel()
            android.util.Log.d("AppMonitorService", "Notification channel created ✓")

            android.util.Log.d("AppMonitorService", "onCreate() completed successfully")
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "✗✗✗ CRITICAL ERROR IN onCreate(): ${e.message}", e)
            e.printStackTrace()
            throw e  // Re-throw so Android knows service failed
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        android.util.Log.d("AppMonitorService", "=== onStartCommand() called [startId: $startId] ===")

        // Check if this is a reset signal from BlockOverlayActivity
        if (intent?.getBooleanExtra("reset_blocked_app", false) == true) {
            android.util.Log.d("AppMonitorService", "Reset signal received from overlay - resetting lastBlockedApp")
            lastBlockedApp = null
            android.util.Log.d("AppMonitorService", "✓ lastBlockedApp reset to null")
            return START_STICKY
        }

        // Check if this is a temporarily allow app signal
        val allowTemporarilyApp = intent?.getStringExtra("allow_temporarily_app")
        if (allowTemporarilyApp != null) {
            android.util.Log.d("AppMonitorService", "Allow temporarily signal received for: $allowTemporarilyApp")
            temporarilyAllowedApps.add(allowTemporarilyApp)
            android.util.Log.d("AppMonitorService", "✓ Added $allowTemporarilyApp to temporary allow list (session)")
            return START_STICKY
        }

        try {
            // Start as foreground service
            val notification = createNotification()
            android.util.Log.d("AppMonitorService", "Notification created, calling startForeground()...")
            startForeground(NOTIFICATION_ID, notification)
            android.util.Log.d("AppMonitorService", "Foreground notification started ✓")

            // Start monitoring
            android.util.Log.d("AppMonitorService", "Calling startMonitoring()...")
            startMonitoring()
            android.util.Log.d("AppMonitorService", "onStartCommand() completed successfully ✓")
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "✗✗✗ CRITICAL ERROR IN onStartCommand: ${e.message}", e)
            e.printStackTrace()
            stopSelf()
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopMonitoring()
    }

    private fun startMonitoring() {
        if (!isMonitoring) {
            android.util.Log.d("AppMonitorService", "== startMonitoring() ==")
            isMonitoring = true
            handler.post(monitoringRunnable)
            android.util.Log.d("AppMonitorService", "✓ Monitoring loop started (500ms interval)")
        } else {
            android.util.Log.d("AppMonitorService", "Already monitoring, skipping")
        }
    }

    private fun stopMonitoring() {
        isMonitoring = false
        handler.removeCallbacks(monitoringRunnable)
        android.util.Log.d("AppMonitorService", "Monitoring stopped")
    }

    private fun checkForegroundApp() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return

        try {
            // Reload blockedApps from SharedPreferences every check (in case React updated them)
            loadBlockedApps()
            android.util.Log.d("AppMonitorService", "--- checkForegroundApp() [${System.currentTimeMillis()}] ---")
            android.util.Log.d("AppMonitorService", "Current blockedApps list: $blockedApps")
            android.util.Log.d("AppMonitorService", "Temporarily allowed apps: $temporarilyAllowedApps")

            val foregroundApp = usageMonitor.getForegroundApp()
            android.util.Log.d("AppMonitorService", "Foreground app detected: $foregroundApp")

            // Skip if app is in session-only allow list (veteran users)
            if (foregroundApp != null && temporarilyAllowedApps.contains(foregroundApp)) {
                android.util.Log.d("AppMonitorService", "⊘ $foregroundApp is temporarily allowed (veteran session)")
                return
            }

            // Skip if app is within 2-hour allow window (new users)
            if (foregroundApp != null) {
                val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
                val allowedUntil = prefs.getLong("temp_allow_${foregroundApp}_until", 0L)
                if (System.currentTimeMillis() < allowedUntil) {
                    android.util.Log.d("AppMonitorService", "⊘ $foregroundApp is in 2hr allow window (new user)")
                    return
                }
            }

            if (foregroundApp != null && blockedApps.contains(foregroundApp)) {
                android.util.Log.d("AppMonitorService", "✓ $foregroundApp IS in blocked list")
                // Only trigger if it's a different app than last time (debounce)
                if (foregroundApp != lastBlockedApp) {
                    android.util.Log.d("AppMonitorService", "✓ Different from lastBlockedApp ($lastBlockedApp), BLOCKING NOW")
                    lastBlockedApp = foregroundApp
                    blockApp(foregroundApp)
                } else {
                    android.util.Log.d("AppMonitorService", "⊘ Same as lastBlockedApp, skipping (debounce)")
                }
            } else {
                android.util.Log.d("AppMonitorService", "✗ $foregroundApp NOT in blocked list or null")
                // Reset if user is back in ResetDopa or another non-blocked app
                if (foregroundApp == packageName) {
                    android.util.Log.d("AppMonitorService", "Back in ResetDopa, resetting lastBlockedApp")
                    lastBlockedApp = null
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "ERROR in checkForegroundApp: ${e.message}", e)
        }
    }

    private fun blockApp(packageName: String) {
        try {
            android.util.Log.d("AppMonitorService", "=== blockApp() called for: $packageName ===")

            // Launch BlockOverlayActivity
            val intent = Intent(this, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("blocked_package", packageName)
            }
            android.util.Log.d("AppMonitorService", "Intent created with flags: FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TOP")
            android.util.Log.d("AppMonitorService", "Starting BlockOverlayActivity...")

            try {
                startActivity(intent)
                android.util.Log.d("AppMonitorService", "✓ BlockOverlayActivity started successfully")
            } catch (e: Exception) {
                android.util.Log.e("AppMonitorService", "✗ FAILED to start BlockOverlayActivity: ${e.message}", e)
                throw e
            }
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "ERROR in blockApp: ${e.message}", e)
        }
    }

    private fun loadBlockedApps() {
        try {
            android.util.Log.d("AppMonitorService", "=== loadBlockedApps() ===")
            val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
            val loadedApps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
            blockedApps = loadedApps
            android.util.Log.d("AppMonitorService", "Loaded ${blockedApps.size} blocked apps: $blockedApps")
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "ERROR loading blocked apps: ${e.message}", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Blocker Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors and blocks distracting apps"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        // Intent to open the app when notification is tapped
        val launchIntent = try {
            packageManager.getLaunchIntentForPackage(packageName)
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "Error getting launch intent", e)
            null
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent ?: Intent(),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ResetDopa Protection Active")
            .setContentText("Monitoring ${blockedApps.size} blocked apps")
            .setSmallIcon(R.drawable.notification_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
