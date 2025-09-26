module.exports = {
  dependencies: {
    'react-native-webrtc-call-recorder': {
      platforms: {
        android: {
          sourceDir: './android',
          packageImportPath: 'import com.webrtccallrecorder.WebrtcCallRecorderPackage;',
        },
        ios: {
          podspecPath: './ios/WebrtcCallRecorder.podspec',
        },
      },
    },
  },
};