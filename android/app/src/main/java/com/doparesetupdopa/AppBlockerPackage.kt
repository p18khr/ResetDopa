package com.doparesetupdopa

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * AppBlockerPackage - Register native modules with React Native
 */
class AppBlockerPackage : TurboReactPackage() {

  override fun getModule(name: String?, reactContext: ReactApplicationContext?): NativeModule? {
    return when (name) {
      "AppBlocker" -> AppBlockerModule(reactContext!!)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        "AppBlocker" to object : ReactModuleInfo {
          override fun getCanOverrideExistingModule(): Boolean = false
          override fun getName(): String = "AppBlocker"
          override fun hasConstants(): Boolean = false
          override fun isCxxModule(): Boolean = false
          override fun isNativeModule(): Boolean = true
          override fun isTurboModule(): Boolean = false
        }
      )
    }
  }
}
