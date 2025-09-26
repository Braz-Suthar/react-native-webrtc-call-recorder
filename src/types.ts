export interface AudioTrackInfo {
  trackId: string;
  isLocal: boolean;
  sampleRate: number;
  channels: number;
}

export interface RecordingState {
  isRecording: boolean;
  outputPath?: string;
  startTime?: number;
}

export interface NativeRecordingOptions {
  path?: string;
  mix: boolean;
  format: 'wav' | 'aac';
}

export interface AudioFrame {
  data: number[];
  sampleRate: number;
  channels: number;
  timestamp: number;
}
