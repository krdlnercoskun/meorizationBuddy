import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Type, Camera, FileText, ArrowLeft, Save } from 'lucide-react';
import { MemorizedText } from '../types';
import { storageService } from '../services/storageService';
import { OCRService } from '../services/ocrService';

export const AddTextPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'type' | 'upload' | 'scan'>('type');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'latin' | 'turkish' | 'arabic'>('latin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrService] = useState(() => new OCRService());
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const handleSaveText = async () => {
    if (!title.trim() || !text.trim()) {
      alert('Please provide both title and text content');
      return;
    }

    const memorizedText: MemorizedText = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: text.trim(),
      language,
      createdAt: new Date(),
      practiceCount: 0
    };

    try {
      await storageService.saveText(memorizedText);
      navigate('/');
    } catch (error) {
      console.error('Failed to save text:', error);
      alert('Failed to save text. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      if (file.type === 'text/plain') {
        const content = await file.text();
        setText(content);
        if (!title) {
          setTitle(file.name.replace('.txt', ''));
        }
      } else if (file.type === 'application/pdf') {
        // For PDF files, we would need a PDF library like pdf-parse
        alert('PDF support coming soon! Please use text files for now.');
      } else if (file.type.startsWith('image/')) {
        // OCR processing
        await ocrService.initialize(getOCRLanguage());
        const result = await ocrService.recognizeText(file);
        setText(result.text);
        if (!title) {
          setTitle(file.name.split('.')[0]);
        }
        if (result.language) {
          setLanguage(result.language as any);
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startWebcamCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setVideoStream(stream);
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const captureImage = async () => {
    if (!videoStream) return;

    const video = document.getElementById('webcam-video') as HTMLVideoElement;
    if (!video) return;

    setIsProcessing(true);
    try {
      await ocrService.initialize(getOCRLanguage());
      const result = await ocrService.processWebcamImage(video);
      setText(result.text);
      if (result.language) {
        setLanguage(result.language as any);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      stopWebcamCapture();
    }
  };

  const stopWebcamCapture = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const getOCRLanguage = (): 'eng' | 'tur' | 'ara' => {
    switch (language) {
      case 'turkish': return 'tur';
      case 'arabic': return 'ara';
      default: return 'eng';
    }
  };

  const TabButton = ({ 
    id, 
    icon: Icon, 
    label, 
    active 
  }: { 
    id: string; 
    icon: any; 
    label: string; 
    active: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Text</h1>
      </div>

      {/* Input Method Tabs */}
      <div className="flex gap-2 mb-8">
        <TabButton id="type" icon={Type} label="Type Text" active={activeTab === 'type'} />
        <TabButton id="upload" icon={Upload} label="Upload File" active={activeTab === 'upload'} />
        <TabButton id="scan" icon={Camera} label="Scan Text" active={activeTab === 'scan'} />
      </div>

      {/* Content based on active tab */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="latin">Latin</option>
                <option value="turkish">Turkish</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Input Method Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                dir={language === 'arabic' ? 'rtl' : 'ltr'}
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload a file
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports .txt files and images for OCR
                </p>
                <input
                  type="file"
                  accept=".txt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Choose File
                </label>
              </div>
              
              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Processing file...</p>
                </div>
              )}

              {text && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text (you can edit this)
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    dir={language === 'arabic' ? 'rtl' : 'ltr'}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'scan' && (
            <div>
              {!videoStream ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Scan text with camera
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Use your device's camera to scan and extract text
                  </p>
                  <button
                    onClick={startWebcamCapture}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <video
                    id="webcam-video"
                    autoPlay
                    playsInline
                    muted
                    ref={(video) => {
                      if (video && videoStream) {
                        video.srcObject = videoStream;
                      }
                    }}
                    className="w-full max-w-md mx-auto rounded-lg mb-4"
                  />
                  <div className="space-x-4">
                    <button
                      onClick={captureImage}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Capture & Extract'}
                    </button>
                    <button
                      onClick={stopWebcamCapture}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {text && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text (you can edit this)
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    dir={language === 'arabic' ? 'rtl' : 'ltr'}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveText}
            disabled={!title.trim() || !text.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Text
          </button>
        </div>
      </div>
    </div>
  );
};