import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { storageService } from '../services/storageService';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    theme: 'light',
    fontSize: 'medium',
    showDiacritics: true,
    autoScroll: true,
    soundEnabled: true,
    cloudSync: false,
    respectfulMode: true
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storageService.getSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      await storageService.saveSettings(updated);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert on error
      setSettings(settings);
      throw error;
    }
  };

  return {
    settings,
    updateSettings,
    loading
  };
};