# Linking Troubleshooting Guide

## Issue: "The package doesn't seem to be linked"

This error occurs when React Native cannot find the native module. Here's how to fix it:

## Step-by-Step Fix

### 1. Update to Latest Version
```bash
npm install react-native-webrtc-call-recorder@1.0.6
```

### 2. Clean Everything
```bash
# Delete android folder
rm -rf android

# Clean Expo cache
npx expo prebuild --clean
```

### 3. Run Prebuild with Debug
```bash
npx expo prebuild -p android
```

Look for these console messages:
- ✅ `Created WebrtcCallRecorderModule.kt at ...`
- ✅ `Created WebrtcCallRecorderPackage.kt at ...`
- ✅ `WebrtcCallRecorderPackage registered in MainApplication.java`

### 4. Verify Files Were Created

Check that these files exist:
- `android/app/src/main/java/com/webrtccallrecorder/WebrtcCallRecorderModule.kt`
- `android/app/src/main/java/com/webrtccallrecorder/WebrtcCallRecorderPackage.kt`

### 5. Check MainApplication.java

Look for these lines in `android/app/src/main/java/com/yourapp/MainApplication.java`:

```java
import com.webrtccallrecorder.WebrtcCallRecorderPackage;

// In getPackages() method:
new WebrtcCallRecorderPackage(),
```

### 6. Build and Run
```bash
npx expo run:android
```

## Manual Fix (If Plugin Fails)

If the plugin doesn't work automatically, you can manually add the module:

### 1. Create the Native Files

Create `android/app/src/main/java/com/webrtccallrecorder/WebrtcCallRecorderModule.kt`:

```kotlin
package com.webrtccallrecorder

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

class WebrtcCallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val isRecording = AtomicBoolean(false)
    private val outputPath = AtomicReference<String?>(null)

    override fun getName(): String = "WebrtcCallRecorder"

    @ReactMethod
    fun startRecording(options: ReadableMap, promise: Promise) {
        if (isRecording.get()) {
            promise.reject("ALREADY_RECORDING", "Recording is already in progress")
            return
        }

        if (!checkPermissions()) {
            promise.reject("PERMISSION_DENIED", "Microphone permission is required")
            return
        }

        try {
            val path = options.getString("path") ?: getDefaultOutputPath()
            isRecording.set(true)
            outputPath.set(path)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e("WebrtcCallRecorder", "Failed to start recording", e)
            promise.reject("START_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording.get()) {
            promise.reject("NOT_RECORDING", "No recording in progress")
            return
        }

        try {
            isRecording.set(false)
            val path = outputPath.get()
            if (path != null) {
                promise.resolve(Arguments.createMap().apply {
                    putString("path", path)
                })
            } else {
                promise.reject("NO_OUTPUT_PATH", "No output path available")
            }
        } catch (e: Exception) {
            Log.e("WebrtcCallRecorder", "Failed to stop recording", e)
            promise.reject("STOP_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isRecording(promise: Promise) {
        promise.resolve(isRecording.get())
    }

    @ReactMethod
    fun registerAudioTrack(trackId: String, isLocal: Boolean, promise: Promise) {
        Log.d("WebrtcCallRecorder", "Registering audio track: $trackId, isLocal: $isLocal")
        promise.resolve(null)
    }

    @ReactMethod
    fun unregisterAudioTrack(trackId: String, promise: Promise) {
        Log.d("WebrtcCallRecorder", "Unregistering audio track: $trackId")
        promise.resolve(null)
    }

    private fun checkPermissions(): Boolean {
        val context = reactApplicationContext
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun getDefaultOutputPath(): String {
        val context = reactApplicationContext
        val timestamp = System.currentTimeMillis()
        val fileName = "webrtc_recording_$timestamp.wav"
        return context.filesDir.absolutePath + "/" + fileName
    }
}
```

Create `android/app/src/main/java/com/webrtccallrecorder/WebrtcCallRecorderPackage.kt`:

```kotlin
package com.webrtccallrecorder

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WebrtcCallRecorderPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(WebrtcCallRecorderModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

### 2. Register in MainApplication.java

Add to your `MainApplication.java`:

```java
import com.webrtccallrecorder.WebrtcCallRecorderPackage;

// In getPackages() method:
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new WebrtcCallRecorderPackage(),
        // ... other packages
    );
}
```

## Common Issues

### Issue: "MainApplication.java not found"
**Solution**: The plugin couldn't find your MainApplication.java file. Check the path in your project.

### Issue: "Files not created"
**Solution**: The plugin might not have run correctly. Try running `npx expo prebuild --clean` again.

### Issue: "Package not registered"
**Solution**: Manually add the import and package registration to MainApplication.java.

### Issue: "Permission denied"
**Solution**: Make sure you have the RECORD_AUDIO permission in your AndroidManifest.xml.

## Verification

After fixing, you should see:
- ✅ No linking errors in the console
- ✅ The module is found by React Native
- ✅ Recording API calls work (even if placeholder)

## Still Having Issues?

1. **Check the console output** during prebuild for any error messages
2. **Verify file paths** are correct in your project
3. **Try manual setup** if the plugin continues to fail
4. **Check Expo version** compatibility

The package should now link correctly! 🎉
