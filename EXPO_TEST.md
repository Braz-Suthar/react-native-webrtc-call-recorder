# Expo Test Guide

This guide shows how to test the `react-native-webrtc-call-recorder` package in an Expo project.

## Quick Test Setup

### 1. Create a New Expo Project

```bash
npx create-expo-app TestWebrtcRecorder
cd TestWebrtcRecorder
```

### 2. Install the Package

```bash
npm install react-native-webrtc-call-recorder
```

### 3. Configure app.json

Create or update `app.json`:

```json
{
  "expo": {
    "name": "TestWebrtcRecorder",
    "slug": "test-webrtc-recorder",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "plugins": [
      [
        "react-native-webrtc-call-recorder",
        {
          "androidPackageName": "com.testwebrtcrecorder",
          "iosModuleName": "WebrtcCallRecorder"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to microphone to record calls"
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### 4. Create a Simple Test App

Update `App.js`:

```javascript
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import WebrtcCallRecorder from 'react-native-webrtc-call-recorder';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      await WebrtcCallRecorder.startRecording({
        mix: true,
        format: 'wav'
      });
      setIsRecording(true);
      Alert.alert('Success', 'Recording started');
    } catch (error) {
      Alert.alert('Error', `Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await WebrtcCallRecorder.stopRecording();
      setIsRecording(false);
      Alert.alert('Success', `Recording saved to: ${result.path}`);
    } catch (error) {
      Alert.alert('Error', `Failed to stop recording: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebRTC Call Recorder Test</Text>
      
      <TouchableOpacity
        style={[styles.button, isRecording ? styles.stopButton : styles.startButton]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.status}>
        Status: {isRecording ? 'Recording...' : 'Not recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
});
```

### 5. Run Prebuild

```bash
npx expo prebuild
```

### 6. Install iOS Dependencies

```bash
cd ios && pod install && cd ..
```

### 7. Run the App

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Expected Behavior

1. **App should launch** without linking errors
2. **Button should work** - tap to start/stop recording
3. **No crashes** - the native module should be properly linked
4. **Alerts should show** - success/error messages

## Troubleshooting

### If you get linking errors:

1. **Check that prebuild ran successfully**:
   ```bash
   npx expo prebuild --clean
   ```

2. **Verify the plugin is in app.json**:
   ```json
   "plugins": [
     [
       "react-native-webrtc-call-recorder",
       {
         "androidPackageName": "com.testwebrtcrecorder",
         "iosModuleName": "WebrtcCallRecorder"
       }
     ]
   ]
   ```

3. **Check that native files were created**:
   - Android: `android/app/src/main/java/com/webrtccallrecorder/`
   - iOS: `ios/WebrtcCallRecorder.h` and `ios/WebrtcCallRecorder.m`

4. **Verify MainApplication.java was updated**:
   - Should contain `import com.webrtccallrecorder.WebrtcCallRecorderPackage;`
   - Should contain `new WebrtcCallRecorderPackage(),`

### If you get permission errors:

1. **Check app.json permissions**:
   ```json
   "android": {
     "permissions": [
       "android.permission.RECORD_AUDIO",
       "android.permission.WRITE_EXTERNAL_STORAGE",
       "android.permission.READ_EXTERNAL_STORAGE"
     ]
   },
   "ios": {
     "infoPlist": {
       "NSMicrophoneUsageDescription": "This app needs access to microphone to record calls"
     }
   }
   ```

2. **Grant permissions on device**:
   - iOS: Settings > Privacy & Security > Microphone
   - Android: Settings > Apps > Your App > Permissions

## Success Indicators

✅ **App launches without errors**  
✅ **No "LINKING_ERROR" messages**  
✅ **Button responds to taps**  
✅ **Alerts show success/error messages**  
✅ **Native module is properly linked**  

## Next Steps

Once the basic test works:

1. **Add WebRTC integration** - install `react-native-webrtc`
2. **Test with actual audio tracks** - register real WebRTC tracks
3. **Test recording functionality** - verify files are created
4. **Test on different devices** - iOS and Android

## Common Issues and Solutions

### Issue: "The package doesn't seem to be linked"
**Solution**: Run `npx expo prebuild` and rebuild the app

### Issue: "Permission denied"
**Solution**: Check permissions in app.json and grant on device

### Issue: "Module not found"
**Solution**: Verify the plugin is correctly configured and prebuild completed

### Issue: "Native files not found"
**Solution**: The plugin should create these automatically during prebuild

This test setup should help you verify that the package works correctly in Expo projects!
