// Salesforce Interactions integration for personalization
import { useCallback } from 'react';
import { useDataCloudSDK } from './useDataCloudSDK';

interface PersonalizationResponse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl?: string;
  type: string;
  priority: number;
  validUntil?: string;
  targetAudience: string[];
  metadata?: Record<string, any>;
}

interface SalesforcePersonalizationAPI {
  fetch: (campaigns: string | string[]) => Promise<any>;
}

interface SalesforceInteractionsAPI extends Record<string, any> {
  getAnonymousId?: () => string;
  sendEvent?: (eventName: string, eventData: any) => void;
  identify?: (userId: string, attributes?: Record<string, any>) => void;
  setConsent?: (hasConsent: boolean) => void;
  Personalization?: SalesforcePersonalizationAPI;
}

export const useSalesforceInteractions = () => {
  const { deviceId, isInitialized } = useDataCloudSDK();
  
  // Debug log the state from useDataCloudSDK
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useSalesforceInteractions: useDataCloudSDK state:', { 
      deviceId, 
      isInitialized,
      salesforceInteractionsDeviceId: window.SalesforceInteractions?.getAnonymousId?.(),
      timestamp: Date.now()
    });
  }

  // Get anonymous device ID from Salesforce Interactions
  const getAnonymousId = useCallback((): string => {
    const salesforceAPI = (window as any).SalesforceInteractions;
    if (salesforceAPI?.getAnonymousId && typeof salesforceAPI.getAnonymousId === 'function') {
      try {
        const sfId = salesforceAPI.getAnonymousId();
        // If it's a real device ID (not our stub), use it
        if (sfId && !sfId.startsWith('embedded-') && !sfId.startsWith('fallback-')) {
          console.log('🆔 Using real Salesforce device ID:', sfId);
          return sfId;
        }
      } catch (error) {
        console.warn('Failed to get anonymous ID from SalesforceInteractions:', error);
      }
    }
    
    // Fallback to Data Cloud SDK device ID if available and real
    if (deviceId && !deviceId.startsWith('fallback-')) {
      console.log('🆔 Using Data Cloud device ID:', deviceId);
      return deviceId;
    }
    
    // Last resort fallback
    const fallbackId = `fallback-${Date.now()}`;
    console.log('🆔 Using fallback device ID:', fallbackId);
    return fallbackId;
  }, [deviceId]);

  // Send event to Salesforce Interactions
  const sendInteractionEvent = useCallback((eventName: string, eventData: any) => {
    const salesforceAPI = (window as any).SalesforceInteractions;
    if (!salesforceAPI?.sendEvent || typeof salesforceAPI.sendEvent !== 'function') {
      console.warn('SalesforceInteractions.sendEvent not available');
      return;
    }

    try {
      // Format event data in the structure expected by Salesforce
      const formattedEvent = {
        interaction: {
          name: eventName,
          eventType: eventData.eventType || 'custom',
          category: eventData.category || 'Engagement',
          ...eventData
        },
        user: {
          attributes: {
            eventType: 'identity',
            deviceId: getAnonymousId(),
            timestamp: new Date().toISOString(),
            isAnonymous: '1'
          }
        }
      };

      salesforceAPI.sendEvent(formattedEvent);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📨 Event sent to SalesforceInteractions:', eventName, formattedEvent);
      }
    } catch (error) {
      console.warn('Failed to send event to SalesforceInteractions:', error);
    }
  }, [getAnonymousId]);

  // Send chat message to Salesforce Data Cloud (following the example pattern)
  const sendChatMessage = useCallback((chatMessage: string, userInfo?: any) => {
    const salesforceAPI = (window as any).SalesforceInteractions;
    if (!salesforceAPI?.sendEvent) {
      console.warn('SalesforceInteractions.sendEvent not available');
      return;
    }

    try {
      const eventData = {
        interaction: {
          name: "chatMessage",
          chatMessage,
          eventType: "chatActivities",
          category: "Engagement",
        }
      };

      // Add user attributes if provided
      if (userInfo) {
        (eventData as any).user = {
          attributes: {
            eventType: "identity",
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            isAnonymous: userInfo.isAnonymous || "1",
            email: userInfo.email,
            phoneNumber: userInfo.phoneNumber,
          }
        };
      }

      salesforceAPI.sendEvent(eventData);
      console.log('📨 Chat message sent to Salesforce:', chatMessage);
    } catch (error) {
      console.error('Failed to send chat message to Salesforce:', error);
    }
  }, []);

  // Call Salesforce Personalization API using SalesforceInteractions.Personalization.fetch()
  const personalizationProductRecommendations = useCallback(async (campaigns: string[], anchorId?: string): Promise<PersonalizationResponse[]> => {
    if (!campaigns.length) {
      console.warn('No personalization campaigns provided');
      return [];
    }

    const anonymousId = getAnonymousId();
    
    try {
      const salesforceAPI = (window as any).SalesforceInteractions;
      
      if (!salesforceAPI?.Personalization?.fetch) {
        console.warn('SalesforceInteractions.Personalization.fetch not available');
        return [];
      }

      console.log(`🎯 Calling SalesforceInteractions.Personalization.fetch with campaigns:`, campaigns);
      
      // Check if Personalization API exists
      if (!salesforceAPI.Personalization?.fetch) {
        console.error('❌ SalesforceInteractions.Personalization.fetch is not available');
        console.log('Available SalesforceInteractions methods:', Object.keys(salesforceAPI));
        if (salesforceAPI.Personalization) {
          console.log('Available Personalization methods:', Object.keys(salesforceAPI.Personalization));
        }
        return [];
      }
      
      // Call the actual Salesforce Personalization API with deviceId as individualId
      const options = {
        individualId: anonymousId,
        ...(anchorId && { anchorId })
      };
      console.log('📡 Calling fetch with options:', options);
      
      const response = await salesforceAPI.Personalization.fetch(campaigns, options);
      
      console.log('✅ Raw Personalization Response:', response);
      console.log('✅ Personalizations array:', response?.personalizations);
      console.log('✅ First personalization data:', response?.personalizations?.[0]?.data);
      
      // Enhanced debugging for missing data/attributes
      if (response?.personalizations?.length > 0) {
        response.personalizations.forEach((personalization: any, index: number) => {
          console.log(`🔍 Personalization ${index}:`, {
            hasData: !!personalization.data,
            hasAttributes: !!personalization.attributes,
            dataLength: personalization.data?.length || 0,
            attributesKeys: personalization.attributes ? Object.keys(personalization.attributes) : [],
            fullPersonalization: personalization
          });
        });
      } else {
        console.log('⚠️ No personalizations in response');
      }
      
      // Transform Salesforce personalization response to our format
      const allRecommendations: PersonalizationResponse[] = [];
      
      if (response?.personalizations && Array.isArray(response.personalizations)) {
        response.personalizations.forEach((personalization: any, personalizationIndex: number) => {
          // Get recommended items from the data field
          const recommendedItems = personalization.data || [];
          
          recommendedItems.forEach((item: any, itemIndex: number) => {
            const recommendation: PersonalizationResponse = {
              id: item.personalizationContentId || item['ssot__Id__c'] || `sf-rec-${Date.now()}-${personalizationIndex}-${itemIndex}`,
              title: item['ssot__Name__c'] || item.title || item.name || 'Exclusive Offer',
              description: item['ssot__Description__c'] || item.description || item.content || 'Personalized recommendation for you',
              imageUrl: item['ImageURL__c'] || item.imageUrl || item.image || `https://picsum.photos/seed/${item.personalizationContentId || itemIndex}/400/240`,
              ctaText: item.ctaText || item.buttonText || 'Learn More',
              ctaUrl: item.ctaUrl || item.link || item.url,
              type: item['ssot__PrimaryProductCategory__c'] || item['Product_Type__c'] || personalization.personalizationPointName || 'salesforce-personalization',
              priority: item.priority || (95 - (personalizationIndex * 10) - itemIndex), // High priority for Salesforce content
              validUntil: item.validUntil || item.expiresAt,
              targetAudience: item.targetAudience || ['all'],
              metadata: {
                source: 'salesforce-personalization',
                campaign: personalization.personalizationPointName || campaigns[personalizationIndex],
                originalData: item,
                deviceId: anonymousId,
                personalizationIndex,
                itemIndex,
                personalizationId: personalization.personalizationId,
                decisionId: personalization.decisionId,
                productPrice: item['Product_Price__c'],
                productType: item['Product_Type__c'],
                primaryCategory: item['ssot__PrimaryProductCategory__c'],
                attributes: personalization.attributes // Include any campaign attributes
              }
            };
            
            allRecommendations.push(recommendation);
          });
        });
      }
      
      // Track successful personalization call
      sendInteractionEvent('personalization_success', {
        campaigns,
        anchorId,
        recommendationCount: allRecommendations.length,
        deviceId: anonymousId,
        rawResponse: response
      });

      console.log(`✅ Transformed ${allRecommendations.length} Salesforce personalization recommendations`);
      
      // Sort by priority and return
      return allRecommendations.sort((a, b) => b.priority - a.priority);
        
    } catch (error) {
      console.error(`❌ Failed to fetch Salesforce personalization:`, error);
      
      // Track personalization error
      sendInteractionEvent('personalization_error', {
        campaigns,
        anchorId,
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceId: anonymousId
      });
      
      return [];
    }
  }, [getAnonymousId, sendInteractionEvent]);

  // Track recommendation interactions
  const trackRecommendationInteraction = useCallback((recommendationId: string, action: string, metadata?: any) => {
    sendInteractionEvent('recommendation_interaction', {
      recommendationId,
      action,
      metadata,
      deviceId: getAnonymousId()
    });
  }, [sendInteractionEvent, getAnonymousId]);

  // Set user identity when known
  const identifyUser = useCallback((userId: string, attributes?: Record<string, any>) => {
    const salesforceAPI = (window as any).SalesforceInteractions;
    if (salesforceAPI?.identify && typeof salesforceAPI.identify === 'function') {
      try {
        salesforceAPI.identify(userId, {
          ...attributes,
          deviceId: getAnonymousId(),
          platform: 'web',
          website: 'delta.com'
        });
      } catch (error) {
        console.warn('Failed to identify user with SalesforceInteractions:', error);
      }
    }
  }, [getAnonymousId]);

  // Enhanced readiness check with debugging
  const salesforceAPI = (window as any).SalesforceInteractions;
  const hasPersonalizationAPI = !!(salesforceAPI?.Personalization?.fetch);
  const isReady = isInitialized && !!salesforceAPI && hasPersonalizationAPI;
  
  // Debug logging for troubleshooting
  if (process.env.NODE_ENV === 'development' && isInitialized && !isReady) {
    console.log('🔍 SalesforceInteractions readiness check:', {
      isInitialized,
      hasSalesforceInteractions: !!salesforceAPI,
      hasPersonalizationAPI,
      salesforceAPIKeys: salesforceAPI ? Object.keys(salesforceAPI) : [],
      personalizationKeys: salesforceAPI?.Personalization ? Object.keys(salesforceAPI.Personalization) : []
    });
  }

  return {
    personalizationProductRecommendations,
    trackRecommendationInteraction,
    getAnonymousId,
    sendInteractionEvent,
    sendChatMessage,
    identifyUser,
    isReady
  };
};

export default useSalesforceInteractions;