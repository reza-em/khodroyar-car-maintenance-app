// Zustand Stores Index
// Export all stores for the application

export * from './useVehicleStore';
export * from './useSettingsStore';
export * from './useServiceStore';
export * from './useOdometerStore';
export * from './useReminderStore';
export * from './useExpenseStore';
export * from './usePartStore';
export * from './useRepairStore';
export * from './useUiStore';
export * from './useNotificationStore';

/**
 * Initialize all stores
 * Call this at app startup
 */
export async function initializeStores(): Promise<void> {
  const vehicleStore = useVehicleStore.getState();
  const settingsStore = useSettingsStore.getState();
  const serviceStore = useServiceStore.getState();
  const odometerStore = useOdometerStore.getState();
  const reminderStore = useReminderStore.getState();
  const expenseStore = useExpenseStore.getState();
  const partStore = usePartStore.getState();
  const repairStore = useRepairStore.getState();
  const uiStore = useUiStore.getState();
  const notificationStore = useNotificationStore.getState();
  
  // Initialize stores in parallel
  await Promise.all([
    vehicleStore.initialize(),
    settingsStore.initialize(),
    serviceStore.initialize(),
    odometerStore.initialize(),
    reminderStore.initialize(),
    expenseStore.initialize(),
    partStore.initialize(),
    repairStore.initialize(),
    uiStore.initialize(),
    notificationStore.initialize(),
  ]);
}

/**
 * Reset all stores
 * Useful for testing or logout
 */
export async function resetAllStores(): Promise<void> {
  const vehicleStore = useVehicleStore.getState();
  const settingsStore = useSettingsStore.getState();
  const serviceStore = useServiceStore.getState();
  const odometerStore = useOdometerStore.getState();
  const reminderStore = useReminderStore.getState();
  const expenseStore = useExpenseStore.getState();
  const partStore = usePartStore.getState();
  const repairStore = useRepairStore.getState();
  const uiStore = useUiStore.getState();
  const notificationStore = useNotificationStore.getState();
  
  vehicleStore.reset();
  settingsStore.reset();
  serviceStore.reset();
  odometerStore.reset();
  reminderStore.reset();
  expenseStore.reset();
  partStore.reset();
  repairStore.reset();
  uiStore.reset();
  notificationStore.reset();
}
