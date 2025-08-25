import { ComparisonResult, AlignedToken, TextError } from '../types';

export class TextComparisonEngine {
  private static readonly SIMILARITY_THRESHOLD = 0.7;
  private static readonly NEAR_MISS_THRESHOLD = 0.5;

  /**
   * Compare reference text with recognized speech using dynamic programming
   */
  static compareTexts(referenceText: string, recognizedText: string, language: string): ComparisonResult {
    const referenceTokens = this.tokenize(referenceText, language);
    const recognizedTokens = this.tokenize(recognizedText, language);

    const alignment = this.alignTokensDP(referenceTokens, recognizedTokens);
    const errors = this.extractErrors(alignment);
    const statistics = this.calculateStatistics(alignment);

    return {
      accuracy: statistics.totalWords > 0 ? statistics.correctWords / statistics.totalWords : 0,
      alignedTokens: alignment,
      errors,
      statistics
    };
  }

  /**
   * Tokenize text based on language requirements
   */
  private static tokenize(text: string, language: string): string[] {
    // Handle RTL languages differently
    if (language === 'arabic') {
      return text.trim()
        .replace(/[.،؛:!؟]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 0)
        .map(token => this.normalizeArabic(token));
    }

    return text.trim()
      .toLowerCase()
      .replace(/[.،؛:!؟,;:!?]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Normalize Arabic text for better comparison
   */
  private static normalizeArabic(text: string): string {
    return text
      .replace(/[ًٌٍَُِْ]/g, '') // Remove diacritics for comparison
      .replace(/[إأآ]/g, 'ا') // Normalize alef variations
      .replace(/[ؤ]/g, 'و') // Normalize waw
      .replace(/[ئ]/g, 'ي') // Normalize yaa
      .replace(/[ة]/g, 'ه'); // Normalize taa marbuta
  }

  /**
   * Align tokens using dynamic programming (Wagner-Fischer algorithm)
   */
  private static alignTokensDP(reference: string[], recognized: string[]): AlignedToken[] {
    const m = reference.length;
    const n = recognized.length;
    
    // Create DP table
    const dp = Array(m + 1).fill(null).map(() => 
      Array(n + 1).fill(null).map(() => ({ cost: 0, operation: '', refIdx: -1, recIdx: -1 }))
    );

    // Initialize base cases
    for (let i = 0; i <= m; i++) {
      dp[i][0] = { cost: i, operation: 'delete', refIdx: i - 1, recIdx: -1 };
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = { cost: j, operation: 'insert', refIdx: -1, recIdx: j - 1 };
    }

    // Fill DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const similarity = this.calculateSimilarity(reference[i - 1], recognized[j - 1]);
        const substitutionCost = similarity > this.SIMILARITY_THRESHOLD ? 0 : 1;

        const costs = [
          { cost: dp[i - 1][j].cost + 1, operation: 'delete', refIdx: i - 1, recIdx: -1 },
          { cost: dp[i][j - 1].cost + 1, operation: 'insert', refIdx: -1, recIdx: j - 1 },
          { cost: dp[i - 1][j - 1].cost + substitutionCost, operation: substitutionCost === 0 ? 'match' : 'substitute', refIdx: i - 1, recIdx: j - 1 }
        ];

        dp[i][j] = costs.reduce((min, current) => current.cost < min.cost ? current : min);
      }
    }

    // Backtrack to create alignment
    return this.backtrackAlignment(dp, reference, recognized);
  }

  /**
   * Backtrack through DP table to create alignment
   */
  private static backtrackAlignment(dp: any[][], reference: string[], recognized: string[]): AlignedToken[] {
    const alignment: AlignedToken[] = [];
    let i = reference.length;
    let j = recognized.length;

    while (i > 0 || j > 0) {
      const cell = dp[i][j];
      
      switch (cell.operation) {
        case 'match':
          alignment.unshift({
            reference: reference[i - 1],
            recognized: recognized[j - 1],
            status: 'correct',
            confidence: 1.0,
            position: i - 1
          });
          i--; j--;
          break;
          
        case 'substitute':
          const similarity = this.calculateSimilarity(reference[i - 1], recognized[j - 1]);
          alignment.unshift({
            reference: reference[i - 1],
            recognized: recognized[j - 1],
            status: similarity > this.NEAR_MISS_THRESHOLD ? 'near-miss' : 'error',
            confidence: similarity,
            position: i - 1
          });
          i--; j--;
          break;
          
        case 'delete':
          alignment.unshift({
            reference: reference[i - 1],
            recognized: '',
            status: 'missing',
            confidence: 0,
            position: i - 1
          });
          i--;
          break;
          
        case 'insert':
          alignment.unshift({
            reference: '',
            recognized: recognized[j - 1],
            status: 'extra',
            confidence: 0,
            position: -1
          });
          j--;
          break;
      }
    }

    return alignment;
  }

  /**
   * Calculate similarity between two tokens using Levenshtein distance
   */
  private static calculateSimilarity(token1: string, token2: string): number {
    if (token1 === token2) return 1.0;
    if (!token1 || !token2) return 0.0;

    const maxLength = Math.max(token1.length, token2.length);
    const distance = this.levenshteinDistance(token1, token2);
    
    return Math.max(0, (maxLength - distance) / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  /**
   * Extract errors from alignment
   */
  private static extractErrors(alignment: AlignedToken[]): TextError[] {
    return alignment
      .filter(token => token.status !== 'correct')
      .map(token => ({
        type: token.status === 'missing' ? 'missing' : 
              token.status === 'extra' ? 'extra' : 'substitution',
        expected: token.reference,
        actual: token.recognized,
        position: token.position,
        severity: token.confidence < 0.3 ? 'high' : 
                 token.confidence < 0.6 ? 'medium' : 'low'
      }));
  }

  /**
   * Calculate statistics from alignment
   */
  private static calculateStatistics(alignment: AlignedToken[]) {
    const totalWords = alignment.filter(t => t.reference).length;
    const correctWords = alignment.filter(t => t.status === 'correct').length;
    const errorCount = alignment.filter(t => t.status === 'error').length;
    const nearMissCount = alignment.filter(t => t.status === 'near-miss').length;

    return {
      totalWords,
      correctWords,
      errorCount,
      nearMissCount
    };
  }
}