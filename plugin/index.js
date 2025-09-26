"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWebrtcCallRecorder = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ANDROID_PACKAGE_NAME = 'com.webrtccallrecorder';
const IOS_MODULE_NAME = 'WebrtcCallRecorder';
const withWebrtcCallRecorder = (config, { androidPackageName = ANDROID_PACKAGE_NAME, iosModuleName = IOS_MODULE_NAME } = {}) => {
    // Add Android configuration
    config = withAndroidGradleProperties(config);
    config = withAndroidManifestPermissions(config);
    config = withAndroidMainApplication(config, androidPackageName);
    // Add iOS configuration
    config = withIosAppDelegate(config, iosModuleName);
    config = withIosPodfile(config);
    config = withIosInfoPlist(config);
    return config;
};
exports.withWebrtcCallRecorder = withWebrtcCallRecorder;
const withAndroidGradleProperties = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const gradlePropertiesPath = path.join(config.modRequest.platformProjectRoot, 'gradle.properties');
            if (fs.existsSync(gradlePropertiesPath)) {
                let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');
                // Add WebRTC dependencies if not present
                if (!gradleProperties.includes('org.webrtc:google-webrtc')) {
                    gradleProperties += '\n# WebRTC Call Recorder dependencies\n';
                    gradleProperties += 'android.useAndroidX=true\n';
                    gradleProperties += 'android.enableJetifier=true\n';
                    fs.writeFileSync(gradlePropertiesPath, gradleProperties);
                }
            }
            return config;
        },
    ]);
};
const withAndroidManifestPermissions = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
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
            const existingPermission = androidManifest.manifest['uses-permission'].find((p) => p.$['android:name'] === permission);
            if (!existingPermission) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': permission }
                });
            }
        });
        return config;
    });
};
const withAndroidMainApplication = (config, packageName) => {
    return (0, config_plugins_1.withMainApplication)(config, (config) => {
        const mainApplicationPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java', packageName.replace(/\./g, '/'), 'MainApplication.java');
        if (fs.existsSync(mainApplicationPath)) {
            let mainApplication = fs.readFileSync(mainApplicationPath, 'utf8');
            // Add import
            if (!mainApplication.includes('import com.webrtccallrecorder.WebrtcCallRecorderPackage;')) {
                const importStatement = 'import com.webrtccallrecorder.WebrtcCallRecorderPackage;\n';
                mainApplication = mainApplication.replace('import java.util.List;', `import java.util.List;\n${importStatement}`);
            }
            // Add package to getPackages()
            if (!mainApplication.includes('new WebrtcCallRecorderPackage()')) {
                mainApplication = mainApplication.replace('return Arrays.<ReactPackage>asList(', 'return Arrays.<ReactPackage>asList(\n            new WebrtcCallRecorderPackage(),');
            }
            fs.writeFileSync(mainApplicationPath, mainApplication);
        }
        return config;
    });
};
const withIosAppDelegate = (config, moduleName) => {
    return (0, config_plugins_1.withAppDelegate)(config, (config) => {
        const appDelegatePath = path.join(config.modRequest.platformProjectRoot, 'ios', config.modRequest.projectName, 'AppDelegate.mm');
        if (fs.existsSync(appDelegatePath)) {
            let appDelegate = fs.readFileSync(appDelegatePath, 'utf8');
            // Add import
            if (!appDelegate.includes(`#import "${moduleName}.h"`)) {
                const importStatement = `#import "${moduleName}.h"\n`;
                appDelegate = appDelegate.replace('#import <React/RCTBundleURLProvider.h>', `#import <React/RCTBundleURLProvider.h>\n${importStatement}`);
            }
            // Add module to the bridge
            if (!appDelegate.includes('WebrtcCallRecorder')) {
                // This would need to be implemented based on the specific AppDelegate structure
                // For now, we'll just ensure the import is there
                console.log('iOS AppDelegate integration needs manual setup for module registration');
            }
            fs.writeFileSync(appDelegatePath, appDelegate);
        }
        return config;
    });
};
const withIosPodfile = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'ios', 'Podfile');
            if (fs.existsSync(podfilePath)) {
                let podfile = fs.readFileSync(podfilePath, 'utf8');
                // Add WebRTC dependency if not present
                if (!podfile.includes('WebRTC')) {
                    const webrtcDependency = "  pod 'WebRTC', '~> 1.0'\n";
                    podfile = podfile.replace('target \'YourApp\' do', `target 'YourApp' do\n${webrtcDependency}`);
                }
                fs.writeFileSync(podfilePath, podfile);
            }
            return config;
        },
    ]);
};
const withIosInfoPlist = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const infoPlist = config.modResults;
        // Add microphone usage description
        if (!infoPlist.NSMicrophoneUsageDescription) {
            infoPlist.NSMicrophoneUsageDescription = 'This app needs access to microphone to record calls';
        }
        return config;
    });
};
exports.default = withWebrtcCallRecorder;
//# sourceMappingURL=index.js.map