/**
 * UI Store - Zustand (Placeholder)
 * Manages UI-related state like modals, loading states, etc.
 */
import { create } from 'zustand';

interface UiState {
  // Modal states
  isModalVisible: boolean;
  modalContent: React.ReactNode | null;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Snackbar/Toast
  toastMessage: string | null;
  toastSeverity: 'success' | 'error' | 'info' | 'warning' | null;
  
  // Actions
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  showToast: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  
  reset: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isModalVisible: false,
  modalContent: null,
  isLoading: false,
  loadingMessage: '',
  toastMessage: null,
  toastSeverity: null,
  
  showModal: (content) => set({ isModalVisible: true, modalContent: content }),
  hideModal: () => set({ isModalVisible: false, modalContent: null }),
  showLoading: (message = 'لطفاً صبر کنید...') => set({ isLoading: true, loadingMessage: message }),
  hideLoading: () => set({ isLoading: false, loadingMessage: '' }),
  showToast: (message, severity = 'info') => set({ toastMessage: message, toastSeverity: severity }),
  hideToast: () => set({ toastMessage: null, toastSeverity: null }),
  
  reset: () => set({
    isModalVisible: false,
    modalContent: null,
    isLoading: false,
    loadingMessage: '',
    toastMessage: null,
    toastSeverity: null,
  }),
}));

// Selectors
export const useModal = () => useUiStore(state => ({
  isVisible: state.isModalVisible,
  content: state.modalContent,
  show: state.showModal,
  hide: state.hideModal,
}));

export const useLoading = () => useUiStore(state => ({
  isLoading: state.isLoading,
  message: state.loadingMessage,
  show: state.showLoading,
  hide: state.hideLoading,
}));

export const useToast = () => useUiStore(state => ({
  message: state.toastMessage,
  severity: state.toastSeverity,
  show: state.showToast,
  hide: state.hideToast,
}));
