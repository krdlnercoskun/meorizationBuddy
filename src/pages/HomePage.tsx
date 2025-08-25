import React, { useState, useEffect } from 'react';
import { Plus, Book, Clock, TrendingUp, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MemorizedText } from '../types';
import { storageService } from '../services/storageService';
import { AccuracyIndicator } from '../components/AccuracyIndicator/AccuracyIndicator';

export const HomePage: React.FC = () => {
  const [texts, setTexts] = useState<MemorizedText[]>([]);
  const [filteredTexts, setFilteredTexts] = useState<MemorizedText[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'accuracy' | 'title'>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTexts();
  }, []);

  useEffect(() => {
    filterAndSortTexts();
  }, [texts, searchQuery, filterLanguage, sortBy]);

  const loadTexts = async () => {
    try {
      const savedTexts = await storageService.getAllTexts();
      setTexts(savedTexts);
    } catch (error) {
      console.error('Failed to load texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTexts = () => {
    let filtered = [...texts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(text =>
        text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        text.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Language filter
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(text => text.language === filterLanguage);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'accuracy':
          return (b.bestAccuracy || 0) - (a.bestAccuracy || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.lastPracticed || b.createdAt).getTime() - 
                 new Date(a.lastPracticed || a.createdAt).getTime();
      }
    });

    setFilteredTexts(filtered);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLanguageLabel = (language: string) => {
    const labels: Record<string, string> = {
      'latin': 'Latin',
      'turkish': 'Turkish',
      'arabic': 'Arabic'
    };
    return labels[language] || language;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Memorization Buddy
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master any text through intelligent practice and speech recognition
        </p>
      </div>

      {/* Quick Stats */}
      {texts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Book className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{texts.length}</div>
            <div className="text-sm text-gray-600">Texts Memorized</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {texts.reduce((sum, text) => sum + text.practiceCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Practice Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {texts.length > 0 ? 
                Math.round(texts.reduce((sum, text) => sum + (text.bestAccuracy || 0), 0) / texts.length * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Accuracy</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search texts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Languages</option>
          <option value="latin">Latin</option>
          <option value="turkish">Turkish</option>
          <option value="arabic">Arabic</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Recently Practiced</option>
          <option value="accuracy">Best Accuracy</option>
          <option value="title">Title A-Z</option>
        </select>

        <Link
          to="/add-text"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Text
        </Link>
      </div>

      {/* Text Grid */}
      {filteredTexts.length === 0 ? (
        <div className="text-center py-12">
          {texts.length === 0 ? (
            <div>
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No texts yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first text to start memorizing
              </p>
              <Link
                to="/add-text"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Text
              </Link>
            </div>
          ) : (
            <div>
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No texts match your filters
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTexts.map((text) => (
            <div
              key={text.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {text.title}
                  </h3>
                  {text.bestAccuracy && (
                    <AccuracyIndicator 
                      accuracy={text.bestAccuracy} 
                      size="small" 
                      showLabel={false}
                    />
                  )}
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {text.content}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {getLanguageLabel(text.language)}
                  </span>
                  <span>
                    {text.lastPracticed ? 
                      `Last: ${formatDate(text.lastPracticed)}` : 
                      `Added: ${formatDate(text.createdAt)}`
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {text.practiceCount} practice{text.practiceCount !== 1 ? 's' : ''}
                  </div>
                  <Link
                    to={`/practice/${text.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Practice
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};