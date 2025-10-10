// Global Data Cloud SDK Provider
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDataCloudSDK } from '../hooks/useDataCloudSDK';
import { useLocation } from 'react-router-dom';

interface DataCloudContextType {
  isInitialized: boolean;
  deviceId: string;
  trackEvent: (eventName: string, attributes?: Record<string, any>) => void;
  trackPageView: (pagePath: string, pageTitle?: string) => void;
  trackInteraction: (interactionType: string, details: Record<string, any>) => void;
  trackTravelEvent: (eventType: string, data: Record<string, any>) => void;
  identifyUser: (userId: string, attributes?: Record<string, any>) => void;
  setConsent: (hasConsent: boolean) => void;
}

const DataCloudContext = createContext<DataCloudContextType | null>(null);

export const useDataCloud = () => {
  const context = useContext(DataCloudContext);
  if (!context) {
    throw new Error('useDataCloud must be used within a DataCloudProvider');
  }
  return context;
};

interface DataCloudProviderProps {
  children: ReactNode;
  tenantId?: string;
  enableTracking?: boolean;
}

export const DataCloudProvider: React.FC<DataCloudProviderProps> = ({
  children,
  tenantId,
  enableTracking = true
}) => {
  const location = useLocation();
  const dataCloudSDK = useDataCloudSDK({
    tenantId,
    enableDebug: process.env.NODE_ENV === 'development'
  });

  // Track page views automatically
  useEffect(() => {
    if (enableTracking && dataCloudSDK.isInitialized) {
      dataCloudSDK.trackPageView(location.pathname, document.title);
    }
  }, [location.pathname, dataCloudSDK.isInitialized, dataCloudSDK.trackPageView, enableTracking]);

  // Set default consent (you may want to integrate with a consent management system)
  useEffect(() => {
    if (dataCloudSDK.isInitialized) {
      // Check for existing consent preference
      const hasConsent = localStorage.getItem('data-cloud-consent') !== 'false';
      dataCloudSDK.setConsent(hasConsent);
    }
  }, [dataCloudSDK.isInitialized, dataCloudSDK.setConsent]);

  const value: DataCloudContextType = {
    ...dataCloudSDK
  };

  return (
    <DataCloudContext.Provider value={value}>
      {children}
      {/* SDK Status Indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-3 py-1 rounded text-xs font-mono ${
            dataCloudSDK.isInitialized 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            Data Cloud: {dataCloudSDK.isInitialized ? 'Connected' : 'Loading...'}
            {dataCloudSDK.deviceId && (
              <div className="text-xs opacity-75">
                Device: {dataCloudSDK.deviceId.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      )}
    </DataCloudContext.Provider>
  );
};