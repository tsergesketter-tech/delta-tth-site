// utils/walletUtils.ts
import { WalletItem, WalletFilters } from '../types/wallet';

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatMiles(miles: number): string {
  return `${miles.toLocaleString()} miles`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays} days`;
  } else if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)} weeks`;
  } else if (diffDays <= 365) {
    return `${Math.ceil(diffDays / 30)} months`;
  } else {
    return `${Math.ceil(diffDays / 365)} years`;
  }
}

export function getExpirationStatus(expiresAt?: string): 'expired' | 'expiring-soon' | 'active' {
  if (!expiresAt) return 'active';
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring-soon';
  return 'active';
}

export function filterWalletItems(items: WalletItem[], filters: WalletFilters): WalletItem[] {
  return items.filter(item => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }

    // Source filter
    if (filters.source.length > 0 && !filters.source.includes(item.source)) {
      return false;
    }

    // Expiration filter
    if (filters.expirationDays && item.expiresAt) {
      const expiryDate = new Date(item.expiresAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + filters.expirationDays);
      
      if (expiryDate > cutoffDate) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${item.label} ${item.valueDisplay} ${item.notes || ''}`.toLowerCase();
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    // Category-specific filters
    if (item.category === 'CORE' && filters.coreTypes) {
      if (filters.coreTypes.length > 0 && !filters.coreTypes.includes(item.subType as any)) {
        return false;
      }
    }

    if (item.category === 'CERTS_VOUCHERS' && filters.certVoucherTypes) {
      if (filters.certVoucherTypes.length > 0 && !filters.certVoucherTypes.includes(item.subType as any)) {
        return false;
      }
    }

    if (item.category === 'PARTNER_FINANCIAL' && filters.partnerTypes) {
      if (filters.partnerTypes.length > 0 && !filters.partnerTypes.includes(item.subType as any)) {
        return false;
      }
    }

    return true;
  });
}

export function sortWalletItems(items: WalletItem[], sortBy: WalletFilters['sortBy']): WalletItem[] {
  const sorted = [...items];
  
  switch (sortBy) {
    case 'expiry':
      return sorted.sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1; // Items without expiry go to end
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      });
      
    case 'value':
      return sorted.sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0));
      
    case 'recent':
      return sorted.sort((a, b) => {
        if (!a.issuedAt && !b.issuedAt) return 0;
        if (!a.issuedAt) return 1;
        if (!b.issuedAt) return -1;
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
      
    default:
      return sorted;
  }
}

export function getStatusBadgeColor(status: WalletItem['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    case 'USED':
      return 'bg-gray-100 text-gray-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOCKED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getSourceBadgeColor(source: WalletItem['source']): string {
  switch (source) {
    case 'EARNED':
      return 'bg-blue-100 text-blue-800';
    case 'OWED':
      return 'bg-purple-100 text-purple-800';
    case 'GIVEN':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}