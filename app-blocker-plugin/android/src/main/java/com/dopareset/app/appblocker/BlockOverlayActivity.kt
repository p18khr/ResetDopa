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

        // Make full screen
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        // Get blocked app name
        val blockedPackage = intent.getStringExtra("blocked_package") ?: "Unknown App"
        val appName = getAppName(blockedPackage)

        // Build UI programmatically
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
            setBackgroundColor(0xF0000000.toInt()) // Nearly opaque black
        }

        // Emoji/Icon
        val emojiText = TextView(this).apply {
            text = "🧘"
            textSize = 72f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        // Title
        val titleText = TextView(this).apply {
            text = "Pause & Breathe"
            textSize = 32f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }

        // Subtitle - which app is being opened
        val subtitleText = TextView(this).apply {
            text = "Opening $appName"
            textSize = 18f
            setTextColor(0xFFFF6B6B.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }

        // Instruction message
        val instructionText = TextView(this).apply {
            text = "Complete 60 seconds of\nbreathing to unlock"
            textSize = 18f
            setTextColor(0xFFCCCCCC.toInt())
            gravity = Gravity.CENTER
            lineHeight = (textSize * 1.5f).toInt()
            setPadding(0, 0, 0, 64)
        }

        // Start Breathing button (primary action)
        val breathingButton = Button(this).apply {
            text = "Start Breathing Exercise"
            textSize = 18f
            setPadding(64, 32, 64, 32)
            setBackgroundColor(0xFF4A90E2.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            isAllCaps = false
            setOnClickListener {
                launchBreathingExercise(blockedPackage)
            }
        }

        // Spacer
        val spacer = TextView(this).apply {
            text = ""
            setPadding(0, 24, 0, 0)
        }

        // Go back button (secondary action)
        val backButton = Button(this).apply {
            text = "No Thanks, Go Back"
            textSize = 16f
            setPadding(48, 24, 48, 24)
            setBackgroundColor(0x00000000.toInt()) // Transparent
            setTextColor(0xFF888888.toInt())
            isAllCaps = false
            setOnClickListener {
                returnToDopaReset()
            }
        }

        layout.addView(emojiText)
        layout.addView(titleText)
        layout.addView(subtitleText)
        layout.addView(instructionText)
        layout.addView(breathingButton)
        layout.addView(spacer)
        layout.addView(backButton)

        setContentView(layout)
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

    private fun launchBreathingExercise(blockedPackage: String) {
        try {
            // Launch DopaReset with deep link to breathing exercise
            val intent = packageManager.getLaunchIntentForPackage(applicationContext.packageName)
            intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Add data about which app was blocked (for future use)
            intent?.putExtra("blocked_app", blockedPackage)
            intent?.putExtra("action", "breathing_gate")
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            android.util.Log.e("BlockOverlayActivity", "Error launching breathing exercise", e)
            // Fallback: just return to app
            returnToDopaReset()
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
