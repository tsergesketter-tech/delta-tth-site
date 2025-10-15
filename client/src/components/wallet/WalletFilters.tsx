// components/wallet/WalletFilters.tsx
import React from 'react';
import { WalletCategory, WalletFilters as WalletFiltersType, Status, EarnedOwedGiven } from '../../types/wallet';

interface WalletFiltersProps {
  category: WalletCategory;
  filters: WalletFiltersType;
  onFiltersChange: (filters: Partial<WalletFiltersType>) => void;
  totalItems: number;
  filteredItems: number;
}

export default function WalletFilters({ 
  category, 
  filters, 
  onFiltersChange, 
  totalItems, 
  filteredItems 
}: WalletFiltersProps) {
  const statusOptions: { value: Status; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'USED', label: 'Used' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'LOCKED', label: 'Locked' }
  ];

  const sourceOptions: { value: EarnedOwedGiven; label: string }[] = [
    { value: 'EARNED', label: 'Earned' },
    { value: 'OWED', label: 'Owed' },
    { value: 'GIVEN', label: 'Given' }
  ];

  const sortOptions = [
    { value: 'expiry', label: 'Expiry (soonest)' },
    { value: 'value', label: 'Value (highest)' },
    { value: 'recent', label: 'Recently added' }
  ];

  const expirationOptions = [
    { value: undefined, label: 'All items' },
    { value: 30, label: 'Expiring in 30 days' },
    { value: 60, label: 'Expiring in 60 days' },
    { value: 90, label: 'Expiring in 90 days' }
  ];

  const toggleStatus = (status: Status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ status: newStatus });
  };

  const toggleSource = (source: EarnedOwedGiven) => {
    const newSource = filters.source.includes(source)
      ? filters.source.filter(s => s !== source)
      : [...filters.source, source];
    onFiltersChange({ source: newSource });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status.length !== 1 || filters.status[0] !== 'ACTIVE' ||
    filters.source.length !== 3 ||
    filters.expirationDays !== undefined ||
    filters.sortBy !== 'expiry';

  const clearFilters = () => {
    onFiltersChange({
      status: ['ACTIVE'],
      source: ['EARNED', 'OWED', 'GIVEN'],
      sortBy: 'expiry',
      search: '',
      expirationDays: undefined
    });
  };

  return (
    <div className="border-b border-gray-200 pb-4">
      {/* Top Row: Search and Results */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <span className="text-sm text-gray-600">
            {filteredItems} of {totalItems} items
          </span>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700 mr-2">Status:</span>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleStatus(option.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.status.includes(option.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700 mr-2">Source:</span>
          {sourceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleSource(option.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.source.includes(option.value)
                  ? 'bg-slate-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Expiration Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700 mr-2">Expiry:</span>
          <select
            value={filters.expirationDays || ''}
            onChange={(e) => onFiltersChange({ 
              expirationDays: e.target.value ? Number(e.target.value) : undefined 
            })}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            {expirationOptions.map((option) => (
              <option key={option.label} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700 mr-2">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}