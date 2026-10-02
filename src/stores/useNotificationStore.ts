/**
 * Notification Store - Zustand
 * 
 * Manages local notifications using Expo Notifications API.
 * Handles scheduling, cancellation, and permission management for maintenance reminders.
 */

import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../types/reminder';

// Notification channels for Android
const ANDROID_CHANNELS = {
  DEFAULT: {
    id: 'khodroyar-default',
    name: 'یادآوری‌های خودرویار',
    description: 'یادآوری‌های سرویس و نگهداری خودرو',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1e3a8a',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  },
  SERVICE: {
    id: 'khodroyar-service',
    name: 'سرویس خودرو',
    description: 'یادآوری‌های سرویس دوره‌ای خودرو',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#06b6d4',
  },
  INSURANCE: {
    id: 'khodroyar-insurance',
    name: 'بیمه خودرو',
    description: 'یادآوری‌های تمدید بیمه خودرو',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#ea580c',
  },
  INSPECTION: {
    id: 'khodroyar-inspection',
    name: 'معاینه فنی',
    description: 'یادآوری‌های معاینه فنی خودرو',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 500, 500],
    lightColor: '#dc2626',
  },
};

interface NotificationState {
  // State
  scheduledNotificationIds: string[];
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  notificationSettings: NotificationSettings;
  
  // Actions
  requestPermission: () => Promise<{ success: boolean; granted: boolean; error?: string }>;
  checkPermission: () => Promise<{ hasPermission: boolean }>;
  scheduleNotification: (reminder: Reminder) => Promise<{ success: boolean; id?: string; error?: string }>;
  cancelNotification: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelAllNotifications: () => Promise<{ success: boolean; error?: string }>;
  cancelNotificationsByVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  showImmediateNotification: (title: string, body: string, data?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

// Notification settings interface
export interface NotificationSettings {
  enabled: boolean;
  notificationTime: string;
  earlyWarningDays: number;
  earlyWarningKilometers: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showInForeground: boolean;
}

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  notificationTime: '09:00',
  earlyWarningDays: 7,
  earlyWarningKilometers: 1000,
  soundEnabled: true,
  vibrationEnabled: true,
  showInForeground: true,
};

// Get Android channel ID based on reminder type
function getAndroidChannelId(type: string): string {
  switch (type) {
    case 'insurance':
      return ANDROID_CHANNELS.INSURANCE.id;
    case 'inspection':
      return ANDROID_CHANNELS.INSPECTION.id;
    case 'service':
      return ANDROID_CHANNELS.SERVICE.id;
    default:
      return ANDROID_CHANNELS.DEFAULT.id;
  }
}

// Configure notification handler (should be called at app startup)
export async function configureNotificationHandler(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('Notification received:', notification);
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
    handleSuccess: (notificationId) => {
      console.log('Notification shown successfully:', notificationId);
    },
    handleError: (error) => {
      console.error('Notification error:', error);
    },
  });

  await Notifications.setNotificationCategories([
    {
      identifier: 'khodroyar-reminder',
      actions: [
        {
          identifier: 'mark-complete',
          title: 'انجام شد',
          options: { isDestructive: false },
        },
        {
          identifier: 'snooze-1h',
          title: 'تاخیر ۱ ساعت',
          options: { isDestructive: false },
        },
        {
          identifier: 'snooze-1d',
          title: 'تاخیر ۱ روز',
          options: { isDestructive: false },
        },
      ],
    },
  ]);
}

// Create Android notification channels
export async function createAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.DEFAULT);
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.SERVICE);
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.INSURANCE);
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.INSPECTION);
  }
}

