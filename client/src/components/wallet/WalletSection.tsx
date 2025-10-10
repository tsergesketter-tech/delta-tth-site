// components/wallet/WalletSection.tsx
import React, { useState, useMemo } from 'react';
import { WalletItem, WalletCategory } from '../../types/wallet';
import { useWalletStore } from '../../store/walletStore';
import { filterWalletItems, sortWalletItems } from '../../utils/walletUtils';
import WalletFilters from './WalletFilters';
import WalletItemCard from './WalletItemCard';

interface WalletSectionProps {
  title: string;
  description: string;
  category: WalletCategory;
  items: WalletItem[];
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export default function WalletSection({ 
  title, 
  description, 
  category, 
  items, 
  onShowToast 
}: WalletSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const {
    coreFilters,
    certVoucherFilters,
    partnerFinancialFilters,
    updateCoreFilters,
    updateCertVoucherFilters,
    updatePartnerFinancialFilters,
  } = useWalletStore();

  // Get the appropriate filters for this category
  const filters = useMemo(() => {
    switch (category) {
      case 'CORE':
        return coreFilters;
      case 'CERTS_VOUCHERS':
        return certVoucherFilters;
      case 'PARTNER_FINANCIAL':
        return partnerFinancialFilters;
      default:
        return coreFilters;
    }
  }, [category, coreFilters, certVoucherFilters, partnerFinancialFilters]);

  // Get the appropriate filter update function
  const updateFilters = useMemo(() => {
    switch (category) {
      case 'CORE':
        return updateCoreFilters;
      case 'CERTS_VOUCHERS':
        return updateCertVoucherFilters;
      case 'PARTNER_FINANCIAL':
        return updatePartnerFinancialFilters;
      default:
        return updateCoreFilters;
    }
  }, [category, updateCoreFilters, updateCertVoucherFilters, updatePartnerFinancialFilters]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    const filtered = filterWalletItems(items, filters);
    return sortWalletItems(filtered, filters.sortBy);
  }, [items, filters]);

  const isEmpty = items.length === 0;
  const noResultsAfterFiltering = items.length > 0 && processedItems.length === 0;

  return (
    <div className="bg-white rounded-xl shadow">
      {/* Section Header */}
      <div 
        className="px-6 py-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {processedItems.length}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          
          <button className="ml-4 text-gray-400 hover:text-gray-600">
            <svg 
              className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-6">
          {/* Filters */}
          <WalletFilters
            category={category}
            filters={filters}
            onFiltersChange={updateFilters}
            totalItems={items.length}
            filteredItems={processedItems.length}
          />

          {/* Items Grid */}
          <div className="mt-6">
            {isEmpty ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l10 10-10 10m-6-10h16" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h4>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {category === 'CORE' && "Start earning miles and managing your Delta currencies."}
                  {category === 'CERTS_VOUCHERS' && "Certificates and vouchers will appear here as you earn them."}
                  {category === 'PARTNER_FINANCIAL' && "Link partner accounts to see rewards and activity."}
                </p>
              </div>
            ) : noResultsAfterFiltering ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m3 0H7" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No items match your filters</h4>
                <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedItems.map((item) => (
                  <WalletItemCard
                    key={item.id}
                    item={item}
                    onAction={(action, itemId) => {
                      // Handle actions here
                      console.log(`Action ${action} on item ${itemId}`);
                      onShowToast(`${action} action initiated for ${item.label}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}