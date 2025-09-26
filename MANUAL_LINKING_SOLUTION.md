# Manual Linking Solution

The auto-linking system is not detecting the module. Here's a manual solution that will work:

## Option 1: Manual Registration in MainApplication.kt

Since the native files are being created correctly, you can manually register the module in your MainApplication.kt:

### 1. Add Import
Add this import at the top of your `MainApplication.kt` file:

```kotlin
import com.webrtccallrecorder.WebrtcCallRecorderPackage
```

### 2. Add Package to getPackages()
In the `getPackages()` method, add the package:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // add(MyReactNativePackage())
      add(WebrtcCallRecorderPackage())
    }
```

## Option 2: Create a Simple Test

Let's create a simple test to verify the module is working:

### 1. Create a Test Component
```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import WebrtcCallRecorder from 'react-native-webrtc-call-recorder';

export default function TestComponent() {
  const [isRecording, setIsRecording] = useState(false);

  const testRecording = async () => {
    try {
      if (!isRecording) {
        await WebrtcCallRecorder.startRecording({
          mix: true,
          format: 'wav'
        });
        setIsRecording(true);
        Alert.alert('Success', 'Recording started');
      } else {
        const result = await WebrtcCallRecorder.stopRecording();
        setIsRecording(false);
        Alert.alert('Success', `Recording saved to: ${result.path}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={testRecording}>
        <Text>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Option 3: Check Module Detection

Let's verify if the module is being detected:

### 1. Check NativeModules
```typescript
import { NativeModules } from 'react-native';
console.log('Available modules:', Object.keys(NativeModules));
console.log('WebrtcCallRecorder:', NativeModules.WebrtcCallRecorder);
```

### 2. Check if Module Exists
```typescript
import { NativeModules } from 'react-native';

if (NativeModules.WebrtcCallRecorder) {
  console.log('✅ Module found!');
} else {
  console.log('❌ Module not found');
  console.log('Available modules:', Object.keys(NativeModules));
}
```

## Why This Happens

1. **Expo Autolinking**: Expo uses its own autolinking system that's different from React Native's
2. **Module Structure**: The module needs to be structured correctly for Expo's system to detect it
3. **Configuration**: The module needs proper configuration files for Expo to recognize it

## Quick Fix

The fastest solution is to manually register the module in MainApplication.kt as shown in Option 1. This will make the module available immediately without waiting for autolinking to work.

## Testing

After manual registration:
1. Rebuild the app: `npx expo run:android`
2. Test the recording functionality
3. Check the console for any errors

The manual registration approach will work immediately and doesn't depend on the autolinking system.
