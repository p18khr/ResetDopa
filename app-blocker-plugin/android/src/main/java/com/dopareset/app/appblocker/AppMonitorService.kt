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
        usageMonitor = AppUsageMonitor(this)
        loadBlockedApps()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start as foreground service
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        // Start monitoring
        startMonitoring()

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
            isMonitoring = true
            handler.post(monitoringRunnable)
            android.util.Log.d("AppMonitorService", "Monitoring started")
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
            val foregroundApp = usageMonitor.getForegroundApp()
            
            if (foregroundApp != null && blockedApps.contains(foregroundApp)) {
                // Only trigger if it's a different app than last time (debounce)
                if (foregroundApp != lastBlockedApp) {
                    lastBlockedApp = foregroundApp
                    blockApp(foregroundApp)
                }
            } else {
                // Reset if user is back in DopaReset or another non-blocked app
                if (foregroundApp == packageName) {
                    lastBlockedApp = null
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "Error checking foreground app", e)
        }
    }

    private fun blockApp(packageName: String) {
        try {
            android.util.Log.d("AppMonitorService", "Blocking app: $packageName")
            
            // Launch BlockOverlayActivity
            val intent = Intent(this, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("blocked_package", packageName)
            }
            startActivity(intent)
        } catch (e: Exception) {
            android.util.Log.e("AppMonitorService", "Error blocking app", e)
        }
    }

    private fun loadBlockedApps() {
        val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
        blockedApps = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
        android.util.Log.d("AppMonitorService", "Loaded ${blockedApps.size} blocked apps")
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
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DopaReset Protection Active")
            .setContentText("Monitoring ${blockedApps.size} blocked apps")
            .setSmallIcon(android.R.drawable.ic_menu_view) // Use app icon in production
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
