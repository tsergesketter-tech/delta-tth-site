// pages/Wallet.tsx
import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { walletService } from '../services/walletService';
import WalletSummary from '../components/wallet/WalletSummary';
import WalletSection from '../components/wallet/WalletSection';
import { DEMO_MEMBER } from '../constants/loyalty';
import { VOUCHER_DEFINITION_FILTERS, type VoucherDefinitionFilter } from '../utils/vouchersApi';

export default function WalletPage() {
  const {
    items,
    summary,
    loading,
    error,
    setItems,
    setSummary,
    setLoading,
    setError,
  } = useWalletStore();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<VoucherDefinitionFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadWalletData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWalletData = async (filters?: VoucherDefinitionFilter[]) => {
    console.log('[Wallet] loadWalletData called with filters:', filters);
    console.log('[Wallet] Using membership number:', DEMO_MEMBER.MEMBERSHIP_NUMBER);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[Wallet] Starting to fetch wallet data...');
      const [itemsData, summaryData] = await Promise.all([
        filters && filters.length > 0 
          ? walletService.getFilteredWalletItems(DEMO_MEMBER.MEMBERSHIP_NUMBER, filters)
          : walletService.getWalletItems(DEMO_MEMBER.MEMBERSHIP_NUMBER),
        walletService.getWalletSummary(DEMO_MEMBER.MEMBERSHIP_NUMBER),
      ]);

      console.log('[Wallet] Received items data:', itemsData);
      console.log('[Wallet] Received summary data:', summaryData);

      setItems(itemsData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('[Wallet] Failed to load wallet data:', err);
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: VoucherDefinitionFilter) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    setSelectedFilters(newFilters);
    loadWalletData(newFilters);
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    loadWalletData();
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const coreItems = items.filter(item => item.category === 'CORE');
  const certificateItems = items.filter(item => 
    item.category === 'CERTS_VOUCHERS' && 
    (item as any).voucherCategory === 'CERTIFICATES'
  );
  const voucherItems = items.filter(item => 
    item.category === 'CERTS_VOUCHERS' && 
    (item as any).voucherCategory === 'VOUCHERS'
  );
  const partnerFinancialItems = items.filter(item => item.category === 'PARTNER_FINANCIAL');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Digital Wallet</h1>
                <p className="text-gray-300 mt-1">Your Delta currencies, certificates, and rewards</p>
              </div>
              <div className="flex-shrink-0 ml-8">
                <img
                  src="/images/delta_logo_sideways.png"
                  alt="Delta Logo"
                  className="h-20 w-auto opacity-80"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <h1 className="text-2xl font-bold">Digital Wallet</h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Unable to Load Wallet</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button 
                  onClick={() => loadWalletData()}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Digital Wallet</h1>
              <p className="text-gray-300 mt-1">Your Delta currencies, certificates, and rewards</p>
            </div>
            <div className="flex-shrink-0 ml-8">
              <img
                src="/images/delta_logo_sideways.png"
                alt="Delta Logo"
                className="h-20 w-auto opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Summary */}
        <WalletSummary summary={summary} />

        {/* Filters Section */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Voucher Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {Object.values(VOUCHER_DEFINITION_FILTERS).map((filter) => (
                  <label key={filter} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter)}
                      onChange={() => handleFilterChange(filter)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{filter}</span>
                  </label>
                ))}
              </div>
              
              {selectedFilters.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Active filters: {selectedFilters.join(', ')}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-8 mt-8">
          <WalletSection
            title="Credits"
            description="E-Credits and Gift Cards"
            category="CORE"
            items={coreItems}
            onShowToast={showToast}
          />

          <WalletSection
            title="Certificates"
            description="Upgrade certificates and companion certificates"
            category="CERTS_VOUCHERS"
            items={certificateItems}
            onShowToast={showToast}
          />

          <WalletSection
            title="Vouchers"
            description="Drink vouchers, SkyClub passes, and day passes"
            category="CERTS_VOUCHERS"
            items={voucherItems}
            onShowToast={showToast}
          />

          <WalletSection
            title="Partner & Financial"
            description="Partner rewards and credit card activity"
            category="PARTNER_FINANCIAL"
            items={partnerFinancialItems}
            onShowToast={showToast}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg p-4 shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <svg 
                className={`w-5 h-5 mr-3 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                {toast.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}