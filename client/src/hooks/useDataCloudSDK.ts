// Salesforce Data Cloud Web SDK Integration
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';

interface DataCloudConfig {
  scriptUrl: string;
  tenantId?: string;
  cookieDomain?: string;
  enableDebug?: boolean;
}

interface DataCloudSDK {
  init: (config: any) => void;
  sendEvent: (eventName: string, eventData: any) => void;
  identify: (userId: string, attributes?: Record<string, any>) => void;
  getDeviceId: () => string;
  setConsent: (hasConsent: boolean) => void;
  getAnonymousId?: () => string; // Optional since it may not exist on all SDK implementations
}

interface TrackingEvent {
  eventType: string;
  eventName: string;
  timestamp: string;
  attributes: Record<string, any>;
  deviceId?: string;
  userId?: string;
}

declare global {
  interface Window {
    C360A?: DataCloudSDK;
    SalesforceDataCloud?: DataCloudSDK;
    SalesforceInteractions?: DataCloudSDK;
    SFDC?: DataCloudSDK;
    sfdc?: DataCloudSDK;
    getSalesforceInteractions?: () => DataCloudSDK;
    getSalesforceInteractionsName?: () => string;
    dataCloudConfig?: any;
  }
}

const DEFAULT_CONFIG: DataCloudConfig = {
  scriptUrl: 'https://cdn.c360a.salesforce.com/beacon/c360a/6b13de41-2e5c-4e5d-bd23-fa67b0bf66a4/scripts/c360a.min.js',
  cookieDomain: window.location.hostname,
  enableDebug: process.env.NODE_ENV === 'development'
};

// Global flag to prevent multiple initializations
let globalInitializationInProgress = false;
let globalIsInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Global event listener management to prevent duplicates
let globalEventListenerRegistered = false;
let globalEventHandlerCallbacks: Set<(event: CustomEvent) => void> = new Set();
let lastProcessedEventTime = 0;
const EVENT_DEBOUNCE_MS = 1000; // Prevent processing same event within 1 second
let deviceIdLogged = false; // Track if device ID has been logged to reduce spam

