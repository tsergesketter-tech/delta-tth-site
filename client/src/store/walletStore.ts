// store/walletStore.ts
import { create } from 'zustand';
import { WalletItem, WalletFilters, WalletSummaryData, Status, EarnedOwedGiven } from '../types/wallet';

interface WalletState {
  // Data
  items: WalletItem[];
  summary: WalletSummaryData | null;
  loading: boolean;
  error: string | null;
  
  // Filters per category
  coreFilters: WalletFilters;
  certVoucherFilters: WalletFilters;
  partnerFinancialFilters: WalletFilters;
  
  // Actions
  setItems: (items: WalletItem[]) => void;
  setSummary: (summary: WalletSummaryData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filter actions
  updateCoreFilters: (filters: Partial<WalletFilters>) => void;
  updateCertVoucherFilters: (filters: Partial<WalletFilters>) => void;
  updatePartnerFinancialFilters: (filters: Partial<WalletFilters>) => void;
  resetFilters: () => void;
  
  // Optimistic updates
  updateItemStatus: (itemId: string, status: Status) => void;
  removeItem: (itemId: string) => void;
}

const defaultFilters: WalletFilters = {
  status: ["ACTIVE"],
  source: ["EARNED", "OWED", "GIVEN"],
  sortBy: "expiry",
  search: "",
};

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  items: [],
  summary: null,
  loading: false,
  error: null,
  
  coreFilters: { ...defaultFilters },
  certVoucherFilters: { ...defaultFilters },
  partnerFinancialFilters: { ...defaultFilters },
  
  // Basic actions
  setItems: (items) => set({ items }),
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Filter actions
  updateCoreFilters: (filters) => 
    set(state => ({ 
      coreFilters: { ...state.coreFilters, ...filters } 
    })),
  
  updateCertVoucherFilters: (filters) => 
    set(state => ({ 
      certVoucherFilters: { ...state.certVoucherFilters, ...filters } 
    })),
  
  updatePartnerFinancialFilters: (filters) => 
    set(state => ({ 
      partnerFinancialFilters: { ...state.partnerFinancialFilters, ...filters } 
    })),
  
  resetFilters: () => set({
    coreFilters: { ...defaultFilters },
    certVoucherFilters: { ...defaultFilters },
    partnerFinancialFilters: { ...defaultFilters },
  }),
  
  // Optimistic updates
  updateItemStatus: (itemId, status) => 
    set(state => ({
      items: state.items.map(item => 
        item.id === itemId ? { ...item, status } : item
      )
    })),
  
  removeItem: (itemId) => 
    set(state => ({
      items: state.items.filter(item => item.id !== itemId)
    })),
}));