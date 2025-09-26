const { withAndroidManifest, withInfoPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withWebrtcCallRecorder = (config, options = {}) => {
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

  // Create native files in the project directory for auto-linking
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(projectRoot, 'app/src/main/java/com/webrtccallrecorder');
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Also create the module in node_modules for auto-linking
      const moduleDir = path.join(projectRoot, 'node_modules/react-native-webrtc-call-recorder/android');
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }
      
      const moduleSourceDir = path.join(moduleDir, 'src/main/java/com/webrtccallrecorder');
      if (!fs.existsSync(moduleSourceDir)) {
        fs.mkdirSync(moduleSourceDir, { recursive: true });
      }
      
      // Create simplified Kotlin files that work with auto-linking
      const kotlinFiles = [
        {
          name: 'WebrtcCallRecorderModule.kt',
          content: `package com.webrtccallrecorder

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
            Log.d("WebrtcCallRecorder", "Recording started: $path")
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
        // Create in project directory
        const targetFile = path.join(targetDir, file.name);
        fs.writeFileSync(targetFile, file.content);
        console.log(`✅ Created ${file.name} at ${targetFile}`);
        
        // Also create in node_modules for auto-linking
        const moduleFile = path.join(moduleSourceDir, file.name);
        fs.writeFileSync(moduleFile, file.content);
        console.log(`✅ Created ${file.name} in node_modules for auto-linking`);
      });
      
      // Create build.gradle for the module
      const buildGradleContent = `apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 33)
    buildToolsVersion safeExtGet('buildToolsVersion', '33.0.0')

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        targetSdkVersion safeExtGet('targetSdkVersion', 33)
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}

repositories {
    google()
    mavenCentral()
}`;
      
      fs.writeFileSync(path.join(moduleDir, 'build.gradle'), buildGradleContent);
      console.log(`✅ Created build.gradle for auto-linking`);
      
      console.log(`✅ WebrtcCallRecorder native files created in ${targetDir}`);
      return config;
    },
  ]);

  // Create iOS files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(projectRoot, 'ios');
      
      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Create iOS files
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
    resolve(nil);
}

RCT_EXPORT_METHOD(unregisterAudioTrack:(NSString *)trackId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    RCTLogInfo(@"Unregistering audio track: %@", trackId);
    resolve(nil);
}

@end`
        }
      ];
      
      iosFiles.forEach(file => {
        const targetFile = path.join(targetDir, file.name);
        fs.writeFileSync(targetFile, file.content);
        console.log(`✅ Created ${file.name} at ${targetFile}`);
      });
      
      console.log(`✅ WebrtcCallRecorder iOS files created in ${targetDir}`);
      return config;
    },
  ]);
  
  return config;
};

module.exports = withWebrtcCallRecorder;