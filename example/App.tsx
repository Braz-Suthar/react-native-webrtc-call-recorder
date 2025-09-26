import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import WebrtcCallRecorder, { RecordingOptions } from 'react-native-webrtc-call-recorder';

const App: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    requestPermissions();
    initializeWebRTC();
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        
        if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert('Permissions required', 'Camera and microphone permissions are required for this app.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const initializeWebRTC = async () => {
    try {
      // Get local media stream
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      setPeerConnection(pc);
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      Alert.alert('Error', 'Failed to initialize WebRTC. Please check your permissions.');
    }
  };

  const startRecording = async () => {
    try {
      if (!localStream) {
        Alert.alert('Error', 'No local stream available');
        return;
      }

      const options: RecordingOptions = {
        path: undefined, // Use default path
        mix: true, // Mix local and remote audio
        format: 'wav', // Record as WAV file
      };

      await WebrtcCallRecorder.startRecording(options);
      setIsRecording(true);
      Alert.alert('Success', 'Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error}`);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await WebrtcCallRecorder.stopRecording();
      setIsRecording(false);
      setRecordingPath(result.path);
      Alert.alert('Success', `Recording saved to: ${result.path}`);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', `Failed to stop recording: ${error}`);
    }
  };

  const registerAudioTracks = async () => {
    if (!localStream || !remoteStream) {
      Alert.alert('Error', 'Streams not available');
      return;
    }

    try {
      // Register local audio track
      const localAudioTrack = localStream.getAudioTracks()[0];
      if (localAudioTrack) {
        await WebrtcCallRecorder.registerAudioTrack(localAudioTrack.id, true);
      }

      // Register remote audio track
      const remoteAudioTrack = remoteStream.getAudioTracks()[0];
      if (remoteAudioTrack) {
        await WebrtcCallRecorder.registerAudioTrack(remoteAudioTrack.id, false);
      }

      Alert.alert('Success', 'Audio tracks registered');
    } catch (error) {
      console.error('Failed to register audio tracks:', error);
      Alert.alert('Error', `Failed to register audio tracks: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.body}>
          <Text style={styles.title}>WebRTC Call Recorder Example</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Local Stream</Text>
            {localStream && (
              <RTCView
                style={styles.video}
                streamURL={localStream.toURL()}
                mirror={true}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remote Stream</Text>
            {remoteStream && (
              <RTCView
                style={styles.video}
                streamURL={remoteStream.toURL()}
                mirror={false}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recording Controls</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={registerAudioTracks}
            >
              <Text style={styles.buttonText}>Register Audio Tracks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isRecording ? styles.stopButton : styles.startButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.buttonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            {recordingPath && (
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingText}>Recording saved to:</Text>
                <Text style={styles.recordingPath}>{recordingPath}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  registerButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
  },
  recordingPath: {
    fontSize: 12,
    color: '#1b5e20',
    fontFamily: 'monospace',
  },
});

export default App;
