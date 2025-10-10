// Dynamic Recommendations Page
import React, { useEffect, useRef } from 'react';
import { useRecommendationsStore, type Recommendation } from '../hooks/useRecommendationsStore';
import { useDeltaPersonalization } from '../hooks/useDeltaPersonalization';
import { useDataCloud } from '../components/DataCloudProvider';
import { useSalesforceInteractions } from '../hooks/useSalesforceInteractions';

// Individual recommendation card component
function RecommendationCard({ recommendation, onInteraction }: { 
  recommendation: Recommendation;
  onInteraction: (id: string, action: 'view' | 'click' | 'dismiss') => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Removed automatic view tracking - only track clicks and dismissals now
  
  const handleClick = () => {
    onInteraction(recommendation.id, 'click');
    if (recommendation.ctaUrl) {
      window.location.href = recommendation.ctaUrl;
    }
  };
  
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction(recommendation.id, 'dismiss');
  };
  
  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
      onClick={handleClick}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 transition-all"
        aria-label="Dismiss recommendation"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Image */}
      {recommendation.imageUrl && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={recommendation.imageUrl}
            alt={recommendation.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Type badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold ${getTypeBadgeStyles(recommendation.type)}`}>
            {recommendation.type.toUpperCase()}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {recommendation.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {recommendation.description}
        </p>
        
        {/* Validity */}
        {recommendation.validUntil && (
          <div className="flex items-center text-xs text-orange-600 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Valid until {new Date(recommendation.validUntil).toLocaleDateString()}
          </div>
        )}
        
        {/* CTA Button */}
        <button className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors font-medium">
          {recommendation.ctaText}
        </button>
      </div>
    </div>
  );
}

// Loading skeleton component
function RecommendationSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse mt-4"></div>
      </div>
    </div>
  );
}

// Main recommendations page
export default function RecommendationsPage() {
  const { recommendations, loading, lastUpdated, chatContext, setRecommendations } = useRecommendationsStore();
  const { fetchRecommendations, trackInteraction, processChatMessage } = useDeltaPersonalization();
  const { trackTravelEvent, isInitialized } = useDataCloud();
  const { personalizationProductRecommendations, isReady } = useSalesforceInteractions();
  const recommendationsRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to recommendations when new ones arrive
  useEffect(() => {
    if (recommendations.length > 0 && recommendationsRef.current) {
      recommendationsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [recommendations.length]);
  
  
  // Load initial personalized recommendations on page load
  useEffect(() => {
    const loadInitialRecommendations = async () => {
      console.log('🔍 RECOMMENDATIONS PAGE: Checking initial loading conditions:', {
        isReady,
        recommendationsLength: recommendations.length,
        hasPersonalizationFunction: !!personalizationProductRecommendations,
        salesforceInteractions: !!(window as any).SalesforceInteractions,
        personalizationAPI: !!(window as any).SalesforceInteractions?.Personalization?.fetch,
        currentTime: new Date().toISOString()
      });
      
      if (!isReady) {
        console.log('❌ RECOMMENDATIONS PAGE: SalesforceInteractions not ready yet, will retry...');
        return;
      }
      
      if (recommendations.length > 0) {
        console.log('✅ RECOMMENDATIONS PAGE: Already have recommendations, skipping initial load');
        return;
      }
      
      console.log('🎯 RECOMMENDATIONS PAGE: All conditions met, loading Delta_Promos recommendations...');
      try {
        const results = await personalizationProductRecommendations(['Delta_Promos']);
        console.log(`📊 RECOMMENDATIONS PAGE: API returned ${results.length} recommendations:`, results);
        
        if (results.length > 0) {
          console.log(`✅ RECOMMENDATIONS PAGE: Successfully loaded ${results.length} recommendations from Delta_Promos`);
          // Transform and set recommendations using the same logic as the chat handler
          const transformedRecommendations = results.map(item => ({
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
              source: 'salesforce-personalization-pageload',
              loadedAt: new Date().toISOString()
            }
          }));
          
          // Set the recommendations using the hook
          setRecommendations(transformedRecommendations);
          console.log('✅ RECOMMENDATIONS PAGE: Recommendations set in store, should now display on page');
        } else {
          console.log('⚠️ RECOMMENDATIONS PAGE: API succeeded but returned 0 recommendations');
        }
      } catch (error) {
        console.error('❌ RECOMMENDATIONS PAGE: Failed to load initial recommendations:', error);
      }
    };

    loadInitialRecommendations();
    
    // If SDK isn't ready yet, try again after a delay
    if (!isReady) {
      const retryTimer = setTimeout(() => {
        console.log('🔄 Retrying recommendation loading...');
        loadInitialRecommendations();
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isReady, personalizationProductRecommendations, recommendations.length, setRecommendations]);

  // Set up agent chat message listener for automatic re-personalization
  useEffect(() => {
    const handleAgentMessage = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const sender = customEvent?.detail?.conversationEntry?.sender?.appType;
      const entryPayload = customEvent?.detail?.conversationEntry?.entryPayload;
      
      if (!entryPayload) return;
      
      try {
        const parsedPayload = JSON.parse(entryPayload);
        const messageText = parsedPayload?.abstractMessage?.staticContent?.text;
        const initialMessage = messageText === "Hi, I'm an AI service assistant. How can I help you?";

        // Only process chatbot messages that aren't the initial greeting
        if (sender !== "chatbot" || initialMessage) return;

        console.log('🤖 Agent message detected, refreshing personalized recommendations...');
        console.log('💬 Agent message:', messageText);

        // Small delay to ensure message is fully processed
        setTimeout(async () => {
          try {
            const results = await personalizationProductRecommendations(['Delta_Promos']);
            console.log(`✅ Refreshed ${results.length} recommendations after agent message`);
            
            // Transform and update recommendations
            const transformedRecommendations = results.map(item => ({
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
                source: 'salesforce-personalization-agentmessage',
                agentMessage: messageText,
                refreshedAt: new Date().toISOString()
              }
            }));
            
            // Update the recommendations using the hook
            setRecommendations(transformedRecommendations);
            
            // Track the agent-triggered refresh
            if (isInitialized) {
              trackTravelEvent('agent_message_personalization_refresh', {
                agent_message: messageText,
                recommendation_count: transformedRecommendations.length,
                source: 'agentforce_chat'
              });
            }
          } catch (error) {
            console.error('Failed to refresh recommendations after agent message:', error);
          }
        }, 100);

      } catch (error) {
        console.error('Error parsing agent message:', error);
      }
    };

    // Add the event listener for agent messages
    if (isReady) {
      console.log('🎧 Setting up listener for agent chat messages...');
      window.addEventListener('onEmbeddedMessageSent', handleAgentMessage);
      
      return () => {
        console.log('🧹 Cleaning up agent message listener');
        window.removeEventListener('onEmbeddedMessageSent', handleAgentMessage);
      };
    }
  }, [isReady, personalizationProductRecommendations, trackTravelEvent, isInitialized, setRecommendations]);

  // Track page visit
  useEffect(() => {
    if (isInitialized) {
      trackTravelEvent('recommendation_page_visit', {
        existing_recommendations_count: recommendations.length,
        has_chat_context: Object.keys(chatContext).length > 0
      });
    }
  }, [isInitialized, trackTravelEvent, recommendations.length, chatContext]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personalized Recommendations</h1>
              <p className="text-gray-600 mt-1">
                Tailored offers and suggestions based on your travel preferences
              </p>
            </div>
            
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat context display */}
      {Object.keys(chatContext).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Current Context</h3>
            <div className="flex flex-wrap gap-2">
              {chatContext.destination && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  📍 {chatContext.destination}
                </span>
              )}
              {chatContext.travelClass && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  ✈️ {chatContext.travelClass}
                </span>
              )}
              {chatContext.travelDates && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  📅 {chatContext.travelDates}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      
      {/* Recommendations grid */}
      <div ref={recommendationsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Loading Recommendations...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <RecommendationSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : recommendations.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Your Personalized Recommendations ({recommendations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onInteraction={trackInteraction}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8-4 4-4-4m0 0L9 1m2 8v8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with our digital agent to get personalized travel recommendations.
            </p>
            <a
              href="/agent"
              className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Chat with Agent
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.02-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for type badge styles
function getTypeBadgeStyles(type: Recommendation['type']) {
  switch (type) {
    case 'promotion':
      return 'bg-green-100 text-green-800';
    case 'upgrade':
      return 'bg-purple-100 text-purple-800';
    case 'partner':
      return 'bg-blue-100 text-blue-800';
    case 'destination':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}