// Map reminder priority to notification priority
function getNotificationPriority(priority: string): Notifications.NotificationPriority {
  switch (priority) {
    case 'critical':
      return Notifications.NotificationPriority.MAX;
    case 'high':
      return Notifications.NotificationPriority.HIGH;
    case 'low':
      return Notifications.NotificationPriority.LOW;
    default:
      return Notifications.NotificationPriority.DEFAULT;
  }
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  // Initial state
  scheduledNotificationIds: [],
  hasPermission: null,
  isLoading: false,
  error: null,
  notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },

  // Actions
  requestPermission: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowVibration: true,
            allowFullScreen: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus === 'granted') {
        await createAndroidNotificationChannels();
      }
      
      const hasPermission = finalStatus === 'granted';
      set({ hasPermission, isLoading: false });
      
      return { success: true, granted: hasPermission };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در درخواست مجوز اعلان';
      set({ isLoading: false, error: errorMessage });
      return { success: false, granted: false, error: errorMessage };
    }
  },

  checkPermission: async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermission = status === 'granted';
      set({ hasPermission });
      return { hasPermission };
    } catch (error) {
      set({ hasPermission: false });
      return { hasPermission: false };
    }
  },

  scheduleNotification: async (reminder) => {
    set({ isLoading: true, error: null });
    
    try {
      if (!get().notificationSettings.enabled) {
        set({ isLoading: false });
        return { success: false, error: 'اعلان‌ها غیرفعال هستند' };
      }
      
      const { hasPermission } = get();
      if (!hasPermission) {
        await get().requestPermission();
      }
      
      if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
      
      const now = new Date();
      const remindAt = new Date(reminder.remindAt);
      const notifyBeforeDays = reminder.notifyBeforeDays ?? get().notificationSettings.earlyWarningDays;
      
      const triggerDate = new Date(remindAt.getTime() - notifyBeforeDays * 24 * 60 * 60 * 1000);
      const triggerTime = triggerDate > now ? triggerDate : now;
      
      const title = reminder.title;
      const body = reminder.description || `یادآوری ${reminder.type}`;
      const notificationId = `reminder-${reminder.id}-${Date.now()}`;
      
      const scheduledId = await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title,
          body,
          data: {
            type: 'reminder',
            reminderId: reminder.id,
            vehicleId: reminder.vehicleId,
            notificationId,
          },
          sound: get().notificationSettings.soundEnabled ? 'default' : undefined,
          vibrate: get().notificationSettings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
          priority: getNotificationPriority(reminder.priority),
          badge: 1,
          categoryIdentifier: 'khodroyar-reminder',
        },
        trigger: {
          type: 'date',
          timestamp: triggerTime.getTime(),
          repeats: reminder.frequency === 'once' ? false : true,
        },
      });
      
      const existingIds = get().scheduledNotificationIds;
      if (!existingIds.includes(scheduledId)) {
        set({
          scheduledNotificationIds: [...existingIds, scheduledId],
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      
      return { success: true, id: scheduledId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در برنامه‌ریزی اعلان';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  cancelNotification: async (id) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      
      const existingIds = get().scheduledNotificationIds;
      const updatedIds = existingIds.filter(existingId => existingId !== id);
      
      set({
        scheduledNotificationIds: updatedIds,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در لغو اعلان';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      set({
        scheduledNotificationIds: [],
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در لغو تمام اعلان‌ها';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  cancelNotificationsByVehicle: async (vehicleId) => {
    try {
      const state = get();
      const { getRemindersByVehicle } = await import('./useReminderStore');
      const reminderStore = useReminderStore.getState();
      const reminders = reminderStore.getRemindersByVehicle(vehicleId);
      
      const cancelPromises = reminders.map(reminder => {
        if (reminder.notificationId) {
          return Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        }
        return Promise.resolve();
      });
      
      await Promise.all(cancelPromises);
      
      const updatedIds = state.scheduledNotificationIds.filter(id => {
        return !id.startsWith('reminder-') || !reminders.some(r => id.includes(r.id));
      });
      
      set({
        scheduledNotificationIds: updatedIds,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در لغو اعلان‌های خودرو';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  showImmediateNotification: async (title, body, data = {}) => {
    try {
      const { hasPermission } = get();
      if (!hasPermission) {
        return { success: false, error: 'مجوز اعلان داده نشده است' };
      }
      
      await Notifications.scheduleNotificationAsync({
        identifier: `immediate-${Date.now()}`,
        content: {
          title,
          body,
          data,
          sound: get().notificationSettings.soundEnabled ? 'default' : undefined,
          vibrate: get().notificationSettings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
          priority: Notifications.NotificationPriority.HIGH,
          badge: 1,
        },
        trigger: {
          type: 'immediately',
        },
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در نمایش اعلان فوری';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await configureNotificationHandler();
      await get().checkPermission();
      await createAndroidNotificationChannels();
      
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledIds = scheduledNotifications.map(n => n.identifier);
      
      set({
        scheduledNotificationIds: scheduledIds,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در راه‌اندازی اعلان‌ها';
      set({ isLoading: false, error: errorMessage });
    }
  },

  reset: () => {
    set({
      scheduledNotificationIds: [],
      hasPermission: null,
      isLoading: false,
      error: null,
      notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    });
  },
}));

// Selectors
export const useScheduledNotificationIds = () => 
  useNotificationStore(state => state.scheduledNotificationIds);

export const useHasNotificationPermission = () => 
  useNotificationStore(state => state.hasPermission);

export const useNotificationError = () => 
  useNotificationStore(state => state.error);

export const useNotificationSettings = () => 
  useNotificationStore(state => state.notificationSettings);

export default useNotificationStore;
