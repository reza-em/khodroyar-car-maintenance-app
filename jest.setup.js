import { jest } from '@jest/globals';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStore = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(mockStore[key])),
    setItem: jest.fn((key, value) => {
      mockStore[key] = value;
      return Promise.resolve(true);
    }),
    removeItem: jest.fn((key) => {
      delete mockStore[key];
      return Promise.resolve(true);
    }),
    clear: jest.fn(() => {
      Object.keys(mockStore).forEach((key) => delete mockStore[key]);
      return Promise.resolve(true);
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStore))),
  };
});

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
    select: jest.fn().mockImplementation((objs) => objs.ios),
  },
  NativeModules: {
    // Mock native modules
  },
}));

// Mock expo modules
jest.mock('expo-notifications', () => ({
  Notifications: {
    scheduleNotificationAsync: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(true),
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setNotificationHandler: jest.fn(),
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    prepareSync: jest.fn().mockReturnValue({
      executeSync: jest.fn(),
      getAllSync: jest.fn(),
      getFirstSync: jest.fn(),
      executeAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    }),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    execAsync: jest.fn(),
    closeAsync: jest.fn(),
    deleteAsync: jest.fn(),
  }),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock moment-jalaali
jest.mock('moment-jalaali', () => {
  const actual = jest.requireActual('moment-jalaali');
  return {
    ...actual,
    jalaali: jest.fn(() => actual('1403/01/01', 'jYYYY/jMM/jDD')),
  };
});

// Global test timeout
jest.setTimeout(10000);
