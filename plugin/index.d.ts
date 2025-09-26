import { ConfigPlugin } from '@expo/config-plugins';
interface WebrtcCallRecorderPluginProps {
    /** Custom Android package name (optional) */
    androidPackageName?: string;
    /** Custom iOS module name (optional) */
    iosModuleName?: string;
}
declare const withWebrtcCallRecorder: ConfigPlugin<WebrtcCallRecorderPluginProps>;
export { withWebrtcCallRecorder };
export default withWebrtcCallRecorder;
//# sourceMappingURL=index.d.ts.map