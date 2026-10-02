/**
 * Settings Store - Zustand
 * 
 * Manages application settings including theme, language, calendar,
 * notifications, and other user preferences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '../lib/database';
import { getCurrentGregorianISO } from '../lib/jalaliDate';
import { AppSettings, DEFAULT_SETTINGS, UpdateSettingsInput } from '../types/settings';
import { UUID } from '../types/common';

interface SettingsState {
  // State
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSettings: (settings: AppSettings) => void;
  updateSettings: (input: UpdateSettingsInput) => Promise<{ success: boolean; settings?: AppSettings; error?: string }>;
  resetSettings: () => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getTheme: () => string;
  getLanguage: () => string;
  getCurrency: () => string;
  getCalendar: () => string;
  areNotificationsEnabled: () => boolean;
  getNotificationThresholds: () => { date: number; odometer: number };
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

// Storage for persistence
const settingsStorage = createJSONStorage<SettingsState>(() => ({
  getItem: async (name) => {
    const fileUri = `${FileSystem.documentDirectory}settings-store.json`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        return content;
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    const fileUri = `${FileSystem.documentDirectory}settings-store.json`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving settings store:', error);
    }
  },
  removeItem: async (name) => {
    const fileUri = `${FileSystem.documentDirectory}settings-store.json`;
    try {
      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      console.error('Error deleting settings store:', error);
    }
  },
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      
      // Actions
      setSettings: (settings) => {
        set({ settings, error: null });
      },
      
      updateSettings: async (input) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const now = new Date();
          const currentSettings = get().settings;
          
          // Update settings
          const updatedSettings: AppSettings = {
            ...currentSettings,
            ...input,
            // Update nested objects properly
            notifications: {
              ...currentSettings.notifications,
              ...input.notifications,
            },
            odometer: {
              ...currentSettings.odometer,
              ...input.odometer,
            },
            date: {
              ...currentSettings.date,
              ...input.date,
            },
            backup: {
              ...currentSettings.backup,
              ...input.backup,
            },
            data: {
              ...currentSettings.data,
              ...input.data,
            },
            sync: {
              ...currentSettings.sync,
              ...input.sync,
            },
            onboarding: {
              ...currentSettings.onboarding,
              ...input.onboarding,
            },
            updatedAt: now.toISOString(),
          };
          
          // Update in database
          const settingsJson = JSON.stringify(updatedSettings);
          
          // Check if settings already exist
          const existing = database.getFirstSync<{ count: number }>(
            'SELECT COUNT(*) as count FROM settings'
          );
          
          if (!existing || existing.count === 0) {
            // Insert new settings
            database.execSync(`
              INSERT INTO settings (id, settings, created_at, updated_at)
              VALUES (?, ?, ?, ?)
            `, [uuidv4(), settingsJson, now.toISOString(), now.toISOString()]);
          } else {
            // Update existing settings
            database.execSync(`
              UPDATE settings SET settings = ?, updated_at = ?
            `, [settingsJson, now.toISOString()]);
          }
          
          set({
            settings: updatedSettings,
            isLoading: false,
          });
          
          return { success: true, settings: updatedSettings };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی تنظیمات';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      resetSettings: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          
          // Delete from database
          database.execSync('DELETE FROM settings');
          
          set({
            settings: DEFAULT_SETTINGS,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در ریست تنظیمات';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      // Getters
      getTheme: () => {
        return get().settings.theme;
      },
      
      getLanguage: () => {
        return get().settings.language;
      },
      
      getCurrency: () => {
        return get().settings.currency;
      },
      
      getCalendar: () => {
        return get().settings.calendar;
      },
      
      areNotificationsEnabled: () => {
        return get().settings.notifications.enabled;
      },
      
      getNotificationThresholds: () => {
        const settings = get().settings;
        return {
          date: settings.notifications.dateWarningThreshold,
          odometer: settings.odometer.warningThreshold,
        };
      },
      
      // Initialize from database
      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const row = database.getFirstSync<{ settings: string }>(
            'SELECT settings FROM settings LIMIT 1'
          );
          
          if (row && row.settings) {
            const settings: AppSettings = JSON.parse(row.settings);
            set({
              settings,
              isLoading: false,
            });
          } else {
            // No settings in database, use defaults
            set({
              settings: DEFAULT_SETTINGS,
              isLoading: false,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری تنظیمات';
          set({
            settings: DEFAULT_SETTINGS,
            isLoading: false,
            error: errorMessage,
          });
        }
      },
      
      reset: () => {
        set({
          settings: DEFAULT_SETTINGS,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'settings-store',
      storage: settingsStorage,
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// Selectors for better performance
export const useTheme = () => useSettingsStore(state => state.getTheme());
export const useLanguage = () => useSettingsStore(state => state.getLanguage());
export const useCurrency = () => useSettingsStore(state => state.getCurrency());
export const useCalendar = () => useSettingsStore(state => state.getCalendar());
export const useNotificationsEnabled = () => 
  useSettingsStore(state => state.areNotificationsEnabled());
export const useNotificationThresholds = () =>
  useSettingsStore(state => state.getNotificationThresholds());
