package com.dopareset.app.appblocker

import android.app.Activity
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen overlay activity that blocks access to restricted apps
 * Shows motivational message, breathing exercise for 60s, then post-survival choice
 *
 * Points System:
 * - +2 points when user clicks "I'm Good" (resist)
 * - -15 points when user clicks "Open App" (requires 3s hold)
 * - Requires: -1 day streak to open
 * - Shows warning if insufficient balance/streak
 */
class BlockOverlayActivity : Activity() {

    private var isBreathing = false
    private var breathingTimer: CountDownTimer? = null
    private var blockedPackage: String = ""

    // Balance, Streak & Tier
    private var userBalance = 0
    private var hasStreak = true
    private var isVeteran = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        android.util.Log.d("BlockOverlayActivity", "=== onCreate() called ===")

        // Make full screen
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        // Keep screen on and show on lock screen
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
        window.addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)

        android.util.Log.d("BlockOverlayActivity", "Fullscreen flags set ✓")

        // Load user balance and streak
        loadBalanceAndStreak()

        // Get blocked app name
        blockedPackage = intent.getStringExtra("blocked_package") ?: "Unknown App"
        android.util.Log.d("BlockOverlayActivity", "Blocked package from intent: $blockedPackage")
        val appName = getAppName(blockedPackage)
        android.util.Log.d("BlockOverlayActivity", "App name resolved to: $appName")

        android.util.Log.d("BlockOverlayActivity", "Calling showBlockingScreen()...")
        showBlockingScreen(appName, blockedPackage)
        android.util.Log.d("BlockOverlayActivity", "✓ onCreate() completed, UI should now be visible")
    }

    private fun loadBalanceAndStreak() {
        try {
            android.util.Log.d("BlockOverlayActivity", "Loading balance and streak from SharedPreferences...")
            val prefs = getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE)
            userBalance = prefs.getInt("user_balance", 0)
            hasStreak = prefs.getBoolean("user_streak", true)
            isVeteran = prefs.getBoolean("user_is_veteran", false)
            val lastSyncTime = prefs.getLong("balance_sync_time", 0)
            val timeSinceSync = System.currentTimeMillis() - lastSyncTime
            val hasSyncedOnce = prefs.getBoolean("balance_synced_once", false)

            android.util.Log.d("BlockOverlayActivity", "✓ Loaded: balance=$userBalance, hasStreak=$hasStreak")
            android.util.Log.d("BlockOverlayActivity", "  Last sync: ${timeSinceSync}ms ago, synced once: $hasSyncedOnce")

            if (userBalance == 0) {
                android.util.Log.w("BlockOverlayActivity", "⚠️ Balance is 0 — scheduling retry in 2s to allow Firestore sync")
                val handler = Handler(Looper.getMainLooper())
                handler.postDelayed({
                    loadBalanceAndStreak()
                }, 2000)
            } else if (userBalance == 0 && hasSyncedOnce && timeSinceSync > 5000) {
                android.util.Log.w("BlockOverlayActivity", "⚠️ WARNING: Balance is 0 but sync completed")
                android.util.Log.w("BlockOverlayActivity", "  This means user actually has 0 points")
            }
        } catch (e: Exception) {
            android.util.Log.e("BlockOverlayActivity", "Error loading balance/streak: ${e.message}", e)
            userBalance = 0
            hasStreak = true
        }
    }

    private fun showBlockingScreen(appName: String, blockedPackage: String) {
        // Build UI programmatically
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF0D1B2A.toInt()) // Dark blue-black background
        }

        // Emoji/Icon - more prominent
        val emojiText = TextView(this).apply {
            text = "🛑"
            textSize = 80f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        // Title - more dramatic
        val titleText = TextView(this).apply {
            text = "Pause & Reflect"
            textSize = 36f
            setTextColor(0xFFFF6B6B.toInt()) // Energetic red
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        // Blocked app name - highlighted
        val subtitleText = TextView(this).apply {
            text = appName
            textSize = 22f
            setTextColor(0xFF4A90E2.toInt()) // Bright blue
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        // Divider
        val divider = TextView(this).apply {
            text = "─────────────────"
            textSize = 14f
            setTextColor(0xFF333333.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        // Instruction message - more motivational
        val instructionText = TextView(this).apply {
            text = "You're about to open $appName.\n\nBefore you do, take a moment.\nComplete 60 seconds of\ndeep breathing to reconnect\nwith your goals."
            textSize = 16f
            setTextColor(0xFFD0D0D0.toInt())
            gravity = Gravity.CENTER
            lineHeight = (textSize * 1.6f).toInt()
            setPadding(16, 0, 16, 48)
        }

        // Start Breathing button (primary action) - more prominent
        val breathingButton = Button(this).apply {
            text = "✓ Start Breathing"
            textSize = 18f
            setPadding(64, 40, 64, 40)
            setBackgroundColor(0xFF4A90E2.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            isAllCaps = false
            setTypeface(null, android.graphics.Typeface.BOLD)
            setOnClickListener {
                showBreathingAnimation(blockedPackage)
            }
        }

        // Spacer
        val spacer = TextView(this).apply {
            text = ""
            setPadding(0, 32, 0, 0)
        }

        // Go back button (secondary action) - less prominent
        val backButton = Button(this).apply {
            text = "← Cancel"
            textSize = 16f
            setPadding(48, 24, 48, 24)
            setBackgroundColor(0x00000000.toInt()) // Transparent
            setTextColor(0xFF666666.toInt())
            isAllCaps = false
            setOnClickListener {
                returnToDopaReset()
            }
        }

        layout.addView(emojiText)
        layout.addView(titleText)
        layout.addView(subtitleText)
        layout.addView(divider)
        layout.addView(instructionText)
        layout.addView(breathingButton)
        layout.addView(spacer)
        layout.addView(backButton)

        setContentView(layout)
    }

    private fun showBreathingAnimation(blockedPackage: String) {
        isBreathing = true

        // Container for breathing animation
        val container = FrameLayout(this).apply {
            setBackgroundColor(0xFF0D1B2A.toInt()) // Dark blue-black for better visual
        }

        // Main layout (vertical)
        val mainLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                Gravity.CENTER
            )
            setPadding(0, 80, 0, 80)
        }

        // Title
        val titleText = TextView(this).apply {
            text = "Breathing Exercise"
            textSize = 24f
            setTextColor(0xFF4A90E2.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }

        // Breathing circle with gradient effect
        val breathingCircle = TextView(this).apply {
            text = "●"
            textSize = 140f
            setTextColor(0xFF4A90E2.toInt())
            gravity = Gravity.CENTER
            alpha = 0.9f
        }

        // Dynamic guidance text - changes with breathing phase
        val guidanceText = TextView(this).apply {
            text = "Breathe In"
            textSize = 28f
            setTextColor(0xFF6DB3F2.toInt())
            gravity = Gravity.CENTER
            setPadding(32, 40, 32, 0)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        // Breathing phase indicator
        val phaseIndicator = TextView(this).apply {
            text = "Inhale (4s)"
            textSize = 14f
            setTextColor(0xFF888888.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 40)
        }

        // Timer with progress bar concept
        val timerText = TextView(this).apply {
            text = "60"
            textSize = 52f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 40, 0, 16)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        val timerLabel = TextView(this).apply {
            text = "seconds remaining"
            textSize = 12f
            setTextColor(0xFF888888.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 0)
        }

        // Helpful message at bottom
        val helpText = TextView(this).apply {
            text = "Follow the text and circle\nFocus on your breath"
            textSize = 14f
            setTextColor(0xFF666666.toInt())
            gravity = Gravity.CENTER
            lineHeight = (textSize * 1.6f).toInt()
            setPadding(32, 80, 32, 0)
        }

        mainLayout.addView(titleText)
        mainLayout.addView(breathingCircle)
        mainLayout.addView(guidanceText)
        mainLayout.addView(phaseIndicator)
        mainLayout.addView(timerText)
        mainLayout.addView(timerLabel)
        mainLayout.addView(helpText)

        container.addView(mainLayout)
        setContentView(container)

        // Animate breathing (scale up and down)
        startBreathingAnimation(breathingCircle, blockedPackage, guidanceText, phaseIndicator, timerText)
    }

    private fun startBreathingAnimation(circle: TextView, blockedPackage: String, guidanceText: TextView, phaseIndicator: TextView, timerText: TextView) {
        val handler = Handler(Looper.getMainLooper())

        // Timer countdown
        breathingTimer = object : CountDownTimer(60000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val secsLeft = (millisUntilFinished / 1000) + 1
                timerText.text = secsLeft.toString()
            }

            override fun onFinish() {
                timerText.text = "0"
                showPostSurvivalChoice(blockedPackage)
            }
        }

        breathingTimer?.start()

        // Continuous breathing animation loop
        var cycleTime = 0L
        val animationRunnable = object : Runnable {
            override fun run() {
                if (!isBreathing) return

                // Breathing cycle: inhale (0-4s), hold (4-6s), exhale (6-10s), pause (10-12s)
                val elapsed = cycleTime % 12000

                when {
                    elapsed < 4000 -> {
                        // Inhale: scale from 1 to 1.5
                        val progress = elapsed / 4000f
                        circle.scaleX = 1f + (0.5f * progress)
                        circle.scaleY = 1f + (0.5f * progress)
                        guidanceText.text = "Breathe In"
                        guidanceText.setTextColor(0xFF4A90E2.toInt())
                        phaseIndicator.text = "Inhale (${4 - (elapsed / 1000).toInt()}s)"
                    }
                    elapsed < 6000 -> {
                        // Hold: stay at 1.5
                        circle.scaleX = 1.5f
                        circle.scaleY = 1.5f
                        guidanceText.text = "Hold"
                        guidanceText.setTextColor(0xFFFFD700.toInt()) // Gold for hold
                        phaseIndicator.text = "Hold (${6 - (elapsed / 1000).toInt()}s)"
                    }
                    elapsed < 10000 -> {
                        // Exhale: scale from 1.5 to 1
                        val progress = (elapsed - 6000) / 4000f
                        circle.scaleX = 1.5f - (0.5f * progress)
                        circle.scaleY = 1.5f - (0.5f * progress)
                        guidanceText.text = "Breathe Out"
                        guidanceText.setTextColor(0xFF7B68EE.toInt()) // Purple for exhale
                        phaseIndicator.text = "Exhale (${10 - (elapsed / 1000).toInt()}s)"
                    }
                    else -> {
                        // Pause: stay at 1
                        circle.scaleX = 1f
                        circle.scaleY = 1f
                        guidanceText.text = "Relax"
                        guidanceText.setTextColor(0xFF50C878.toInt()) // Green for relax
                        phaseIndicator.text = "Pause (${12 - (elapsed / 1000).toInt()}s)"
                    }
                }

                cycleTime += 50
                handler.postDelayed(this, 50)
            }
        }

        handler.post(animationRunnable)
    }

    private fun showPostSurvivalChoice(blockedPackage: String) {
        isBreathing = false
        breathingTimer?.cancel()

        // Always read latest balance before building UI — fixes stale 0 from cold-start
        loadBalanceAndStreak()

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF0D1B2A.toInt())
        }

        // Success emoji
        val successEmoji = TextView(this).apply {
            text = "🎉"
            textSize = 72f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        // Completion message
        val titleText = TextView(this).apply {
            text = "Excellent Work!"
            textSize = 40f
            setTextColor(0xFF00CC00.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        // Reward message (+2 on resist)
        val messageText = TextView(this).apply {
            text = "Clicking 'I'm Good' gives +2 Calm Points"
            textSize = 16f
            setTextColor(0xFF4A90E2.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        // Current balance display
        val balanceText = TextView(this).apply {
            text = "💰 Current: $userBalance pts | Streak: ${if (hasStreak) "✓" else "✗"}"
            textSize = 14f
            setTextColor(0xFFFFD700.toInt())  // Gold
            gravity = Gravity.CENTER
            setPadding(16, 8, 16, 24)
            setBackgroundColor(0xFF1a2633.toInt())
        }

        // Warning about open app cost
        val costWarningText = TextView(this).apply {
            val canAfford = userBalance >= 15 && hasStreak
            text = if (canAfford) {
                "Opening app costs: -15 pts, -1 ⚡ streak"
            } else {
                buildString {
                    append("⚠️ Cannot open app:\n")
                    if (userBalance < 15) append("  • Need -15 pts (have $userBalance)\n")
                    if (!hasStreak) append("  • Need -1 ⚡ streak (lost)\n")
                }
            }
            textSize = 13f
            setTextColor(if (canAfford) 0xFFFF9999.toInt() else 0xFFFF3333.toInt())
            gravity = Gravity.CENTER
            setPadding(16, 12, 16, 24)
            setBackgroundColor(0xFF1a2633.toInt())
        }

        // Inspirational text
        val inspirationText = TextView(this).apply {
            text = "By pausing and breathing,\nyou took control back.\nYou're stronger than\nurges."
            textSize = 16f
            setTextColor(0xFFD0D0D0.toInt())
            gravity = Gravity.CENTER
            lineHeight = (textSize * 1.5f).toInt()
            setPadding(16, 0, 16, 32)
        }

        // Green "I'm Good" button - calls +2 points
        val rejectButton = Button(this).apply {
            text = "✓ I'm Good (+2 pts)"
            textSize = 18f
            setPadding(64, 40, 64, 40)
            setBackgroundColor(0xFF00CC00.toInt())
            setTextColor(0xFF000000.toInt())
            isAllCaps = false
            setTypeface(null, android.graphics.Typeface.BOLD)
            setOnClickListener {
                handleResistAndReward()
            }
        }

        // Spacer
        val spacer = TextView(this).apply {
            text = ""
            setPadding(0, 24, 0, 0)
        }

        // Red "Open App" button - nuclear hold button or disabled
        val canAffordToOpen = userBalance >= 15 && hasStreak
        val acceptButton = Button(this).apply {
            text = if (canAffordToOpen) "🚫 HOLD 3s to Open" else "❌ Cannot Open (insufficient)"
            textSize = 18f
            setPadding(64, 40, 64, 40)
            setBackgroundColor(if (canAffordToOpen) 0xFFFF3333.toInt() else 0xFF666666.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            isAllCaps = false
            setTypeface(null, android.graphics.Typeface.BOLD)
            isEnabled = canAffordToOpen

            val handler = android.os.Handler(android.os.Looper.getMainLooper())
            var holdRunnable: Runnable? = null

            setOnTouchListener { v, event ->
                when (event.action) {
                    android.view.MotionEvent.ACTION_DOWN -> {
                        if (canAffordToOpen) {
                            text = "🚫 Holding... release to cancel"
                            holdRunnable = Runnable {
                                handleOpenAppWithNuclearButton(blockedPackage)
                            }
                            handler.postDelayed(holdRunnable!!, 3000)
                        }
                    }
                    android.view.MotionEvent.ACTION_UP,
                    android.view.MotionEvent.ACTION_CANCEL -> {
                        holdRunnable?.let { handler.removeCallbacks(it) }
                        holdRunnable = null
                        if (canAffordToOpen) {
                            text = "🚫 HOLD 3s to Open"
                        }
                    }
                }
                true
            }
        }

        // Duration hint shown only when force-open is possible
        val durationHintText = TextView(this).apply {
            if (canAffordToOpen) {
                text = if (isVeteran) "⏱ Session only — blocker resets when you restart the app"
                       else "⏱ 2 hours — blocker resumes after that"
                textSize = 12f
                setTextColor(0xFF888888.toInt())
                gravity = Gravity.CENTER
                setPadding(16, 12, 16, 0)
            }
        }

        layout.addView(successEmoji)
        layout.addView(titleText)
        layout.addView(messageText)
        layout.addView(balanceText)
        layout.addView(costWarningText)
        layout.addView(inspirationText)
        layout.addView(rejectButton)
        layout.addView(spacer)
        layout.addView(acceptButton)
        layout.addView(durationHintText)

        setContentView(layout)
    }

    private fun handleResistAndReward() {
        try {
            android.util.Log.d("BlockOverlayActivity", "User clicked 'I'm Good' - adding +2 points")
            // Call native method to add points
            val prefs = getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE)
            val handled = prefs.getBoolean("resist_handled_" + System.currentTimeMillis(), false)
            if (!handled) {
                prefs.edit()
                    .putBoolean("app_blocker_resist_pending", true)
                    .apply()
                android.util.Log.d("BlockOverlayActivity", "✓ Marked for +2 points reward")
            }
            returnToDopaReset()
        } catch (e: Exception) {
            android.util.Log.e("BlockOverlayActivity", "Error handling resist reward", e)
            returnToDopaReset()
        }
    }

    private fun handleOpenAppWithNuclearButton(blockedPackage: String) {
        try {
            android.util.Log.d("BlockOverlayActivity", "Nuclear button activated - checking final balance")

            // Check one more time (balance might have changed)
            loadBalanceAndStreak()

            if (userBalance >= 15 && hasStreak) {
                android.util.Log.d("BlockOverlayActivity", "✓ User approved: opening $blockedPackage")

                // Mark for deduction
                val prefs = getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE)
                prefs.edit()
                    .putBoolean("app_blocker_open_pending", true)
                    .putString("app_blocker_open_package", blockedPackage)
                    .apply()

                if (isVeteran) {
                    // Veteran: session-only allow (in-memory, resets on app restart)
                    val allowIntent = Intent(this, AppMonitorService::class.java)
                    allowIntent.putExtra("allow_temporarily_app", blockedPackage)
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        startForegroundService(allowIntent)
                    } else {
                        startService(allowIntent)
                    }
                    android.util.Log.d("BlockOverlayActivity", "✓ [Veteran] Temporarily allowed for this session only")
                } else {
                    // New user: persist 2-hour allow window to SharedPrefs
                    val allowUntil = System.currentTimeMillis() + 7_200_000L
                    prefs.edit()
                        .putLong("temp_allow_${blockedPackage}_until", allowUntil)
                        .apply()
                    android.util.Log.d("BlockOverlayActivity", "✓ [New user] Allowed for 2hrs: $blockedPackage until $allowUntil")
                }

                // Open the blocked app
                val intent = packageManager.getLaunchIntentForPackage(blockedPackage)
                if (intent != null) {
                    startActivity(intent)
                }
                finish()
            } else {
                android.util.Log.e("BlockOverlayActivity", "✗ Insufficient balance/streak on final check")
                showErrorAndRefresh("Insufficient balance/streak")
            }
        } catch (e: Exception) {
            android.util.Log.e("BlockOverlayActivity", "Error in nuclear button handler", e)
            showErrorAndRefresh("Error: ${e.message}")
        }
    }

    private fun showErrorAndRefresh(errorMessage: String) {
        // Refresh the UI
        isBreathing = false
        breathingTimer?.cancel()

        loadBalanceAndStreak()
        val appName = getAppName(blockedPackage)
        showPostSurvivalChoice(blockedPackage)

        android.util.Log.e("BlockOverlayActivity", "Error: $errorMessage")
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
            android.util.Log.d("BlockOverlayActivity", "returnToDopaReset() called - resetting service state")

            // Check if we need to process reward
            val prefs = getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE)
            val resistPending = prefs.getBoolean("app_blocker_resist_pending", false)

            if (resistPending) {
                android.util.Log.d("BlockOverlayActivity", "Processing resist reward: +2 points")
                prefs.edit()
                    .putBoolean("app_blocker_resist_pending", false)
                    .putBoolean("app_blocker_resist_ready", true)  // Signal React to process
                    .apply()
            }

            // Signal service to reset lastBlockedApp
            val resetIntent = Intent(this, AppMonitorService::class.java)
            resetIntent.putExtra("reset_blocked_app", true)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(resetIntent)
            } else {
                startService(resetIntent)
            }
            android.util.Log.d("BlockOverlayActivity", "Reset signal sent to service ✓")

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
        returnToDopaReset()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        android.util.Log.d("BlockOverlayActivity", "=== onNewIntent() called (singleInstance reuse) ===")
        setIntent(intent)  // ← CRITICAL: update the intent

        // Re-load blocked package and refresh balance from new intent
        blockedPackage = intent?.getStringExtra("blocked_package") ?: "Unknown App"
        android.util.Log.d("BlockOverlayActivity", "Updated blocked package to: $blockedPackage")
        loadBalanceAndStreak()
        val appName = getAppName(blockedPackage)
        android.util.Log.d("BlockOverlayActivity", "Refreshing UI with: $appName")

        showBlockingScreen(appName, blockedPackage)
    }

    override fun onPause() {
        super.onPause()
        // Don't finish on pause - the blocker must stay visible on lock screen
        android.util.Log.d("BlockOverlayActivity", "onPause() called - keeping activity alive")
    }
}
