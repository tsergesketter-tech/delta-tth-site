// components/wallet/WalletSummary.tsx
import React from 'react';
import { WalletSummaryData } from '../../types/wallet';
import { formatCurrency } from '../../utils/walletUtils';

interface WalletSummaryProps {
  summary: WalletSummaryData | null;
}

export default function WalletSummary({ summary }: WalletSummaryProps) {
  if (!summary) {
    return (
      <div className="bg-white rounded-xl shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summaryItems = [
    {
      label: 'Total Delta Value',
      value: formatCurrency(summary.totalDeltaValue),
      subtext: 'eCredits & Gift Cards',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'SkyMiles Balance',
      value: summary.totalMiles.toLocaleString(),
      subtext: 'miles available',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'MQD Progress',
      value: formatCurrency(summary.totalMQDs * 100),
      subtext: 'toward next status',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Active Items',
      value: summary.activeItemsCount.toString(),
      subtext: `${summary.expiringItemsCount} expiring soon`,
      color: summary.expiringItemsCount > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: summary.expiringItemsCount > 0 ? 'bg-orange-50' : 'bg-gray-50'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="/images/delta_logo_sideways.png" 
            alt="Delta" 
            className="h-5 opacity-80"
          />
          <h2 className="text-xl font-bold text-gray-900">Wallet Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className={`${item.bgColor} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</p>
                  <p className="text-xs text-gray-500">{item.subtext}</p>
                </div>
                
                {/* Icon based on type */}
                <div className="ml-3">
                  {index === 0 && (
                    <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {summary.expiringItemsCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-orange-800">
                {summary.expiringItemsCount} item{summary.expiringItemsCount !== 1 ? 's' : ''} expiring soon
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}