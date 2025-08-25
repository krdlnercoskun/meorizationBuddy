import { openDB, IDBPDatabase } from 'idb';
import { MemorizedText, PracticeSession, AppSettings } from '../types';

class StorageService {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'MemorizationBuddy';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create stores
        if (!db.objectStoreNames.contains('texts')) {
          const textStore = db.createObjectStore('texts', { keyPath: 'id' });
          textStore.createIndex('language', 'language');
          textStore.createIndex('createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('textId', 'textId');
          sessionStore.createIndex('startTime', 'startTime');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      }
    });
  }

  // Memorized Texts
  async saveText(text: MemorizedText): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('texts', text);
  }

  async getText(id: string): Promise<MemorizedText | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('texts', id);
  }

  async getAllTexts(): Promise<MemorizedText[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('texts');
  }

  async deleteText(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('texts', id);
    // Also delete related sessions
    const sessions = await this.getSessionsForText(id);
    for (const session of sessions) {
      await this.deleteSession(session.id);
    }
  }

  async updateTextStats(id: string, practiceCount: number, accuracy?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const text = await this.getText(id);
    if (text) {
      text.practiceCount = practiceCount;
      text.lastPracticed = new Date();
      if (accuracy !== undefined && (!text.bestAccuracy || accuracy > text.bestAccuracy)) {
        text.bestAccuracy = accuracy;
      }
      await this.saveText(text);
    }
  }

  // Practice Sessions
  async saveSession(session: PracticeSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('sessions', session);
  }

  async getSessionsForText(textId: string): Promise<PracticeSession[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('sessions', 'textId', textId);
  }

  async deleteSession(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('sessions', id);
  }

  async getRecentSessions(limit: number = 10): Promise<PracticeSession[]> {
    if (!this.db) throw new Error('Database not initialized');
    const sessions = await this.db.getAll('sessions');
    return sessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  // Settings
  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', { key: 'app', ...settings });
  }

  async getSettings(): Promise<AppSettings> {
    if (!this.db) throw new Error('Database not initialized');
    const stored = await this.db.get('settings', 'app');
    
    // Default settings
    const defaults: AppSettings = {
      language: 'en',
      theme: 'light',
      fontSize: 'medium',
      showDiacritics: true,
      autoScroll: true,
      soundEnabled: true,
      cloudSync: false,
      respectfulMode: true
    };

    return stored ? { ...defaults, ...stored } : defaults;
  }

  // Import/Export
  async exportData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const data = {
      texts: await this.getAllTexts(),
      sessions: await this.db.getAll('sessions'),
      settings: await this.getSettings(),
      exportDate: new Date().toISOString(),
      version: this.DB_VERSION
    };

    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const data = JSON.parse(jsonData);
      
      if (data.texts) {
        for (const text of data.texts) {
          await this.saveText(text);
        }
      }

      if (data.sessions) {
        for (const session of data.sessions) {
          await this.saveSession(session);
        }
      }

      if (data.settings) {
        await this.saveSettings(data.settings);
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }
}

export const storageService = new StorageService();