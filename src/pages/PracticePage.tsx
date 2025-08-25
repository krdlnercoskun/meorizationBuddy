import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, RotateCcw, CheckCircle, Settings } from 'lucide-react';
import { MemorizedText, PracticeSession, ComparisonResult } from '../types';
import { storageService } from '../services/storageService';
import { TextComparisonEngine } from '../services/textComparison';
import { VoiceRecorder } from '../components/VoiceRecorder/VoiceRecorder';

export const PracticePage: React.FC = () => {
  const { textId } = useParams<{ textId: string }>();
  const navigate = useNavigate();
  
  const [text, setText] = useState<MemorizedText | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [finalRecognizedText, setFinalRecognizedText] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (textId) {
      loadText(textId);
    } else {
      navigate('/');
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [textId, navigate]);

  const loadText = async (id: string) => {
    try {
      const memorizedText = await storageService.getText(id);
      if (memorizedText) {
        setText(memorizedText);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load text:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setStartTime(new Date());
    setRecognizedText('');
    setFinalRecognizedText('');
    setIsComplete(false);
    
    // Start timer
    timerRef.current = setInterval(() => {
      if (startTime) {
        setDuration(Date.now() - startTime.getTime());
      }
    }, 100);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Auto-complete if we have recognized text
    if (finalRecognizedText.trim()) {
      handleComplete();
    }
  };

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setFinalRecognizedText(prev => prev + ' ' + transcript);
      setRecognizedText('');
    } else {
      setRecognizedText(transcript);
    }
  };

  const handleComplete = async () => {
    if (!text || !startTime) return;
    
    setIsComplete(true);
    
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      textId: text.id,
      startTime,
      endTime: new Date(),
      recognizedText: finalRecognizedText.trim(),
      accuracy: 0, // Will be calculated
      errors: [],
      duration
    };

    // Compare texts and calculate results
    const comparisonResult = TextComparisonEngine.compareTexts(
      text.content,
      finalRecognizedText.trim(),
      text.language
    );
    
    session.accuracy = comparisonResult.accuracy;
    session.errors = comparisonResult.errors;

    try {
      // Save session
      await storageService.saveSession(session);
      
      // Update text statistics
      await storageService.updateTextStats(
        text.id,
        text.practiceCount + 1,
        comparisonResult.accuracy
      );
      
      // Navigate to results
      navigate(`/results/${session.id}`);
    } catch (error) {
      console.error('Failed to save practice session:', error);
      alert('Failed to save practice session. Please try again.');
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    setRecognizedText('');
    setFinalRecognizedText('');
    setStartTime(null);
    setDuration(0);
    setIsComplete(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Text not found</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <div className="text-sm text-gray-600">
              Language: {text.language} • Practice #{text.practiceCount + 1}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="text-lg font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded">
            {formatDuration(duration)}
          </div>
          
          {/* Controls */}
          <button
            onClick={() => setShowReference(!showReference)}
            className={`p-2 rounded-lg transition-colors ${
              showReference ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={showReference ? 'Hide reference' : 'Show reference'}
          >
            {showReference ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset practice"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Reference Text */}
        {showReference && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reference Text</h2>
            <div 
              className="text-lg leading-relaxed text-gray-700"
              dir={text.language === 'arabic' ? 'rtl' : 'ltr'}
            >
              {text.content}
            </div>
          </div>
        )}

        {/* Recording Interface */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isRecording ? 'Recording...' : 'Ready to Practice'}
            </h2>
            
            <VoiceRecorder
              onTranscript={handleTranscript}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onError={(error) => alert(error)}
              language={text.language}
              disabled={isComplete}
            />

            {/* Live Transcript */}
            {(recognizedText || finalRecognizedText) && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recognized Speech:</h3>
                <div 
                  className="text-gray-900"
                  dir={text.language === 'arabic' ? 'rtl' : 'ltr'}
                >
                  <span className="text-gray-900">{finalRecognizedText}</span>
                  {recognizedText && (
                    <span className="text-gray-500 italic"> {recognizedText}</span>
                  )}
                </div>
              </div>
            )}

            {/* Complete Button */}
            {!isRecording && finalRecognizedText.trim() && !isComplete && (
              <button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Complete & Review
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Practice</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Click the microphone to start recording your recitation</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Speak clearly and at a natural pace</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Toggle the eye icon to hide/show the reference text</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Click "Complete & Review" when finished to see detailed results</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};