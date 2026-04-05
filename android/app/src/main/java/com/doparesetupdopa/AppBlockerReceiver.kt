package com.doparesetupdopa

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.content.ComponentName
import android.app.admin.DevicePolicyManager
import com.facebook.react.bridge.ReactApplicationContext

/**
 * AppBlockerReceiver - Device admin receiver that handles app launch blocking
 */
class AppBlockerReceiver : DeviceAdminReceiver() {

  override fun onEnabled(context: Context, intent: Intent) {
    // Admin permissions granted
    showToast(context, "App blocking enabled")
  }

  override fun onDisabled(context: Context, intent: Intent) {
    // Admin permissions revoked
    showToast(context, "App blocking disabled")
  }

  companion object {
    fun isAdminActive(context: Context): Boolean {
      val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
      val componentName = ComponentName(context, AppBlockerReceiver::class.java)
      return dpm.isAdminActive(componentName)
    }

    fun getComponentName(context: Context): ComponentName {
      return ComponentName(context, AppBlockerReceiver::class.java)
    }

    private fun showToast(context: Context, message: String) {
      android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show()
    }
  }
}
