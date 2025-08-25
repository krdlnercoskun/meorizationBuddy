// Core types for the memorization app
export interface MemorizedText {
  id: string;
  title: string;
  content: string;
  language: 'latin' | 'turkish' | 'arabic';
  createdAt: Date;
  lastPracticed?: Date;
  practiceCount: number;
  bestAccuracy?: number;
  tags?: string[];
}

export interface PracticeSession {
  id: string;
  textId: string;
  startTime: Date;
  endTime?: Date;
  recognizedText: string;
  accuracy: number;
  errors: TextError[];
  duration: number;
}

export interface TextError {
  type: 'missing' | 'extra' | 'substitution';
  expected: string;
  actual: string;
  position: number;
  severity: 'high' | 'medium' | 'low';
}

export interface ComparisonResult {
  accuracy: number;
  alignedTokens: AlignedToken[];
  errors: TextError[];
  statistics: {
    totalWords: number;
    correctWords: number;
    errorCount: number;
    nearMissCount: number;
  };
}

export interface AlignedToken {
  reference: string;
  recognized: string;
  status: 'correct' | 'error' | 'near-miss' | 'missing' | 'extra';
  confidence: number;
  position: number;
}

export interface AppSettings {
  language: 'en' | 'tr' | 'ar';
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  showDiacritics: boolean;
  autoScroll: boolean;
  soundEnabled: boolean;
  cloudSync: boolean;
  respectfulMode: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}