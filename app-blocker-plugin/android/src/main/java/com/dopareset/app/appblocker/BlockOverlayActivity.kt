package com.dopareset.app.appblocker

import android.app.Activity
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen overlay activity that blocks access to restricted apps
 * Shows motivational message and return button
 */
class BlockOverlayActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make full screen, transparent background
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        window.setFlags(
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        )

        // Get blocked app name
        val blockedPackage = intent.getStringExtra("blocked_package") ?: "Unknown App"
        val appName = getAppName(blockedPackage)

        // Build UI programmatically
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xDD000000.toInt()) // Semi-transparent black
        }

        // Title
        val titleText = TextView(this).apply {
            text = "🛡️ DopaReset Protection"
            textSize = 28f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        // Blocked app message
        val blockedAppText = TextView(this).apply {
            text = "\"$appName\" is blocked"
            textSize = 20f
            setTextColor(0xFFFF6B6B.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        // Motivational message
        val motivationText = TextView(this).apply {
            text = "You're building better habits.\nStay focused on what matters."
            textSize = 16f
            setTextColor(0xFFCCCCCC.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }

        // Return button
        val returnButton = Button(this).apply {
            text = "Return to DopaReset"
            textSize = 18f
            setPadding(48, 24, 48, 24)
            setBackgroundColor(0xFF4A90E2.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                returnToDopaReset()
            }
        }

        // "Still want to proceed" option (with delay/friction)
        val bypassText = TextView(this).apply {
            text = "\n\nI understand the consequences"
            textSize = 12f
            setTextColor(0xFF888888.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 32, 0, 8)
            setOnClickListener {
                // Add friction: require 3-second hold or multiple taps
                // For now, just close
                finish()
            }
        }

        layout.addView(titleText)
        layout.addView(blockedAppText)
        layout.addView(motivationText)
        layout.addView(returnButton)
        layout.addView(bypassText)

        setContentView(layout)

        // Re-enable touch after UI is set
        window.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
    }

    private fun getAppName(packageName: String): String {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            packageName
        }
    }

    private fun returnToDopaReset() {
        try {
            // Launch DopaReset app
            val intent = packageManager.getLaunchIntentForPackage(applicationContext.packageName)
            intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            android.util.Log.e("BlockOverlayActivity", "Error returning to DopaReset", e)
            finish()
        }
    }

    override fun onBackPressed() {
        // Prevent back button from closing overlay
        returnToDopaReset()
    }

    override fun onPause() {
        super.onPause()
        // Close when activity goes to background (user switched away)
        finish()
    }
}
