import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-webrtc-call-recorder' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- For Expo: run "npx expo prebuild" and then "npx expo run:ios" or "npx expo run:android"\n' +
  '- You are not using Expo managed workflow (use expo prebuild)\n';

// Check if we're in Expo managed workflow
const isExpoManaged = typeof __DEV__ !== 'undefined' && 
  (global as any).expo && 
  (global as any).expo.Constants && 
  (global as any).expo.Constants.appOwnership === 'expo';

const WebrtcCallRecorder = NativeModules.WebrtcCallRecorder
  ? NativeModules.WebrtcCallRecorder
  : new Proxy(
      {},
      {
        get() {
          if (isExpoManaged) {
            throw new Error(
              'This package requires Expo prebuild. Please run "npx expo prebuild" and then "npx expo run:ios" or "npx expo run:android"'
            );
          }
          throw new Error(LINKING_ERROR);
        },
      }
    );

export interface RecordingOptions {
  /** Output file path. If not provided, will use default app directory */
  path?: string;
  /** Whether to mix local and remote audio into a single file */
  mix?: boolean;
  /** Audio format. Defaults to 'wav' */
  format?: 'wav' | 'aac';
}

export interface RecordingResult {
  /** Absolute path to the recorded file */
  path: string;
}

export interface WebrtcCallRecorderInterface {
  /**
   * Start recording WebRTC audio tracks
   * @param options Recording configuration options
   */
  startRecording(options?: RecordingOptions): Promise<void>;
  
  /**
   * Stop recording and return the file path
   * @returns Promise that resolves with the recorded file path
   */
  stopRecording(): Promise<RecordingResult>;
  
  /**
   * Check if currently recording
   * @returns Promise that resolves with recording status
   */
  isRecording(): Promise<boolean>;
  
  /**
   * Register a specific audio track for recording
   * @param trackId The ID of the audio track to record
   * @param isLocal Whether this is a local or remote track
   */
  registerAudioTrack(trackId: string, isLocal: boolean): Promise<void>;
  
  /**
   * Unregister an audio track from recording
   * @param trackId The ID of the audio track to stop recording
   */
  unregisterAudioTrack(trackId: string): Promise<void>;
}

export default WebrtcCallRecorder as WebrtcCallRecorderInterface;
