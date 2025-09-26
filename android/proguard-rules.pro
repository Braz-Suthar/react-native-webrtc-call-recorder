# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebRTC, you may want to keep the following classes
-keep class org.webrtc.** { *; }
-keep class com.webrtccallrecorder.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native related classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
