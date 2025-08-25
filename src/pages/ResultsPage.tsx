import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, BarChart3, Target, AlertCircle, RefreshCw } from 'lucide-react';
import { PracticeSession, MemorizedText, ComparisonResult } from '../types';
import { storageService } from '../services/storageService';
import { TextComparisonEngine } from '../services/textComparison';
import { ExportService } from '../services/exportService';
import { AccuracyIndicator } from '../components/AccuracyIndicator/AccuracyIndicator';
import { TextHighlighter } from '../components/TextHighlighter/TextHighlighter';

export const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [text, setText] = useState<MemorizedText | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReference, setShowReference] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    } else {
      navigate('/');
    }
  }, [sessionId, navigate]);

  const loadSessionData = async (id: string) => {
    try {
      // Load all sessions and find the one we need
      const allSessions = await storageService.db?.getAll('sessions') || [];
      const practiceSession = allSessions.find(s => s.id === id);
      
      if (!practiceSession) {
        navigate('/');
        return;
      }

      const memorizedText = await storageService.getText(practiceSession.textId);
      if (!memorizedText) {
        navigate('/');
        return;
      }

      // Re-calculate comparison for display
      const comparison = TextComparisonEngine.compareTexts(
        memorizedText.content,
        practiceSession.recognizedText,
        memorizedText.language
      );

      setSession(practiceSession);
      setText(memorizedText);
      setComparisonResult(comparison);
    } catch (error) {
      console.error('Failed to load session data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!text || !session || !comparisonResult) return;
    
    try {
      await ExportService.exportToPDF(text, session, comparisonResult);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportHighlighted = async () => {
    if (!text) return;
    
    try {
      await ExportService.exportHighlightedText(
        'highlighted-text',
        `${text.title}_highlighted`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyMessage = (accuracy: number) => {
    if (accuracy >= 0.95) return 'Excellent! Nearly perfect recitation.';
    if (accuracy >= 0.9) return 'Great job! Very accurate recitation.';
    if (accuracy >= 0.8) return 'Good work! Minor improvements needed.';
    if (accuracy >= 0.7) return 'Fair performance. Keep practicing!';
    return 'Needs improvement. Focus on accuracy.';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !text || !comparisonResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h1>
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
    <div className="max-w-6xl mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Practice Results</h1>
            <div className="text-gray-600">
              {text.title} • {new Date(session.startTime).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/practice/${text.id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Practice Again
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AccuracyIndicator accuracy={comparisonResult.accuracy} size="large" showLabel={false} />
          <div className="mt-2">
            <div className={`text-lg font-bold ${getAccuracyColor(comparisonResult.accuracy)}`}>
              Overall Score
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {getAccuracyMessage(comparisonResult.accuracy)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {comparisonResult.statistics.totalWords}
          </div>
          <div className="text-sm text-gray-600">Total Words</div>
          <div className="text-xs text-green-600 mt-1">
            {comparisonResult.statistics.correctWords} correct
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(session.duration)}
          </div>
          <div className="text-sm text-gray-600">Duration</div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(comparisonResult.statistics.totalWords / (session.duration / 60000))} WPM
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {comparisonResult.statistics.errorCount}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
          <div className="text-xs text-yellow-600 mt-1">
            +{comparisonResult.statistics.nearMissCount} near misses
          </div>
        </div>
      </div>

      {/* Text Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Text Analysis</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showReference}
                onChange={(e) => setShowReference(e.target.checked)}
                className="rounded"
              />
              Show reference text
            </label>
            <button
              onClick={handleExportHighlighted}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Image
            </button>
          </div>
        </div>

        <TextHighlighter
          tokens={comparisonResult.alignedTokens}
          showReference={showReference}
          onTokenClick={(token) => {
            // Could implement token-specific feedback here
            console.log('Token clicked:', token);
          }}
        />
      </div>

      {/* Error Analysis */}
      {comparisonResult.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Analysis ({comparisonResult.errors.length} issues)
          </h2>
          
          <div className="space-y-3">
            {comparisonResult.errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  error.severity === 'high' ? 'border-red-500 bg-red-50' :
                  error.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {error.type} Error
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Expected: <span className="font-mono bg-gray-100 px-1 rounded">"{error.expected}"</span>
                      {error.actual && (
                        <>
                          {' → '}
                          Recognized: <span className="font-mono bg-gray-100 px-1 rounded">"{error.actual}"</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    error.severity === 'high' ? 'bg-red-100 text-red-800' :
                    error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {error.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Results</h2>
        <div className="flex gap-4">
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </button>
          <button
            onClick={handleExportHighlighted}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Save Highlighted Text
          </button>
        </div>
      </div>
    </div>
  );
};