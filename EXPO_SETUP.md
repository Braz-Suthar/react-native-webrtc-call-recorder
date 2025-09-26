# Expo Setup Guide for react-native-webrtc-call-recorder

This guide explains how to properly set up and use `react-native-webrtc-call-recorder` in Expo projects.

## ⚠️ Important: Expo Prebuild Required

This package **cannot** be used in Expo managed workflow. You **must** use Expo prebuild to generate native code.

## Step-by-Step Setup

### 1. Install the Package

```bash
npm install react-native-webrtc-call-recorder
# or
yarn add react-native-webrtc-call-recorder
```

### 2. Configure Expo Plugin

Add the plugin to your `app.json` or `app.config.js`:

#### Option A: app.json
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "plugins": [
      [
        "react-native-webrtc-call-recorder",
        {
          "androidPackageName": "com.yourapp.package",
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

#### Option B: app.config.js
```javascript
module.exports = {
  expo: {
    name: "Your App Name",
    slug: "your-app-slug",
    version: "1.0.0",
    platforms: ["ios", "android"],
    plugins: [
      [
        "react-native-webrtc-call-recorder",
        {
          androidPackageName: "com.yourapp.package",
          iosModuleName: "WebrtcCallRecorder"
        }
      ]
    ],
    ios: {
      infoPlist: {
        NSMicrophoneUsageDescription: "This app needs access to microphone to record calls"
      }
    },
    android: {
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    }
  }
};
```

### 3. Run Expo Prebuild

This is the crucial step that generates the native code:

```bash
npx expo prebuild
```

This command will:
- Generate the `android/` and `ios/` folders
- Copy the native module files
- Configure permissions
- Set up the native module registration

### 4. Install iOS Dependencies (iOS only)

```bash
cd ios && pod install && cd ..
```

### 5. Run the App

#### For Development
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

#### For Production Build
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Usage in Your App

```typescript
import WebrtcCallRecorder from 'react-native-webrtc-call-recorder';

// Start recording
await WebrtcCallRecorder.startRecording({
  mix: true,
  format: 'wav'
});

// Stop recording
const result = await WebrtcCallRecorder.stopRecording();
console.log('Recording saved to:', result.path);
```

## Troubleshooting

### Error: "This package requires Expo prebuild"

**Solution**: You're trying to use the package in Expo managed workflow. You must run:
```bash
npx expo prebuild
```

### Error: "The package doesn't seem to be linked"

**Solution**: 
1. Make sure you've run `npx expo prebuild`
2. Rebuild the app: `npx expo run:ios` or `npx expo run:android`
3. Check that the plugin is properly configured in your app.json/app.config.js

### Error: "Permission denied"

**Solution**: 
1. Check that permissions are added to your app.json/app.config.js
2. For iOS: Make sure NSMicrophoneUsageDescription is set
3. For Android: Make sure RECORD_AUDIO permission is included

### Error: "Module not found"

**Solution**:
1. Make sure you've installed the package: `npm install react-native-webrtc-call-recorder`
2. Run `npx expo prebuild` to generate native code
3. Rebuild the app

## Development Workflow

### 1. Make Changes to Native Code
If you modify the native code in the package:
```bash
# Rebuild the package
npm run build

# Regenerate native code
npx expo prebuild --clean

# Rebuild the app
npx expo run:ios
```

### 2. Debugging
- Check the Expo logs: `npx expo logs`
- Use React Native debugger
- Check native logs in Xcode (iOS) or Android Studio (Android)

## Common Issues

### 1. Plugin Not Working
- Ensure the plugin is correctly configured in app.json/app.config.js
- Check that the package is installed
- Run `npx expo prebuild --clean`

### 2. Permissions Not Granted
- Check that permissions are in app.json/app.config.js
- For iOS: Check Info.plist has NSMicrophoneUsageDescription
- For Android: Check AndroidManifest.xml has RECORD_AUDIO permission

### 3. Native Module Not Found
- Ensure you've run `npx expo prebuild`
- Check that the native files were copied to android/ and ios/ folders
- Verify the MainApplication.java includes the package registration

## Migration from Managed to Bare Workflow

If you're migrating from Expo managed workflow:

1. **Backup your project**
2. **Run prebuild**: `npx expo prebuild`
3. **Install dependencies**: `cd ios && pod install && cd ..`
4. **Test the app**: `npx expo run:ios` or `npx expo run:android`

## Best Practices

1. **Always use prebuild** for packages with native code
2. **Test on real devices** for audio recording functionality
3. **Handle permissions gracefully** in your app
4. **Test the complete flow** from installation to recording
5. **Keep your Expo SDK version updated**

## Support

If you encounter issues:

1. Check this guide first
2. Check the main README.md
3. Look at the example app in the `example/` folder
4. Create an issue on GitHub with:
   - Your app.json/app.config.js
   - The error message
   - Steps to reproduce
   - Your Expo SDK version

## Example Complete Setup

Here's a complete example of how to set up a new Expo project with this package:

```bash
# 1. Create new Expo project
npx create-expo-app MyRecordingApp
cd MyRecordingApp

# 2. Install the package
npm install react-native-webrtc-call-recorder

# 3. Configure app.json
# (Add the plugin configuration as shown above)

# 4. Run prebuild
npx expo prebuild

# 5. Install iOS dependencies
cd ios && pod install && cd ..

# 6. Run the app
npx expo run:ios
```

This setup will give you a working Expo project with the WebRTC call recorder package properly linked and configured.
