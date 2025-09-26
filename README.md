# react-native-webrtc-call-recorder

[ Not Stable, still in development ]

A React Native package for recording WebRTC calls locally on device. Supports both React Native (bare workflow) and Expo apps using prebuild.

## Features

- 🎙️ Record local microphone audio
- 🎧 Record remote audio tracks
- 🔄 Mix local and remote audio into a single file
- 📱 Support for both Android and iOS
- 🚀 Expo Config Plugin for easy integration
- 📦 TypeScript support
- 🎵 Multiple audio formats (WAV, AAC)

## Installation

### React Native (Bare Workflow)

```bash
npm install react-native-webrtc-call-recorder
# or
yarn add react-native-webrtc-call-recorder
```

#### iOS Setup

1. Run `cd ios && pod install`
2. Add microphone permission to `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone to record calls</string>
```

#### Android Setup

1. Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

2. Add the package to your `MainApplication.java`:

```java
import com.webrtccallrecorder.WebrtcCallRecorderPackage;

// In getPackages() method:
new WebrtcCallRecorderPackage(),
```

### Expo

⚠️ **Important**: This package requires Expo prebuild. It cannot be used in Expo managed workflow.

1. Install the package:

```bash
npm install react-native-webrtc-call-recorder
```

2. Add the config plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-webrtc-call-recorder",
        {
          "androidPackageName": "com.webrtccallrecorder",
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

3. Run prebuild:

```bash
npx expo prebuild
```

4. Install iOS dependencies:

```bash
cd ios && pod install
```

5. Run the app:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

📖 **Detailed Expo Setup**: See [EXPO_SETUP.md](EXPO_SETUP.md) for comprehensive setup instructions and troubleshooting.

## Usage

### Basic Usage

```typescript
import WebrtcCallRecorder from 'react-native-webrtc-call-recorder';

// Start recording
await WebrtcCallRecorder.startRecording({
  path: '/path/to/recording.wav', // Optional, uses default if not provided
  mix: true, // Mix local and remote audio
  format: 'wav' // or 'aac'
});

// Stop recording
const result = await WebrtcCallRecorder.stopRecording();
console.log('Recording saved to:', result.path);
```

### Advanced Usage with WebRTC

```typescript
import { RTCPeerConnection, MediaStream } from 'react-native-webrtc';
import WebrtcCallRecorder from 'react-native-webrtc-call-recorder';

// Get your WebRTC streams
const localStream = await mediaDevices.getUserMedia({ audio: true, video: true });
const remoteStream = /* your remote stream */;

// Register audio tracks for recording
await WebrtcCallRecorder.registerAudioTrack(localStream.getAudioTracks()[0].id, true);
await WebrtcCallRecorder.registerAudioTrack(remoteStream.getAudioTracks()[0].id, false);

// Start recording
await WebrtcCallRecorder.startRecording({
  mix: true,
  format: 'wav'
});

// Your WebRTC call logic here...

// Stop recording when call ends
const result = await WebrtcCallRecorder.stopRecording();
```

## API Reference

### Methods

#### `startRecording(options?: RecordingOptions): Promise<void>`

Start recording WebRTC audio tracks.

**Parameters:**
- `options.path?: string` - Output file path (optional, uses default if not provided)
- `options.mix?: boolean` - Whether to mix local and remote audio (default: true)
- `options.format?: 'wav' | 'aac'` - Audio format (default: 'wav')

#### `stopRecording(): Promise<RecordingResult>`

Stop recording and return the file path.

**Returns:**
- `Promise<{ path: string }>` - Object containing the absolute path to the recorded file

#### `isRecording(): Promise<boolean>`

Check if currently recording.

#### `registerAudioTrack(trackId: string, isLocal: boolean): Promise<void>`

Register a specific audio track for recording.

**Parameters:**
- `trackId: string` - The ID of the audio track
- `isLocal: boolean` - Whether this is a local or remote track

#### `unregisterAudioTrack(trackId: string): Promise<void>`

Unregister an audio track from recording.

### Types

```typescript
interface RecordingOptions {
  path?: string;
  mix?: boolean;
  format?: 'wav' | 'aac';
}

interface RecordingResult {
  path: string;
}
```

## Permissions

### Android

The following permissions are automatically added by the Expo config plugin:

- `RECORD_AUDIO` - Required for microphone access
- `WRITE_EXTERNAL_STORAGE` - Required for saving recordings
- `READ_EXTERNAL_STORAGE` - Required for reading recordings

### iOS

Add the following to your `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone to record calls</string>
```

## Troubleshooting

### Common Issues

1. **"The package doesn't seem to be linked"**
   - Make sure you've run `cd ios && pod install` (iOS)
   - Rebuild your app after installing the package
   - For Expo, make sure you've run `npx expo prebuild`

2. **Permission denied errors**
   - Check that microphone permissions are granted
   - On Android, ensure all required permissions are in AndroidManifest.xml
   - On iOS, ensure NSMicrophoneUsageDescription is in Info.plist

3. **Recording not working**
   - Make sure you've registered audio tracks using `registerAudioTrack()`
   - Check that WebRTC streams are active before starting recording
   - Verify that the output directory is writable

4. **Expo managed workflow**
   - This package cannot be used in Expo managed workflow
   - You must use `npx expo prebuild` to generate native code

### Debug Mode

Enable debug logging by setting the following in your app:

```typescript
// Enable native logging (Android)
import { NativeModules } from 'react-native';
NativeModules.WebrtcCallRecorder.setLogLevel('debug');
```

## Development

### Building the Package

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/react-native-webrtc-call-recorder/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/yourusername/react-native-webrtc-call-recorder/wiki)
