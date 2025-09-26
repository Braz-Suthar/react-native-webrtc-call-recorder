package com.webrtccallrecorder

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

class WebrtcCallRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val isRecording = AtomicBoolean(false)
    private val outputPath = AtomicReference<String?>(null)
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private var fileOutputStream: FileOutputStream? = null

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
            outputPath.set(path)
            
            // Create the file
            val file = File(path)
            file.parentFile?.mkdirs()
            Log.d("WebrtcCallRecorder", "Creating file at: $path")
            Log.d("WebrtcCallRecorder", "Parent directory exists: ${file.parentFile?.exists()}")
            Log.d("WebrtcCallRecorder", "Parent directory writable: ${file.parentFile?.canWrite()}")
            
            fileOutputStream = FileOutputStream(file)
            Log.d("WebrtcCallRecorder", "File created successfully, size: ${file.length()}")
            
            // Write WAV header
            writeWavHeader(fileOutputStream!!, 44100, 16, 1)
            
            // Initialize AudioRecord
            val bufferSize = AudioRecord.getMinBufferSize(
                44100,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                44100,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("AUDIO_INIT_ERROR", "Failed to initialize AudioRecord")
                return
            }
            
            isRecording.set(true)
            audioRecord?.startRecording()
            
            // Start recording thread
            recordingThread = Thread {
                val buffer = ByteArray(bufferSize)
                var totalBytesWritten = 0
                while (isRecording.get()) {
                    val bytesRead = audioRecord?.read(buffer, 0, bufferSize) ?: 0
                    if (bytesRead > 0) {
                        try {
                            fileOutputStream?.write(buffer, 0, bytesRead)
                            totalBytesWritten += bytesRead
                            if (totalBytesWritten % (44100 * 2) == 0) { // Log every second
                                Log.d("WebrtcCallRecorder", "Written $totalBytesWritten bytes to file")
                            }
                        } catch (e: IOException) {
                            Log.e("WebrtcCallRecorder", "Error writing audio data", e)
                        }
                    }
                }
                Log.d("WebrtcCallRecorder", "Recording thread finished. Total bytes written: $totalBytesWritten")
            }
            recordingThread?.start()
            
            Log.d("WebrtcCallRecorder", "Recording started: $path")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e("WebrtcCallRecorder", "Failed to start recording", e)
            promise.reject("START_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        Log.d("WebrtcCallRecorder", "stopRecording called, isRecording: ${isRecording.get()}")
        if (!isRecording.get()) {
            Log.d("WebrtcCallRecorder", "No recording in progress, rejecting promise")
            promise.reject("NOT_RECORDING", "No recording in progress")
            return
        }

        try {
            Log.d("WebrtcCallRecorder", "Setting isRecording to false")
            isRecording.set(false)
            
            // Stop recording
            Log.d("WebrtcCallRecorder", "Stopping AudioRecord")
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
            
            // Wait for recording thread to finish
            Log.d("WebrtcCallRecorder", "Waiting for recording thread to finish")
            recordingThread?.join()
            recordingThread = null
            Log.d("WebrtcCallRecorder", "Recording thread finished")
            
            // Close file and update WAV header with actual file size
            fileOutputStream?.close()
            fileOutputStream = null
            
            val path = outputPath.get()
            if (path != null) {
                // Update WAV header with correct file size
                updateWavHeader(path)
                
                // Verify file exists and get its size
                val file = File(path)
                Log.d("WebrtcCallRecorder", "Recording stopped and saved to: $path")
                Log.d("WebrtcCallRecorder", "File exists: ${file.exists()}")
                Log.d("WebrtcCallRecorder", "File size: ${file.length()} bytes")
                Log.d("WebrtcCallRecorder", "File readable: ${file.canRead()}")
                Log.d("WebrtcCallRecorder", "File writable: ${file.canWrite()}")
                
                promise.resolve(Arguments.createMap().apply {
                    putString("path", path)
                })
            } else {
                promise.reject("NO_OUTPUT_PATH", "No output path available")
            }
        } catch (e: Exception) {
            Log.e("WebrtcCallRecorder", "Failed to stop recording", e)
            promise.reject("STOP_RECORDING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isRecording(promise: Promise) {
        promise.resolve(isRecording.get())
    }

    @ReactMethod
    fun registerAudioTrack(trackId: String, isLocal: Boolean, promise: Promise) {
        Log.d("WebrtcCallRecorder", "Registering audio track: $trackId, isLocal: $isLocal")
        promise.resolve(null)
    }

    @ReactMethod
    fun unregisterAudioTrack(trackId: String, promise: Promise) {
        Log.d("WebrtcCallRecorder", "Unregistering audio track: $trackId")
        promise.resolve(null)
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
        return context.filesDir.absolutePath + "/" + fileName
    }
    
    private fun writeWavHeader(outputStream: FileOutputStream, sampleRate: Int, bitsPerSample: Int, channels: Int) {
        try {
            val byteRate = sampleRate * channels * bitsPerSample / 8
            val blockAlign = channels * bitsPerSample / 8
            
            // WAV header (44 bytes)
            outputStream.write("RIFF".toByteArray())
            outputStream.write(intToByteArray(0)) // File size (will be updated later)
            outputStream.write("WAVE".toByteArray())
            outputStream.write("fmt ".toByteArray())
            outputStream.write(intToByteArray(16)) // Format chunk size
            outputStream.write(shortToByteArray(1)) // Audio format (PCM)
            outputStream.write(shortToByteArray(channels.toShort())) // Number of channels
            outputStream.write(intToByteArray(sampleRate)) // Sample rate
            outputStream.write(intToByteArray(byteRate)) // Byte rate
            outputStream.write(shortToByteArray(blockAlign.toShort())) // Block align
            outputStream.write(shortToByteArray(bitsPerSample.toShort())) // Bits per sample
            outputStream.write("data".toByteArray())
            outputStream.write(intToByteArray(0)) // Data size (will be updated later)
        } catch (e: IOException) {
            Log.e("WebrtcCallRecorder", "Error writing WAV header", e)
        }
    }
    
    private fun updateWavHeader(filePath: String) {
        try {
            val file = File(filePath)
            if (file.exists() && file.length() > 44) {
                val fileSize = file.length().toInt()
                val dataSize = fileSize - 44
                
                val randomAccessFile = java.io.RandomAccessFile(file, "rw")
                
                // Update file size in RIFF header
                randomAccessFile.seek(4)
                randomAccessFile.write(intToByteArray(fileSize - 8))
                
                // Update data size
                randomAccessFile.seek(40)
                randomAccessFile.write(intToByteArray(dataSize))
                
                randomAccessFile.close()
            }
        } catch (e: IOException) {
            Log.e("WebrtcCallRecorder", "Error updating WAV header", e)
        }
    }
    
    private fun intToByteArray(value: Int): ByteArray {
        return byteArrayOf(
            (value and 0xFF).toByte(),
            ((value shr 8) and 0xFF).toByte(),
            ((value shr 16) and 0xFF).toByte(),
            ((value shr 24) and 0xFF).toByte()
        )
    }
    
    private fun shortToByteArray(value: Short): ByteArray {
        return byteArrayOf(
            (value.toInt() and 0xFF).toByte(),
            ((value.toInt() shr 8) and 0xFF).toByte()
        )
    }
}