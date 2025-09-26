# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of react-native-webrtc-call-recorder
- Support for recording WebRTC calls on Android and iOS
- TypeScript support with full type definitions
- Expo Config Plugin for automatic native file injection
- Support for WAV and AAC audio formats
- Audio track mixing capabilities
- Manual audio track registration API
- Comprehensive example app
- Full documentation and setup instructions

### Features
- Record local microphone audio from WebRTC calls
- Record remote audio tracks from WebRTC calls
- Mix local and remote audio into a single file
- Background thread I/O to avoid blocking audio thread
- Robust error handling and permission checks
- Support for both React Native bare workflow and Expo prebuild
- Kotlin implementation for Android
- Swift/Objective-C implementation for iOS

### Technical Details
- Native module implementation using React Native's NativeModules API
- WebRTC audio sink integration for capturing PCM frames
- WAV file format support with proper headers
- AAC encoding support (placeholder for future implementation)
- Permission handling for Android (RECORD_AUDIO, WRITE_EXTERNAL_STORAGE)
- Permission handling for iOS (NSMicrophoneUsageDescription)
- Expo config plugin for automatic native file injection
- TypeScript build system with declaration files

### Known Limitations
- AAC encoding requires additional native implementation
- Automatic track discovery may not work in all WebRTC scenarios
- Manual track registration required for optimal results
- Expo managed workflow not supported (requires prebuild)

### Breaking Changes
- None (initial release)

### Migration Guide
- N/A (initial release)
