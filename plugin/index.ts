import { ConfigPlugin, withAndroidManifest, withInfoPlist } from '@expo/config-plugins';

const withWebrtcCallRecorder: ConfigPlugin = (config) => {
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
        (p: any) => p.$['android:name'] === permission
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
  
  return config;
};

export { withWebrtcCallRecorder };
export default withWebrtcCallRecorder;