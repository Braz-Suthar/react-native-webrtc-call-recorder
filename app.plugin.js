const { withAndroidManifest, withInfoPlist, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withWebrtcCallRecorder = (config, options = {}) => {
  const { androidPackageName = 'com.webrtccallrecorder', iosModuleName = 'WebrtcCallRecorder' } = options;

  // Add Android permissions
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add permissions
    const permissions = [
      'android.permission.RECORD_AUDIO',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE'
    ];
    
    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'] = [];
      }
      
      const existingPermission = androidManifest.manifest['uses-permission'].find(
        (p) => p.$['android:name'] === permission
      );
      
      if (!existingPermission) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });
    
    return config;
  });

  // Add iOS microphone permission
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // Add microphone usage description
    if (!infoPlist.NSMicrophoneUsageDescription) {
      infoPlist.NSMicrophoneUsageDescription = 'This app needs access to microphone to record calls';
    }
    
    return config;
  });

  // Create native files and register the module
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(projectRoot, 'app/src/main/java/com/webrtccallrecorder');
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Add WebRTC dependency to app/build.gradle if not present
      const buildGradlePath = path.join(projectRoot, 'app/build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        
        // Add WebRTC dependency if not present
        if (!buildGradle.includes('org.webrtc:google-webrtc')) {
          const webrtcDependency = "    implementation 'org.webrtc:google-webrtc:1.0.32006'\n";
          buildGradle = buildGradle.replace(
            'dependencies {',
            `dependencies {\n${webrtcDependency}`
          );
          fs.writeFileSync(buildGradlePath, buildGradle);
        }
      }
      
      // Create Kotlin files directly
      const kotlinFiles = [
        {
          name: 'WebrtcCallRecorderModule.kt',
          content: `package com.webrtccallrecorder

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Environment
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.*

class WebrtcCallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "WebrtcCallRecorder"
        private const val SAMPLE_RATE = 48000
        private const val CHANNELS = 1
        private const val BITS_PER_SAMPLE = 16
    }

    private val isRecording = AtomicBoolean(false)
    private val outputPath = AtomicReference<String?>(null)
    private val audioTracks = ConcurrentHashMap<String, String>()
    private val recordingJob = AtomicReference<Job?>(null)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

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
            val mix = options.getBoolean("mix")
            val format = options.getString("format") ?: "wav"
            
            outputPath.set(path)
            isRecording.set(true)
            
            // Start recording coroutine
            val job = scope.launch {
                startAudioRecording(path, mix, format)
            }
            recordingJob.set(job)
            
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
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
            recordingJob.get()?.cancel()
            recordingJob.set(null)
            
            val path = outputPath.get()
            if (path != null) {
                promise.resolve(Arguments.createMap().apply {
                    putString("path", path)
                })
            } else {
                promise.reject("NO_OUTPUT_PATH", "No output path available")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop recording", e)
            promise.reject("STOP_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isRecording(promise: Promise) {
        promise.resolve(isRecording.get())
    }

    @ReactMethod
    fun registerAudioTrack(trackId: String, isLocal: Boolean, promise: Promise) {
        try {
            // Store track info for later use
            audioTracks[trackId] = if (isLocal) "local" else "remote"
            Log.d(TAG, "Registering audio track: $trackId, isLocal: $isLocal")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register audio track", e)
            promise.reject("REGISTER_TRACK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun unregisterAudioTrack(trackId: String, promise: Promise) {
        try {
            audioTracks.remove(trackId)
            Log.d(TAG, "Unregistered audio track: $trackId")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unregister audio track", e)
            promise.reject("UNREGISTER_TRACK_ERROR", e.message)
        }
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
        return File(context.filesDir, fileName).absolutePath
    }

    private suspend fun startAudioRecording(path: String, mix: Boolean, format: String) {
        try {
            when (format) {
                "wav" -> recordWavFile(path, mix)
                "aac" -> recordAacFile(path, mix)
                else -> throw IllegalArgumentException("Unsupported format: $format")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio recording failed", e)
        }
    }

    private suspend fun recordWavFile(path: String, mix: Boolean) {
        val file = File(path)
        val outputStream = FileOutputStream(file)
        
        try {
            // Write WAV header
            writeWavHeader(outputStream, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE)
            
            // TODO: Implement actual audio capture from WebRTC tracks
            // This would require integration with react-native-webrtc's AudioTrack instances
            // For now, we'll create a placeholder implementation
            
            // Simulate recording for a short duration (in real implementation, this would be continuous)
            delay(1000) // Placeholder - replace with actual audio capture
            
        } finally {
            outputStream.close()
        }
    }

    private suspend fun recordAacFile(path: String, mix: Boolean) {
        // TODO: Implement AAC encoding using MediaCodec
        // This is a placeholder implementation
        Log.d(TAG, "AAC recording not yet implemented")
    }

    private fun writeWavHeader(outputStream: FileOutputStream, sampleRate: Int, channels: Int, bitsPerSample: Int) {
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val blockAlign = channels * bitsPerSample / 8
        
        // WAV header (44 bytes)
        outputStream.write("RIFF".toByteArray())
        outputStream.write(intToLittleEndian(36)) // File size - 8 (will be updated later)
        outputStream.write("WAVE".toByteArray())
        outputStream.write("fmt ".toByteArray())
        outputStream.write(intToLittleEndian(16)) // Format chunk size
        outputStream.write(shortToLittleEndian(1)) // Audio format (PCM)
        outputStream.write(shortToLittleEndian(channels))
        outputStream.write(intToLittleEndian(sampleRate))
        outputStream.write(intToLittleEndian(byteRate))
        outputStream.write(shortToLittleEndian(blockAlign))
        outputStream.write(shortToLittleEndian(bitsPerSample))
        outputStream.write("data".toByteArray())
        outputStream.write(intToLittleEndian(0)) // Data size (will be updated later)
    }

    private fun intToLittleEndian(value: Int): ByteArray {
        return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(value).array()
    }

    private fun shortToLittleEndian(value: Int): ByteArray {
        return ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort(value.toShort()).array()
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
    }
}`
        },
        {
          name: 'WebrtcCallRecorderPackage.kt',
          content: `package com.webrtccallrecorder

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
}`
        }
      ];
      
      kotlinFiles.forEach(file => {
        const targetFile = path.join(targetDir, file.name);
        fs.writeFileSync(targetFile, file.content);
      });
      
      return config;
    },
  ]);

  // Register the package in MainApplication
  config = withMainApplication(config, (config) => {
    const mainApplicationPath = path.join(
      config.modRequest.platformProjectRoot,
      'app/src/main/java',
      androidPackageName.replace(/\./g, '/'),
      'MainApplication.java'
    );
    
    if (fs.existsSync(mainApplicationPath)) {
      let mainApplication = fs.readFileSync(mainApplicationPath, 'utf8');
      
      // Add import
      if (!mainApplication.includes('import com.webrtccallrecorder.WebrtcCallRecorderPackage;')) {
        const importStatement = 'import com.webrtccallrecorder.WebrtcCallRecorderPackage;\n';
        mainApplication = mainApplication.replace(
          'import java.util.List;',
          `import java.util.List;\n${importStatement}`
        );
      }
      
      // Add package to getPackages()
      if (!mainApplication.includes('new WebrtcCallRecorderPackage()')) {
        mainApplication = mainApplication.replace(
          'return Arrays.<ReactPackage>asList(',
          'return Arrays.<ReactPackage>asList(\n            new WebrtcCallRecorderPackage(),'
        );
      }
      
      fs.writeFileSync(mainApplicationPath, mainApplication);
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(projectRoot, 'ios');
      
      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Create iOS files directly instead of copying
      const iosFiles = [
        {
          name: 'WebrtcCallRecorder.h',
          content: `#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@interface WebrtcCallRecorder : NSObject <RCTBridgeModule>

@end`
        },
        {
          name: 'WebrtcCallRecorder.m',
          content: `#import "WebrtcCallRecorder.h"
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>
#import <WebRTC/WebRTC.h>

@implementation WebrtcCallRecorder

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_EXPORT_METHOD(startRecording:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Check microphone permission
    AVAudioSessionRecordPermission permission = [[AVAudioSession sharedInstance] recordPermission];
    if (permission != AVAudioSessionRecordPermissionGranted) {
        reject(@"PERMISSION_DENIED", @"Microphone permission is required", nil);
        return;
    }
    
    // TODO: Implement actual WebRTC audio track recording
    // This would require integration with react-native-webrtc's RTCAudioTrack instances
    
    NSString *path = options[@"path"];
    BOOL mix = [options[@"mix"] boolValue];
    NSString *format = options[@"format"] ?: @"wav";
    
    RCTLogInfo(@"Starting recording with path: %@, mix: %@, format: %@", path, mix ? @"YES" : @"NO", format);
    
    // For now, resolve immediately - in real implementation, this would start actual recording
    resolve(nil);
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    RCTLogInfo(@"Stopping recording");
    
    // TODO: Implement actual stop recording logic
    // Return the recorded file path
    NSDictionary *result = @{
        @"path": @"/path/to/recorded/file.wav" // Placeholder path
    };
    
    resolve(result);
}

RCT_EXPORT_METHOD(isRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // TODO: Return actual recording state
    resolve(@NO);
}

RCT_EXPORT_METHOD(registerAudioTrack:(NSString *)trackId
                  isLocal:(BOOL)isLocal
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    RCTLogInfo(@"Registering audio track: %@, isLocal: %@", trackId, isLocal ? @"YES" : @"NO");
    
    // TODO: Implement actual track registration with WebRTC
    // This would require access to RTCAudioTrack instances from react-native-webrtc
    
    resolve(nil);
}

RCT_EXPORT_METHOD(unregisterAudioTrack:(NSString *)trackId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    RCTLogInfo(@"Unregistering audio track: %@", trackId);
    
    // TODO: Implement actual track unregistration
    resolve(nil);
}

@end`
        }
      ];
      
      iosFiles.forEach(file => {
        const targetFile = path.join(targetDir, file.name);
        fs.writeFileSync(targetFile, file.content);
      });
      
      return config;
    },
  ]);
  
  return config;
};

module.exports = withWebrtcCallRecorder;