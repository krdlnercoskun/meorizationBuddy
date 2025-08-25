import '@testing-library/jest-dom';

// Mock Web Speech API
Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    maxAlternatives = 1;
    
    onresult: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onend: (() => void) | null = null;
    onstart: (() => void) | null = null;
    
    start() {
      setTimeout(() => {
        if (this.onstart) this.onstart();
      }, 100);
    }
    
    stop() {
      setTimeout(() => {
        if (this.onend) this.onend();
      }, 100);
    }
  }
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [],
    }),
  },
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  writable: true,
  value: jest.fn(() => 'mock-uuid-1234'),
});

// Mock IndexedDB
const mockIDB = {
  open: jest.fn().mockResolvedValue({
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        add: jest.fn(),
        put: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
      }),
    }),
  }),
};

(global as any).indexedDB = mockIDB;