import { createWorker } from 'tesseract.js';
import { OCRResult } from '../types';

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize(language: 'eng' | 'tur' | 'ara' = 'eng'): Promise<void> {
    this.worker = await createWorker(language);
  }

  async recognizeText(imageFile: File | HTMLCanvasElement): Promise<OCRResult> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data } = await this.worker.recognize(imageFile);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence / 100,
        language: data.text ? this.detectLanguage(data.text) : undefined
      };
    } catch (error) {
      throw new Error(`OCR recognition failed: ${error}`);
    }
  }

  async processWebcamImage(video: HTMLVideoElement): Promise<OCRResult> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return this.recognizeText(canvas);
  }

  private detectLanguage(text: string): string {
    const arabicPattern = /[\u0600-\u06FF]/;
    const turkishPattern = /[çğıöşüÇĞIİÖŞÜ]/;

    if (arabicPattern.test(text)) return 'arabic';
    if (turkishPattern.test(text)) return 'turkish';
    return 'latin';
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}