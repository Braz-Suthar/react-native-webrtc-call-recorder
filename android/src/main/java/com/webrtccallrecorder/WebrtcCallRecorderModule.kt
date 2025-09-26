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
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

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
    private var mediaRecorder: MediaRecorder? = null
    
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
            
            Log.d(TAG, "Starting recording with options:")
            Log.d(TAG, "  Path: $path")
            Log.d(TAG, "  Mix: $mix")
            Log.d(TAG, "  Format: $format")
            
            outputPath.set(path)
            isRecording.set(true)
            
            // Start recording coroutine
            val job = scope.launch {
                startAudioRecording(path, mix, format)
            }
            recordingJob.set(job)
            
            Log.d(TAG, "Recording started successfully")
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
            Log.d(TAG, "Stopping recording...")
            isRecording.set(false)
            
            // Stop the MediaRecorder
            stopMediaRecorder()
            
            // Cancel the recording job
            recordingJob.get()?.cancel()
            recordingJob.set(null)
            
            val path = outputPath.get()
            if (path != null) {
                Log.d(TAG, "Checking for recording file at: $path")
                
                // Wait a moment for the file to be written
                Thread.sleep(500)
                
                // Verify the file was created
                val file = File(path)
                Log.d(TAG, "File exists: ${file.exists()}")
                Log.d(TAG, "File size: ${file.length()} bytes")
                Log.d(TAG, "File absolute path: ${file.absolutePath}")
                
                if (file.exists() && file.length() > 0) {
                    Log.d(TAG, "Recording saved successfully: $path (${file.length()} bytes)")
                    promise.resolve(Arguments.createMap().apply {
                        putString("path", path)
                        putDouble("size", file.length().toDouble())
                    })
                } else {
                    Log.e(TAG, "Recording file was not created or is empty: $path")
                    Log.e(TAG, "File exists: ${file.exists()}, File size: ${file.length()}")
                    promise.reject("FILE_NOT_CREATED", "Recording file was not created or is empty")
                }
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
    fun requestPermissions(promise: Promise) {
        val context = reactApplicationContext
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        
        if (hasPermission) {
            promise.resolve(true)
        } else {
            // Note: In a real app, you would typically use ActivityCompat.requestPermissions
            // For a React Native module, permissions should be requested from the React Native side
            promise.resolve(false)
        }
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
        val fileName = "webrtc_recording_$timestamp.m4a"
        
        // Create the files directory if it doesn't exist
        val filesDir = context.filesDir
        if (!filesDir.exists()) {
            filesDir.mkdirs()
        }
        
        return File(filesDir, fileName).absolutePath
    }

    private suspend fun startAudioRecording(path: String, mix: Boolean, format: String) {
        try {
            // Both WAV and AAC requests will use the same MP4/AAC implementation
            // since MediaRecorder doesn't support raw WAV output directly
            when (format) {
                "wav", "aac" -> recordAudioFile(path, mix, format)
                else -> throw IllegalArgumentException("Unsupported format: $format")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio recording failed", e)
            isRecording.set(false)
        }
    }

    private suspend fun recordAudioFile(path: String, mix: Boolean, format: String) {
        try {
            // Ensure the directory exists
            val file = File(path)
            file.parentFile?.mkdirs()
            
            Log.d(TAG, "Starting $format recording to: $path")
            Log.d(TAG, "File parent directory exists: ${file.parentFile?.exists()}")
            Log.d(TAG, "File parent directory: ${file.parentFile?.absolutePath}")
            
            // Use MediaRecorder with MP4 format and AAC encoder for both WAV and AAC requests
            // This is the most reliable approach on Android
            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(44100)
                setAudioChannels(1)
                setAudioEncodingBitRate(128000)
                setOutputFile(path)
                
                try {
                    prepare()
                    start()
                    Log.d(TAG, "MediaRecorder started $format recording to: $path")
                } catch (e: IOException) {
                    Log.e(TAG, "MediaRecorder prepare/start failed", e)
                    throw e
                }
            }
            
            // Keep recording while isRecording is true
            while (isRecording.get()) {
                delay(100) // Check every 100ms
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "$format recording failed", e)
            throw e
        } finally {
            stopMediaRecorder()
        }
    }
    
    private fun stopMediaRecorder() {
        try {
            mediaRecorder?.apply {
                Log.d(TAG, "Stopping MediaRecorder...")
                if (isRecording.get()) {
                    stop()
                    Log.d(TAG, "MediaRecorder stopped successfully")
                }
                release()
                Log.d(TAG, "MediaRecorder released")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping MediaRecorder", e)
        } finally {
            mediaRecorder = null
        }
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
        
        // Stop any ongoing recording
        if (isRecording.get()) {
            isRecording.set(false)
            stopMediaRecorder()
        }
        
        // Cancel all coroutines
        scope.cancel()
    }
}
