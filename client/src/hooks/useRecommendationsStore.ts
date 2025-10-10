// State management for dynamic recommendations
import { useState, useCallback, useEffect } from 'react';

export interface Recommendation {
  id: string;
  type: 'promotion' | 'upgrade' | 'partner' | 'destination';
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl?: string;
  priority: number;
  validUntil?: string;
  targetAudience?: string[];
  metadata?: Record<string, any>;
}

interface ChatContext {
  destination?: string;
  travelDates?: string;
  travelClass?: string;
  passengerCount?: number;
  purpose?: string;
}

// Simple React state-based store as fallback
const initialState = {
  recommendations: [] as Recommendation[],
  loading: false,
  lastUpdated: null as Date | null,
  chatContext: {} as ChatContext
};

let globalState = { ...initialState };
const listeners = new Set<() => void>();

const setState = (newState: Partial<typeof globalState>) => {
  globalState = { ...globalState, ...newState };
  listeners.forEach(listener => listener());
};

export const useRecommendationsStore = () => {
  const [, forceUpdate] = useState({});
  
  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);
  
  // Subscribe to global state changes
  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, [rerender]);
  
  const setRecommendations = useCallback((recommendations: Recommendation[]) => {
    const sorted = recommendations.sort((a, b) => b.priority - a.priority);
    setState({
      recommendations: sorted,
      lastUpdated: new Date(),
      loading: false
    });
  }, []);
  
  const addRecommendation = useCallback((recommendation: Recommendation) => {
    const updated = [...globalState.recommendations, recommendation].sort((a, b) => b.priority - a.priority);
    setState({ 
      recommendations: updated,
      lastUpdated: new Date()
    });
  }, []);
  
  const updateChatContext = useCallback((context: Partial<ChatContext>) => {
    setState({
      chatContext: { ...globalState.chatContext, ...context }
    });
  }, []);
  
  const setLoading = useCallback((loading: boolean) => {
    setState({ loading });
  }, []);
  
  const clearRecommendations = useCallback(() => {
    setState({ 
      recommendations: [], 
      lastUpdated: null,
      chatContext: {}
    });
  }, []);
  
  return {
    ...globalState,
    setRecommendations,
    addRecommendation,
    updateChatContext,
    setLoading,
    clearRecommendations
  };
};