package com.webrtccallrecorder

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Environment
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import org.webrtc.*
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.*

class WebrtcCallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "WebrtcCallRecorder"
        private const val SAMPLE_RATE = 48000
        private const val CHANNELS = 1
        private const val BITS_PER_SAMPLE = 16
    }

    private val isRecording = AtomicBoolean(false)
    private val outputPath = AtomicReference<String?>(null)
    private val audioTracks = ConcurrentHashMap<String, AudioTrackInfo>()
    private val recordingJob = AtomicReference<Job?>(null)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private data class AudioTrackInfo(
        val track: AudioTrack,
        val isLocal: Boolean,
        val sink: AudioSink
    )

    override fun getName(): String = "WebrtcCallRecorder"

    @ReactMethod
    fun startRecording(options: ReadableMap, promise: Promise) {
        if (isRecording.get()) {
            promise.reject("ALREADY_RECORDING", "Recording is already in progress")
            return
        }

        if (!checkPermissions()) {
            promise.reject("PERMISSION_DENIED", "Microphone permission is required")
            return
        }

        try {
            val path = options.getString("path") ?: getDefaultOutputPath()
            val mix = options.getBoolean("mix")
            val format = options.getString("format") ?: "wav"
            
            outputPath.set(path)
            isRecording.set(true)
            
            // Start recording coroutine
            val job = scope.launch {
                startAudioRecording(path, mix, format)
            }
            recordingJob.set(job)
            
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            promise.reject("START_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording.get()) {
            promise.reject("NOT_RECORDING", "No recording in progress")
            return
        }

        try {
            isRecording.set(false)
            recordingJob.get()?.cancel()
            recordingJob.set(null)
            
            val path = outputPath.get()
            if (path != null) {
                promise.resolve(Arguments.createMap().apply {
                    putString("path", path)
                })
            } else {
                promise.reject("NO_OUTPUT_PATH", "No output path available")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop recording", e)
            promise.reject("STOP_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isRecording(promise: Promise) {
        promise.resolve(isRecording.get())
    }

    @ReactMethod
    fun registerAudioTrack(trackId: String, isLocal: Boolean, promise: Promise) {
        try {
            // This would need to be called with actual WebRTC AudioTrack instances
            // For now, we'll create a placeholder that can be extended
            Log.d(TAG, "Registering audio track: $trackId, isLocal: $isLocal")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register audio track", e)
            promise.reject("REGISTER_TRACK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun unregisterAudioTrack(trackId: String, promise: Promise) {
        try {
            audioTracks.remove(trackId)
            Log.d(TAG, "Unregistered audio track: $trackId")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unregister audio track", e)
            promise.reject("UNREGISTER_TRACK_ERROR", e.message)
        }
    }

    private fun checkPermissions(): Boolean {
        val context = reactApplicationContext
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun getDefaultOutputPath(): String {
        val context = reactApplicationContext
        val timestamp = System.currentTimeMillis()
        val fileName = "webrtc_recording_$timestamp.wav"
        return File(context.filesDir, fileName).absolutePath
    }

    private suspend fun startAudioRecording(path: String, mix: Boolean, format: String) {
        try {
            when (format) {
                "wav" -> recordWavFile(path, mix)
                "aac" -> recordAacFile(path, mix)
                else -> throw IllegalArgumentException("Unsupported format: $format")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio recording failed", e)
        }
    }

    private suspend fun recordWavFile(path: String, mix: Boolean) {
        val file = File(path)
        val outputStream = FileOutputStream(file)
        
        try {
            // Write WAV header
            writeWavHeader(outputStream, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE)
            
            // TODO: Implement actual audio capture from WebRTC tracks
            // This would require integration with react-native-webrtc's AudioTrack instances
            // For now, we'll create a placeholder implementation
            
            // Simulate recording for a short duration (in real implementation, this would be continuous)
            delay(1000) // Placeholder - replace with actual audio capture
            
        } finally {
            outputStream.close()
        }
    }

    private suspend fun recordAacFile(path: String, mix: Boolean) {
        // TODO: Implement AAC encoding using MediaCodec
        // This is a placeholder implementation
        Log.d(TAG, "AAC recording not yet implemented")
    }

    private fun writeWavHeader(outputStream: FileOutputStream, sampleRate: Int, channels: Int, bitsPerSample: Int) {
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val blockAlign = channels * bitsPerSample / 8
        
        // WAV header (44 bytes)
        outputStream.write("RIFF".toByteArray())
        outputStream.write(intToLittleEndian(36)) // File size - 8 (will be updated later)
        outputStream.write("WAVE".toByteArray())
        outputStream.write("fmt ".toByteArray())
        outputStream.write(intToLittleEndian(16)) // Format chunk size
        outputStream.write(shortToLittleEndian(1)) // Audio format (PCM)
        outputStream.write(shortToLittleEndian(channels))
        outputStream.write(intToLittleEndian(sampleRate))
        outputStream.write(intToLittleEndian(byteRate))
        outputStream.write(shortToLittleEndian(blockAlign))
        outputStream.write(shortToLittleEndian(bitsPerSample))
        outputStream.write("data".toByteArray())
        outputStream.write(intToLittleEndian(0)) // Data size (will be updated later)
    }

    private fun intToLittleEndian(value: Int): ByteArray {
        return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(value).array()
    }

    private fun shortToLittleEndian(value: Int): ByteArray {
        return ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort(value.toShort()).array()
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
    }
}
