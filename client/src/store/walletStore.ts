// store/walletStore.ts
import { useState, useCallback } from 'react';
import { WalletItem, WalletFilters, WalletSummaryData, Status } from '../types/wallet';

const defaultFilters: WalletFilters = {
  status: ["ACTIVE"],
  source: ["EARNED", "OWED", "GIVEN"],
  sortBy: "expiry",
  search: "",
};

// Simple state management with React hooks
export function useWalletStore() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [summary, setSummary] = useState<WalletSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters per category
  const [coreFilters, setCoreFilters] = useState<WalletFilters>({ ...defaultFilters });
  const [certVoucherFilters, setCertVoucherFilters] = useState<WalletFilters>({ ...defaultFilters });
  const [partnerFinancialFilters, setPartnerFinancialFilters] = useState<WalletFilters>({ ...defaultFilters });

  // Filter update functions
  const updateCoreFilters = useCallback((filters: Partial<WalletFilters>) => {
    setCoreFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const updateCertVoucherFilters = useCallback((filters: Partial<WalletFilters>) => {
    setCertVoucherFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const updatePartnerFinancialFilters = useCallback((filters: Partial<WalletFilters>) => {
    setPartnerFinancialFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const resetFilters = useCallback(() => {
    setCoreFilters({ ...defaultFilters });
    setCertVoucherFilters({ ...defaultFilters });
    setPartnerFinancialFilters({ ...defaultFilters });
  }, []);

  // Optimistic updates
  const updateItemStatus = useCallback((itemId: string, status: Status) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, status } : item
      )
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  return {
    // Data
    items,
    summary,
    loading,
    error,
    
    // Filters
    coreFilters,
    certVoucherFilters,
    partnerFinancialFilters,
    
    // Actions
    setItems,
    setSummary,
    setLoading,
    setError,
    updateCoreFilters,
    updateCertVoucherFilters,
    updatePartnerFinancialFilters,
    resetFilters,
    updateItemStatus,
    removeItem,
  };
}