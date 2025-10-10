// Delta-specific personalization API integration
import { useCallback } from 'react';
import { useRecommendationsStore, type Recommendation } from './useRecommendationsStore';
import { useDataCloudSDK } from './useDataCloudSDK';
import { useSalesforceInteractions } from './useSalesforceInteractions';

export interface PersonalizationContext {
  userId?: string;
  sessionId?: string;
  chatMessage?: string;
  destination?: string;
  travelDates?: string;
  travelClass?: string;
  membershipTier?: string;
  recentBookings?: string[];
}

// Mock recommendations based on context
const generateMockRecommendations = (context: PersonalizationContext): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // Route-specific deals
  if (context.destination) {
    recommendations.push({
      id: `dest-${Date.now()}`,
      type: 'destination',
      title: `Special Offers to ${context.destination}`,
      description: `Save up to 25% on flights to ${context.destination}. Limited time offer!`,
      imageUrl: `https://picsum.photos/seed/${context.destination}/400/240`,
      ctaText: 'Book Now',
      ctaUrl: `/search?destination=${context.destination}`,
      priority: 90,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['all'],
      metadata: { source: 'chat', destination: context.destination }
    });
  }
  
  // Upgrade promotions based on travel class
  if (context.travelClass === 'economy') {
    recommendations.push({
      id: `upgrade-${Date.now()}`,
      type: 'upgrade',
      title: 'Comfort+ Upgrade Available',
      description: 'Experience extra legroom and priority boarding for just $79 more.',
      imageUrl: 'https://picsum.photos/seed/comfort/400/240',
      ctaText: 'Upgrade Now',
      priority: 85,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['economy-travelers'],
      metadata: { source: 'chat', upgradeType: 'comfort-plus' }
    });
  }
  
  // Membership tier specific offers
  if (context.membershipTier) {
    recommendations.push({
      id: `tier-${Date.now()}`,
      type: 'promotion',
      title: `Exclusive ${context.membershipTier} Medallion Offer`,
      description: 'Double SkyMiles on your next three flights. Members only.',
      imageUrl: 'https://picsum.photos/seed/medallion/400/240',
      ctaText: 'Activate Offer',
      priority: 95,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: [context.membershipTier],
      metadata: { source: 'chat', tier: context.membershipTier }
    });
  }
  
  // Partner offers
  recommendations.push({
    id: `partner-${Date.now()}`,
    type: 'partner',
    title: 'Hotel & Car Rental Package',
    description: 'Book hotel and car together with your flight and save an additional 15%.',
    imageUrl: 'https://picsum.photos/seed/hotel/400/240',
    ctaText: 'View Packages',
    priority: 70,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    targetAudience: ['all'],
    metadata: { source: 'chat', type: 'bundle' }
  });
  
  return recommendations;
};

export const useDeltaPersonalization = () => {
  const { setRecommendations, setLoading, updateChatContext } = useRecommendationsStore();
  const { trackEvent, trackTravelEvent, deviceId, isInitialized } = useDataCloudSDK();
  const { personalizationProductRecommendations, trackRecommendationInteraction, sendChatMessage } = useSalesforceInteractions();
  
  const fetchRecommendations = useCallback(async (context: PersonalizationContext) => {
    setLoading(true);
    
    try {
      // Track recommendation request event
      if (isInitialized) {
        trackTravelEvent('recommendation_request', {
          destination: context.destination,
          travel_class: context.travelClass,
          user_id: context.userId,
          device_id: deviceId,
          chat_message: context.chatMessage
        });
      }
      
      // Update chat context
      updateChatContext({
        destination: context.destination,
        travelDates: context.travelDates,
        travelClass: context.travelClass,
        passengerCount: 1 // default
      });
      
      let recommendations: Recommendation[] = [];
      
      // Try to get real Salesforce personalization first
      try {
        console.log('🎯 Calling SalesforceInteractions.Personalization.fetch...');
        
        // Use only Delta_Promos campaign
        const campaigns = ['Delta_Promos'];
        
        const personalizedResults = await personalizationProductRecommendations(campaigns);
        
        // Transform Salesforce results to our Recommendation format
        recommendations = personalizedResults.map(item => ({
          id: item.id,
          type: item.type as any,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          ctaText: item.ctaText,
          ctaUrl: item.ctaUrl,
          priority: item.priority,
          validUntil: item.validUntil,
          targetAudience: item.targetAudience,
          metadata: {
            ...item.metadata,
            source: 'salesforce-personalization',
            context: context
          }
        }));
        
        console.log(`✅ Got ${recommendations.length} Salesforce personalized recommendations`);
      } catch (error) {
        console.warn('Failed to get Salesforce personalization, falling back to mock:', error);
      }
      
      // Fallback to mock recommendations if no personalization or if it failed
      if (recommendations.length === 0) {
        console.log('🎭 Using mock recommendations as fallback');
        recommendations = generateMockRecommendations(context);
      }
      
      setRecommendations(recommendations);
      
      // Track successful recommendation generation
      if (isInitialized) {
        trackEvent('recommendations_generated', {
          count: recommendations.length,
          context: JSON.stringify(context),
          device_id: deviceId
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      
      // Track error
      if (isInitialized) {
        trackEvent('recommendation_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: JSON.stringify(context),
          device_id: deviceId
        });
      }
      
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setRecommendations, setLoading, updateChatContext, trackEvent, trackTravelEvent, deviceId, isInitialized, personalizationProductRecommendations]);
  
  const trackInteraction = useCallback(async (recommendationId: string, action: 'view' | 'click' | 'dismiss') => {
    try {
      // Track with Salesforce Interactions for personalization feedback (this is the important one)
      trackRecommendationInteraction(recommendationId, action, {
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      });
      
      console.log(`Tracked ${action} for recommendation ${recommendationId}`);
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [trackRecommendationInteraction]);
  
  const processChatMessage = useCallback(async (message: string, userId?: string) => {
    // Send chat message to Salesforce Data Cloud
    sendChatMessage(message);
    
    // Track chat message event
    if (isInitialized) {
      trackEvent('chat_message', {
        message,
        user_id: userId,
        device_id: deviceId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Extract context from chat message using simple pattern matching
    // In a real implementation, this would use NLP or AI to extract intent
    const context: PersonalizationContext = {
      userId,
      sessionId: sessionStorage.getItem('sessionId') || deviceId,
      chatMessage: message
    };
    
    // Simple destination extraction
    const destinations = ['paris', 'london', 'tokyo', 'new york', 'los angeles', 'miami', 'seattle'];
    const foundDestination = destinations.find(dest => 
      message.toLowerCase().includes(dest)
    );
    if (foundDestination) {
      context.destination = foundDestination;
    }
    
    // Simple class extraction
    if (message.toLowerCase().includes('first class') || message.toLowerCase().includes('first-class')) {
      context.travelClass = 'first';
    } else if (message.toLowerCase().includes('business') || message.toLowerCase().includes('delta one')) {
      context.travelClass = 'business';
    } else if (message.toLowerCase().includes('comfort+') || message.toLowerCase().includes('comfort plus')) {
      context.travelClass = 'comfort+';
    } else {
      context.travelClass = 'economy';
    }
    
    return fetchRecommendations(context);
  }, [fetchRecommendations, trackEvent, sendChatMessage, deviceId, isInitialized]);
  
  return {
    fetchRecommendations,
    trackInteraction,
    processChatMessage
  };
};