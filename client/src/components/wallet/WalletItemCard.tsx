// components/wallet/WalletItemCard.tsx
import React from 'react';
import { WalletItem, WalletAction } from '../../types/wallet';
import { 
  formatDate, 
  formatRelativeDate, 
  getExpirationStatus, 
  getStatusBadgeColor,
  getSourceBadgeColor 
} from '../../utils/walletUtils';

interface WalletItemCardProps {
  item: WalletItem;
  onAction: (actionId: WalletAction['id'], itemId: string) => void;
}

export default function WalletItemCard({ item, onAction }: WalletItemCardProps) {
  const expirationStatus = getExpirationStatus(item.expiresAt);
  
  const getItemIcon = () => {
    switch (item.subType) {
      case 'MILES':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'MQD':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'ECREDIT':
      case 'GIFT_CARD':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'UPGRADE':
      case 'COMPANION':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'WIFI':
      case 'LOUNGE':
      case 'DRINK':
      case 'SERVICE':
        return (
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
              <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
            </svg>
          </div>
        );
      case 'STARBUCKS':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">★</span>
          </div>
        );
      case 'CREDIT_CARD_SPEND':
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
      expirationStatus === 'expiring-soon' 
        ? 'border-orange-200 bg-orange-50' 
        : expirationStatus === 'expired'
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getItemIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{item.label}</h4>
            <p className="text-sm text-gray-600">{item.valueDisplay}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(item.status)}`}>
            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSourceBadgeColor(item.source)}`}>
            {item.source.charAt(0) + item.source.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Dates */}
      {(item.issuedAt || item.expiresAt) && (
        <div className="mb-3 space-y-1">
          {item.issuedAt && (
            <p className="text-xs text-gray-500">
              Issued: {formatDate(item.issuedAt)}
            </p>
          )}
          {item.expiresAt && (
            <p className={`text-xs ${
              expirationStatus === 'expiring-soon' 
                ? 'text-orange-600 font-medium' 
                : expirationStatus === 'expired'
                ? 'text-red-600 font-medium'
                : 'text-gray-500'
            }`}>
              {expirationStatus === 'expired' ? 'Expired: ' : 'Expires: '}
              {formatRelativeDate(item.expiresAt)}
              {expirationStatus !== 'expired' && (
                <span className="text-gray-400 ml-1">
                  ({formatDate(item.expiresAt)})
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Eligibility/Notes */}
      {(item.notes || (item.category === 'CERTS_VOUCHERS' && item.eligibility)) && (
        <div className="mb-3">
          {item.notes && (
            <p className="text-xs text-gray-600 mb-1">{item.notes}</p>
          )}
          {item.category === 'CERTS_VOUCHERS' && item.eligibility && (
            <div className="text-xs text-gray-600">
              {item.eligibility.cabins && (
                <p>Cabins: {item.eligibility.cabins.join(', ')}</p>
              )}
              {item.eligibility.routes && (
                <p>Routes: {item.eligibility.routes.join(', ')}</p>
              )}
              {item.eligibility.transferable !== undefined && (
                <p>Transferable: {item.eligibility.transferable ? 'Yes' : 'No'}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {item.actions && item.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action.id, item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                action.id === 'APPLY' || action.id === 'BOOK'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : action.id === 'CONVERT'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={item.status === 'EXPIRED' || item.status === 'USED'}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}