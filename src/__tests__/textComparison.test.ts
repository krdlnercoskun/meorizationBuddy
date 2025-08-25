import { TextComparisonEngine } from '../services/textComparison';

describe('TextComparisonEngine', () => {
  describe('compareTexts', () => {
    test('should return 100% accuracy for identical texts', () => {
      const reference = 'Hello world this is a test';
      const recognized = 'Hello world this is a test';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBe(1.0);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.correctWords).toBe(6);
    });

    test('should handle missing words correctly', () => {
      const reference = 'Hello world this is a test';
      const recognized = 'Hello world this is test';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBeLessThan(1.0);
      expect(result.errors.some(e => e.type === 'missing')).toBeTruthy();
      expect(result.statistics.correctWords).toBe(5);
    });

    test('should handle extra words correctly', () => {
      const reference = 'Hello world test';
      const recognized = 'Hello world this is a test';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBeLessThan(1.0);
      expect(result.errors.some(e => e.type === 'extra')).toBeTruthy();
    });

    test('should handle substitution errors correctly', () => {
      const reference = 'Hello world this is a test';
      const recognized = 'Hello world that was a test';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBeLessThan(1.0);
      expect(result.errors.some(e => e.type === 'substitution')).toBeTruthy();
      expect(result.statistics.correctWords).toBe(4); // Hello, world, a, test
    });

    test('should detect near-misses for similar words', () => {
      const reference = 'testing';
      const recognized = 'test';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.alignedTokens[0].status).toBe('near-miss');
      expect(result.statistics.nearMissCount).toBe(1);
    });

    test('should handle empty recognized text', () => {
      const reference = 'Hello world';
      const recognized = '';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBe(0);
      expect(result.errors).toHaveLength(2); // All words missing
      expect(result.errors.every(e => e.type === 'missing')).toBeTruthy();
    });

    test('should handle Arabic text correctly', () => {
      const reference = 'مرحبا بالعالم';
      const recognized = 'مرحبا بالعالم';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'arabic');
      
      expect(result.accuracy).toBe(1.0);
      expect(result.statistics.correctWords).toBe(2);
    });

    test('should normalize Arabic text for comparison', () => {
      const reference = 'الحمد'; // Without diacritics
      const recognized = 'الْحَمْد'; // With diacritics
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'arabic');
      
      // Should be considered correct after normalization
      expect(result.accuracy).toBeGreaterThan(0.8);
    });

    test('should handle mixed case in Latin text', () => {
      const reference = 'Hello World';
      const recognized = 'hello world';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBe(1.0);
    });

    test('should handle punctuation correctly', () => {
      const reference = 'Hello, world!';
      const recognized = 'Hello world';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBe(1.0); // Punctuation should be ignored
    });
  });

  describe('edge cases', () => {
    test('should handle single word comparison', () => {
      const reference = 'word';
      const recognized = 'word';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      expect(result.accuracy).toBe(1.0);
      expect(result.statistics.totalWords).toBe(1);
    });

    test('should handle very long texts', () => {
      const longText = 'word '.repeat(1000).trim();
      
      const result = TextComparisonEngine.compareTexts(longText, longText, 'latin');
      
      expect(result.accuracy).toBe(1.0);
      expect(result.statistics.totalWords).toBe(1000);
    });

    test('should handle special characters', () => {
      const reference = 'test@example.com';
      const recognized = 'test at example dot com';
      
      const result = TextComparisonEngine.compareTexts(reference, recognized, 'latin');
      
      // Should detect as different
      expect(result.accuracy).toBeLessThan(1.0);
    });
  });
});