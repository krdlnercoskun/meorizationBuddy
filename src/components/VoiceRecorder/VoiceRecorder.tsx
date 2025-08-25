import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { SpeechRecognitionService } from '../../services/speechRecognition';

interface VoiceRecorderProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  language: string;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onStart,
  onStop,
  onError,
  language,
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    speechServiceRef.current = new SpeechRecognitionService();
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopListening();
      }
      stopAudioLevelMonitoring();
    };
  }, []);

  useEffect(() => {
    if (speechServiceRef.current) {
      speechServiceRef.current.setLanguage(language);
    }
  }, [language]);

  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.warn('Could not access microphone for level monitoring');
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleStartRecording = () => {
    if (!speechServiceRef.current?.isSupported()) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setIsRecording(true);
    onStart?.();

    speechServiceRef.current.startListening(
      (text, isFinal) => {
        onTranscript(text, isFinal);
      },
      (error) => {
        setError(error);
        setIsRecording(false);
        onError?.(error);
        stopAudioLevelMonitoring();
      },
      () => {
        setIsRecording(false);
        onStop?.();
        stopAudioLevelMonitoring();
      }
    );

    startAudioLevelMonitoring();
  };

  const handleStopRecording = () => {
    if (speechServiceRef.current) {
      speechServiceRef.current.stopListening();
    }
    setIsRecording(false);
    stopAudioLevelMonitoring();
    onStop?.();
  };

  const getButtonClasses = () => {
    const baseClasses = 'flex items-center justify-center p-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-4';
    
    if (disabled) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (isRecording) {
      return `${baseClasses} bg-red-500 hover:bg-red-600 text-white focus:ring-red-200 shadow-lg transform scale-105`;
    }
    
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-200 shadow-md`;
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Main Record Button */}
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled}
        className={getButtonClasses()}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <Square className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-100 ease-out"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-600 text-sm mt-2 max-w-xs text-center">
            {error}
          </div>
        )}
        
        {!isRecording && !error && (
          <span className="text-gray-500 text-sm">
            Click to start recording
          </span>
        )}
      </div>

      {/* Speech Recognition Support Info */}
      {!speechServiceRef.current?.isSupported() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <p className="text-yellow-800 text-sm">
            Speech recognition is not supported in this browser. Please try Chrome or Edge for the best experience.
          </p>
        </div>
      )}
    </div>
  );
};