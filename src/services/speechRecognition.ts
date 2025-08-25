export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    } else {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (this.onResultCallback) {
        this.onResultCallback(finalTranscript || interimTranscript, !!finalTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  public setLanguage(language: string) {
    if (!this.recognition) return;
    
    const languageCodes: Record<string, string> = {
      'latin': 'en-US',
      'turkish': 'tr-TR',
      'arabic': 'ar-SA'
    };

    this.recognition.lang = languageCodes[language] || 'en-US';
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition || this.isListening) return;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to start speech recognition');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}