export const useDataCloudSDK = (config: Partial<DataCloudConfig> = {}) => {
  const sdkConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceIdState, setDeviceIdState] = useState<string>('');
  const deviceId = useRef<string>('');

  // Load the Data Cloud script
  const loadScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${sdkConfig.scriptUrl}"]`);
      if (existingScript) {
        console.log('📄 Data Cloud script already exists, checking if loaded...');
        // Wait a bit more for the script to fully execute
        setTimeout(() => resolve(), 500);
        return;
      }

      console.log('📥 Loading Data Cloud SDK script:', sdkConfig.scriptUrl);
      const script = document.createElement('script');
      script.src = sdkConfig.scriptUrl;
      script.async = true;
      script.defer = true; // Also add defer to ensure proper loading
      
      script.onload = () => {
        console.log('✅ Data Cloud SDK script loaded successfully');
        // Give the script time to execute and create globals
        setTimeout(() => resolve(), 1000);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Data Cloud SDK script');
        reject(new Error('Failed to load Data Cloud SDK script'));
      };

      document.head.appendChild(script);
    });
  }, [sdkConfig.scriptUrl, sdkConfig.enableDebug]);

  // Initialize the SDK
  const initializeSDK = useCallback(async () => {
    // If already initialized, just update local state
    if (globalIsInitialized) {
      if (sdkConfig.enableDebug) {
        console.log('SDK already initialized globally, updating local state');
      }
      setIsInitialized(true);
      
      // If we have a device ID from global state, use it
      if (window.SalesforceInteractions && typeof (window.SalesforceInteractions as any).getAnonymousId === 'function') {
        try {
          const existingDeviceId = (window.SalesforceInteractions as any).getAnonymousId();
          if (existingDeviceId && !existingDeviceId.startsWith('embedded-')) {
            deviceId.current = existingDeviceId;
            setDeviceIdState(existingDeviceId);
          }
        } catch (e) {
          // Ignore errors
        }
      }
      return;
    }

    // If initialization is in progress, wait for it
    if (globalInitializationInProgress && initializationPromise) {
      if (sdkConfig.enableDebug) {
        console.log('SDK initialization in progress, waiting...');
      }
      await initializationPromise;
      setIsInitialized(globalIsInitialized);
      
      // Update local device ID if available
      if (globalIsInitialized && window.SalesforceInteractions) {
        try {
          const existingDeviceId = (window.SalesforceInteractions as any).getAnonymousId?.();
          if (existingDeviceId && !existingDeviceId.startsWith('embedded-')) {
            deviceId.current = existingDeviceId;
            setDeviceIdState(existingDeviceId);
          }
        } catch (e) {
          // Ignore errors
        }
      }
      return;
    }

    // Start new initialization
    if (sdkConfig.enableDebug) {
      console.log('🚀 Starting SDK initialization...');
    }
    globalInitializationInProgress = true;
    
    initializationPromise = (async () => {
      try {
        await loadScript();
        
        // Wait for SDK to be available - check for multiple possible global objects
        let attempts = 0;
        const maxAttempts = 50; // Increased for more thorough checking
        
        console.log('🔍 Waiting for Salesforce SDK to become available...');
        while (attempts < maxAttempts) {
          // First check for embedded messaging objects
          const hasEmbeddedMessaging = !!(window as any).embeddedservice_bootstrap;
          const hasSalesforceInteractions = !!(window as any).SalesforceInteractions;
          
          // Check for various possible global objects that Salesforce might create
          if (window.C360A || window.SalesforceInteractions || window.getSalesforceInteractions || window.SalesforceDataCloud || window.SFDC || window.sfdc || hasEmbeddedMessaging) {
            console.log(`✅ Found Salesforce SDK after ${attempts} attempts (${attempts * 200}ms)`);
            console.log('Available Salesforce objects:', {
              SalesforceInteractions: hasSalesforceInteractions,
              embeddedservice_bootstrap: hasEmbeddedMessaging,
              C360A: !!(window as any).C360A,
              DataCloud: !!(window as any).SalesforceDataCloud
            });
            break;
          }
          if (attempts % 10 === 0) {
            console.log(`🔍 Still waiting for SDK... attempt ${attempts}/${maxAttempts}`);
            console.log('Available window objects:', Object.keys(window).filter(key => 
              key.toLowerCase().includes('salesforce') || 
              key.toLowerCase().includes('c360') || 
              key.toLowerCase().includes('evergage') ||
              key.toLowerCase().includes('embedded')
            ));
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }

        // Try to find the SDK object - prioritize SalesforceInteractions since that's what the script creates
        let SDK = window.SalesforceInteractions || 
                  (window.getSalesforceInteractions && window.getSalesforceInteractions()) ||
                  window.C360A || 
                  window.SalesforceDataCloud || 
                  window.SFDC || 
                  window.sfdc;
        
        if (!SDK) {
          if (sdkConfig.enableDebug) {
            console.warn('Data Cloud SDK not found after script load. Available window objects:', Object.keys(window).filter(key => key.toLowerCase().includes('salesforce') || key.toLowerCase().includes('c360')));
          }
          
          // Fallback - create a mock SDK for development
          const mockSDK = {
            init: (config: any) => {
              console.log('Mock Data Cloud SDK initialized with config:', config);
            },
            sendEvent: (eventName: string, eventData: any) => {
              console.log('Mock Data Cloud event:', eventName, eventData);
            },
            identify: (userId: string, attributes: any) => {
              console.log('Mock Data Cloud identify:', userId, attributes);
            },
            getDeviceId: () => 'mock-device-id-' + Date.now(),
            setConsent: (hasConsent: boolean) => {
              console.log('Mock Data Cloud consent:', hasConsent);
            }
          };
          
          // Set the mock on the most likely global object
          window.SalesforceInteractions = mockSDK;
          window.C360A = mockSDK;
          
          if (sdkConfig.enableDebug) {
            console.log('Using mock Data Cloud SDK for development');
          }
        }

        // Initialize the SDK (real or mock) - prioritize SalesforceInteractions
        const finalSDK = window.SalesforceInteractions || window.C360A!; // Non-null assertion since we create a mock above
        
        // Check if we have a real SalesforceInteractions with getAnonymousId
        if (finalSDK && typeof (finalSDK as any).getAnonymousId === 'function') {
          console.log('✅ Found real SalesforceInteractions with getAnonymousId');
          try {
            const realDeviceId = (finalSDK as any).getAnonymousId();
            if (realDeviceId && !realDeviceId.startsWith('embedded-') && !realDeviceId.startsWith('fallback-')) {
              deviceId.current = realDeviceId;
              setDeviceIdState(realDeviceId);
              console.log('🆔 Using real SalesforceInteractions device ID:', realDeviceId);
            } else {
              const fallbackId = 'fallback-device-id-' + Date.now();
              deviceId.current = fallbackId;
              setDeviceIdState(fallbackId);
              console.log('🆔 SalesforceInteractions device ID appears to be fallback, using our own fallback');
            }
          } catch (error) {
            console.warn('Error getting device ID from SalesforceInteractions:', error);
            const fallbackId = 'fallback-device-id-' + Date.now();
            deviceId.current = fallbackId;
            setDeviceIdState(fallbackId);
          }
        } else {
          console.log('⚠️ No real SalesforceInteractions.getAnonymousId found, trying other methods...');
          
          const initConfig = {
            tenant: sdkConfig.tenantId,
            cookieDomain: sdkConfig.cookieDomain,
            consent: true, // Set default consent
            debug: sdkConfig.enableDebug
          };

          if (typeof finalSDK.init === 'function') {
            finalSDK.init(initConfig);
          }
          
          // Generate or retrieve device ID from Data Cloud SDK
          if (typeof finalSDK.getDeviceId === 'function') {
            const newDeviceId = finalSDK.getDeviceId();
            deviceId.current = newDeviceId;
            setDeviceIdState(newDeviceId);
          } else {
            const fallbackId = 'fallback-device-id-' + Date.now();
            deviceId.current = fallbackId;
            setDeviceIdState(fallbackId);
          }
        }
        
        setIsInitialized(true);
        globalIsInitialized = true;
        globalInitializationInProgress = false;
        
        if (sdkConfig.enableDebug) {
          console.log('Data Cloud SDK initialized with device ID:', deviceId.current);
        }

      } catch (error) {
        console.error('Failed to initialize Data Cloud SDK:', error);
        
        // Even if initialization fails, set up a mock for development
        if (!isInitialized) {
          const errorFallbackId = 'error-fallback-device-id-' + Date.now();
          deviceId.current = errorFallbackId;
          setDeviceIdState(errorFallbackId);
          setIsInitialized(true);
          globalIsInitialized = true;
          
          if (sdkConfig.enableDebug) {
            console.log('Using fallback device ID due to initialization error');
          }
        }
        globalInitializationInProgress = false;
      }
    })();
    
    await initializationPromise;
  }, [sdkConfig, loadScript]);

  // Track custom events
  const trackEvent = useCallback((eventName: string, attributes: Record<string, any> = {}) => {
    const SDK = window.SalesforceInteractions || window.C360A;
    if (!SDK || !isInitialized) {
      if (sdkConfig.enableDebug) {
        console.warn('Data Cloud SDK not initialized, skipping event:', eventName);
      }
      return;
    }

    // Skip tracking if SDK is our stub implementation
    const sdkAny = SDK as any;
    if (typeof sdkAny.getAnonymousId === 'function') {
      try {
        const anonymousId = sdkAny.getAnonymousId();
        if (anonymousId && anonymousId.startsWith('embedded-')) {
          if (sdkConfig.enableDebug) {
            console.log('Skipping event tracking with stub SDK:', eventName);
          }
          return;
        }
      } catch (e) {
        // Ignore errors from getAnonymousId check
      }
    }

    try {
      const eventData: TrackingEvent = {
        eventType: 'custom',
        eventName,
        timestamp: new Date().toISOString(),
        attributes: {
          ...attributes,
          source: 'delta-website',
          platform: 'web'
        },
        deviceId: deviceId.current
      };

      // Validate eventData before sending
      if (!eventName || typeof eventName !== 'string') {
        console.warn('Invalid event name:', eventName);
        return;
      }

      SDK.sendEvent(eventName, eventData);
      
      if (sdkConfig.enableDebug) {
        console.log('Event tracked:', eventName, eventData);
      }
    } catch (error) {
      if (sdkConfig.enableDebug) {
        console.warn('Failed to track event (non-critical):', eventName, error);
      }
    }
  }, [sdkConfig.enableDebug]);

  // Track page views
  const trackPageView = useCallback((pagePath: string, pageTitle?: string) => {
    trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      referrer: document.referrer,
      url: window.location.href
    });
  }, [trackEvent]);

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string, details: Record<string, any>) => {
    trackEvent('user_interaction', {
      interaction_type: interactionType,
      ...details
    });
  }, [trackEvent]);

  // Track travel-specific events
  const trackTravelEvent = useCallback((eventType: string, data: Record<string, any>) => {
    if (!eventType || typeof eventType !== 'string') {
      if (sdkConfig.enableDebug) {
        console.warn('Invalid travel event type:', eventType);
      }
      return;
    }
    
    try {
      trackEvent(`travel_${eventType}`, {
        travel_event_type: eventType,
        ...data
      });
    } catch (error) {
      if (sdkConfig.enableDebug) {
        console.warn('Failed to track travel event (non-critical):', eventType, error);
      }
    }
  }, [trackEvent, sdkConfig.enableDebug]);

  // Identify user
  const identifyUser = useCallback((userId: string, attributes: Record<string, any> = {}) => {
    const SDK = window.SalesforceInteractions || window.C360A;
    if (!SDK || !isInitialized) {
      if (sdkConfig.enableDebug) {
        console.warn('Data Cloud SDK not initialized, cannot identify user');
      }
      return;
    }

    // Skip if using stub SDK
    const sdkAny = SDK as any;
    if (typeof sdkAny.getAnonymousId === 'function') {
      try {
        const anonymousId = sdkAny.getAnonymousId();
        if (anonymousId && anonymousId.startsWith('embedded-')) {
          if (sdkConfig.enableDebug) {
            console.log('Skipping user identification with stub SDK');
          }
          return;
        }
      } catch (e) {
        // Ignore errors from getAnonymousId check
      }
    }

    try {
      SDK.identify(userId, {
        ...attributes,
        device_id: deviceId.current,
        platform: 'web',
        website: 'delta.com'
      });
      
      if (sdkConfig.enableDebug) {
        console.log('User identified:', userId, attributes);
      }
    } catch (error) {
      if (sdkConfig.enableDebug) {
        console.warn('Failed to identify user (non-critical):', error);
      }
    }
  }, [sdkConfig.enableDebug]);

  // Set consent status
  const setConsent = useCallback((hasConsent: boolean) => {
    const SDK = window.SalesforceInteractions || window.C360A;
    if (!SDK || !isInitialized) {
      if (sdkConfig.enableDebug) {
        console.warn('Data Cloud SDK not initialized, cannot set consent');
      }
      return;
    }

    // Skip if using stub SDK
    const sdkAny = SDK as any;
    if (typeof sdkAny.getAnonymousId === 'function') {
      try {
        const anonymousId = sdkAny.getAnonymousId();
        if (anonymousId && anonymousId.startsWith('embedded-')) {
          if (sdkConfig.enableDebug) {
            console.log('Skipping consent setting with stub SDK');
          }
          return;
        }
      } catch (e) {
        // Ignore errors from getAnonymousId check
      }
    }

    try {
      SDK.setConsent(hasConsent);
      
      if (sdkConfig.enableDebug) {
        console.log('Consent set:', hasConsent);
      }
    } catch (error) {
      if (sdkConfig.enableDebug) {
        console.warn('Failed to set consent (non-critical):', error);
      }
    }
  }, [sdkConfig.enableDebug]);

  // Initialize on mount and listen for SalesforceInteractions ready event
  useEffect(() => {
    // Create local handler that will be added to the global set
    const handleSalesforceReady = (event: CustomEvent) => {
      // Debounce to prevent rapid-fire processing
      const now = Date.now();
      if (now - lastProcessedEventTime < EVENT_DEBOUNCE_MS) {
        if (sdkConfig.enableDebug) {
          console.log('🔄 Skipping duplicate salesforceInteractionsReady event (debounced)');
        }
        return;
      }
      lastProcessedEventTime = now;
      
      console.log('🎉 SalesforceInteractions ready event received:', event.detail);
      
      // DETAILED MONITORING: Check current state before processing
      console.log('📊 USEDATA_CLOUD_SDK: State before processing event:');
      console.log('   - Current deviceId.current:', deviceId.current);
      console.log('   - Current deviceIdState:', deviceIdState);
      console.log('   - Current isInitialized:', isInitialized);
      console.log('   - SalesforceInteractions.getAnonymousId():', window.SalesforceInteractions?.getAnonymousId?.());
      console.log('   - Event timestamp:', now);
      
      const { realSDK, deviceId: providedDeviceId } = event.detail || {};
      
      // Accept any device ID - whether real, generated, or fallback
      if (providedDeviceId && providedDeviceId !== '') {
        console.log('📝 USEDATA_CLOUD_SDK: Processing provided device ID:', providedDeviceId);
        
        deviceId.current = providedDeviceId;
        setDeviceIdState(providedDeviceId);
        setIsInitialized(true);
        globalIsInitialized = true;
        globalInitializationInProgress = false;
        
        // Check state after React state updates have processed
        setTimeout(() => {
          console.log('📊 USEDATA_CLOUD_SDK: State after React updates:');
          console.log('   - deviceId.current:', deviceId.current);
          console.log('   - deviceIdState:', deviceIdState);
          console.log('   - isInitialized:', isInitialized);
          console.log('   - SalesforceInteractions.getAnonymousId():', window.SalesforceInteractions?.getAnonymousId?.());
          console.log('   - Hook return value:', deviceIdState || deviceId.current);
          console.log('   - State sync successful:', deviceIdState === providedDeviceId);
        }, 100);
        
        // Only log device ID info once to reduce console spam
        if (!deviceIdLogged) {
          console.log('✅ Data Cloud SDK ready with device ID from index.html:', providedDeviceId);
          console.log('🎯 Device ID type:', realSDK ? 'Real Salesforce SDK' : 'Generated fallback');
          console.log('🎯 Device ID should now be used for personalization calls');
          deviceIdLogged = true;
        }
        
        // Notify all registered callbacks
        globalEventHandlerCallbacks.forEach(callback => {
          if (callback !== handleSalesforceReady) {
            try {
              callback(event);
            } catch (error) {
              console.warn('Error in global event handler callback:', error);
            }
          }
        });
      } else {
        console.log('🔄 Event received but no device ID, falling back to manual initialization...');
        if (!globalIsInitialized && !globalInitializationInProgress) {
          initializeSDK();
        }
      }
    };
    
    // Add this handler to the global set
    globalEventHandlerCallbacks.add(handleSalesforceReady);
    
    // Register the global event listener only once
    if (!globalEventListenerRegistered) {
      const globalEventHandler = (event: Event) => {
        const customEvent = event as CustomEvent;
        // Call the first handler in the set (they all do the same thing now)
        const firstHandler = globalEventHandlerCallbacks.values().next().value;
        if (firstHandler) {
          firstHandler(customEvent);
        }
      };
      
      window.addEventListener('salesforceInteractionsReady', globalEventHandler);
      globalEventListenerRegistered = true;
      
      if (sdkConfig.enableDebug) {
        console.log('🎧 Global salesforceInteractionsReady event listener registered');
      }
    }
    
    // Also try to initialize immediately in case SDK is already ready
    if (window.SalesforceInteractions && typeof (window.SalesforceInteractions as any).getAnonymousId === 'function') {
      try {
        const existingDeviceId = (window.SalesforceInteractions as any).getAnonymousId();
        if (existingDeviceId && !existingDeviceId.startsWith('embedded-')) {
          deviceId.current = existingDeviceId;
          setDeviceIdState(existingDeviceId);
          setIsInitialized(true);
          globalIsInitialized = true;
          
          if (sdkConfig.enableDebug) {
            console.log('✅ Data Cloud SDK already ready with device ID:', existingDeviceId);
          }
        }
      } catch (e) {
        // Try fallback initialization
        initializeSDK();
      }
    } else {
      // Try fallback initialization
      initializeSDK();
    }
    
    return () => {
      // Remove this handler from the global set
      globalEventHandlerCallbacks.delete(handleSalesforceReady);
      
      // Note: We don't remove the global event listener because other instances might still need it
      // The global listener will be cleaned up when the last component unmounts
    };
  }, [initializeSDK, sdkConfig.enableDebug]);

  return {
    isInitialized,
    deviceId: deviceIdState || deviceId.current,
    trackEvent,
    trackPageView,
    trackInteraction,
    trackTravelEvent,
    identifyUser,
    setConsent,
    initializeSDK
  };
};