const { withAndroidManifest, withInfoPlist, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withWebrtcCallRecorder = (config, options = {}) => {
  const { androidPackageName = 'com.webrtccallrecorder', iosModuleName = 'WebrtcCallRecorder' } = options;

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
        (p) => p.$['android:name'] === permission
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

  // Copy native files and register the module
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const sourceDir = path.join(__dirname, 'android');
      const targetDir = path.join(projectRoot, 'app/src/main/java/com/webrtccallrecorder');
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy Kotlin files
      const kotlinFiles = [
        'WebrtcCallRecorderModule.kt',
        'WebrtcCallRecorderPackage.kt'
      ];
      
      kotlinFiles.forEach(file => {
        const sourceFile = path.join(sourceDir, 'src/main/java/com/webrtccallrecorder', file);
        const targetFile = path.join(targetDir, file);
        
        if (fs.existsSync(sourceFile)) {
          fs.copyFileSync(sourceFile, targetFile);
        }
      });
      
      return config;
    },
  ]);

  // Register the package in MainApplication
  config = withMainApplication(config, (config) => {
    const mainApplicationPath = path.join(
      config.modRequest.platformProjectRoot,
      'app/src/main/java',
      androidPackageName.replace(/\./g, '/'),
      'MainApplication.java'
    );
    
    if (fs.existsSync(mainApplicationPath)) {
      let mainApplication = fs.readFileSync(mainApplicationPath, 'utf8');
      
      // Add import
      if (!mainApplication.includes('import com.webrtccallrecorder.WebrtcCallRecorderPackage;')) {
        const importStatement = 'import com.webrtccallrecorder.WebrtcCallRecorderPackage;\n';
        mainApplication = mainApplication.replace(
          'import java.util.List;',
          `import java.util.List;\n${importStatement}`
        );
      }
      
      // Add package to getPackages()
      if (!mainApplication.includes('new WebrtcCallRecorderPackage()')) {
        mainApplication = mainApplication.replace(
          'return Arrays.<ReactPackage>asList(',
          'return Arrays.<ReactPackage>asList(\n            new WebrtcCallRecorderPackage(),'
        );
      }
      
      fs.writeFileSync(mainApplicationPath, mainApplication);
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const sourceDir = path.join(__dirname, 'ios');
      const targetDir = path.join(projectRoot, 'ios');
      
      // Copy iOS files
      const iosFiles = [
        'WebrtcCallRecorder.h',
        'WebrtcCallRecorder.m'
      ];
      
      iosFiles.forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);
        
        if (fs.existsSync(sourceFile)) {
          fs.copyFileSync(sourceFile, targetFile);
        }
      });
      
      return config;
    },
  ]);
  
  return config;
};

module.exports = withWebrtcCallRecorder;