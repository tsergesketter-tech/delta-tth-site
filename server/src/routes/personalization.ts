import express from 'express';

const router = express.Router();

interface PersonalizationRequest {
  deviceId: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  channel: string;
  source: string;
  context?: {
    page?: string;
    referrer?: string;
    userAgent?: string;
    destination?: string;
    travelClass?: string;
    travelDates?: string;
  };
}

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

// Mock personalization data based on context
const generatePersonalizedRecommendations = (request: PersonalizationRequest): PersonalizationResponse[] => {
  const recommendations: PersonalizationResponse[] = [];
  const context = request.context || {};
  
  console.log('🎯 Generating personalized recommendations for:', {
    deviceId: request.deviceId,
    page: context.page,
    destination: context.destination,
    travelClass: context.travelClass
  });

  // Page-specific recommendations
  if (context.page === '/recommendations') {
    recommendations.push({
      id: `page-rec-${Date.now()}`,
      title: 'SkyMiles Credit Card Bonus',
      description: 'Earn 70,000 bonus miles after spending $2,000 in first 3 months',
      imageUrl: 'https://picsum.photos/seed/creditcard/400/240',
      ctaText: 'Apply Now',
      ctaUrl: 'https://apply.americanexpress.com/delta',
      type: 'credit-card',
      priority: 95,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['all'],
      metadata: { source: 'backend-api', trigger: 'page-visit' }
    });
  }

  // Destination-specific offers
  if (context.destination) {
    const destinationTitles: Record<string, string> = {
      'paris': 'Paris Flash Sale',
      'london': 'London Adventure Package',
      'tokyo': 'Tokyo Experience Deal',
      'new york': 'NYC Weekend Getaway',
      'los angeles': 'LA Sunshine Special',
      'miami': 'Miami Beach Package',
      'seattle': 'Seattle Coffee & Culture'
    };

    const title = destinationTitles[context.destination.toLowerCase()] || `${context.destination} Special Offer`;
    
    recommendations.push({
      id: `dest-api-${Date.now()}`,
      title,
      description: `Save up to 30% on flights to ${context.destination}. Book by midnight to secure this exclusive rate!`,
      imageUrl: `https://picsum.photos/seed/${context.destination}/400/240`,
      ctaText: 'Book Flight',
      ctaUrl: `/search?destination=${encodeURIComponent(context.destination)}`,
      type: 'flight-deal',
      priority: 88,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['destination-seekers'],
      metadata: { 
        source: 'backend-api', 
        destination: context.destination,
        trigger: 'destination-mention'
      }
    });
  }

  // Travel class upgrades
  if (context.travelClass === 'economy') {
    recommendations.push({
      id: `upgrade-api-${Date.now()}`,
      title: 'Premium Select Upgrade',
      description: 'Upgrade to Premium Select for 50% off today only. Extra legroom, premium dining, and priority boarding.',
      imageUrl: 'https://picsum.photos/seed/premium/400/240',
      ctaText: 'Upgrade Now',
      type: 'upgrade',
      priority: 82,
      validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['economy-travelers'],
      metadata: { 
        source: 'backend-api', 
        currentClass: context.travelClass,
        trigger: 'class-optimization'
      }
    });
  }

  // Time-based offers
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 23) { // Evening offers
    recommendations.push({
      id: `evening-api-${Date.now()}`,
      title: 'Tonight Only: 15% Off International',
      description: 'Limited-time evening flash sale on international flights. Book before midnight!',
      imageUrl: 'https://picsum.photos/seed/international/400/240',
      ctaText: 'View Deals',
      ctaUrl: '/search?type=international',
      type: 'flash-sale',
      priority: 90,
      validUntil: new Date().setHours(23, 59, 59, 999).toString(),
      targetAudience: ['all'],
      metadata: { 
        source: 'backend-api', 
        trigger: 'time-based',
        hour 
      }
    });
  }

  // Device-specific (returning user vs new)
  const isReturningUser = request.sessionId && request.sessionId !== request.deviceId;
  if (isReturningUser) {
    recommendations.push({
      id: `returning-api-${Date.now()}`,
      title: 'Welcome Back Bonus',
      description: 'Thanks for returning! Get 2x SkyMiles on your next booking.',
      imageUrl: 'https://picsum.photos/seed/welcome/400/240',
      ctaText: 'Claim Bonus',
      type: 'loyalty-bonus',
      priority: 75,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: ['returning-users'],
      metadata: { 
        source: 'backend-api', 
        trigger: 'returning-user'
      }
    });
  }

  // Always include a hotel partnership offer
  recommendations.push({
    id: `partner-api-${Date.now()}`,
    title: 'Hotel + Flight Combo',
    description: 'Save 20% when you book hotel and flight together. Earn bonus miles on both!',
    imageUrl: 'https://picsum.photos/seed/hotel-combo/400/240',
    ctaText: 'Explore Packages',
    ctaUrl: '/packages',
    type: 'partner-offer',
    priority: 65,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    targetAudience: ['all'],
    metadata: { 
      source: 'backend-api', 
      trigger: 'default-partner'
    }
  });

  // Sort by priority
  return recommendations.sort((a, b) => b.priority - a.priority);
};

// POST /api/personalization - Get personalized recommendations
router.post('/', (req, res) => {
  try {
    const request: PersonalizationRequest = req.body;
    
    // Validate required fields
    if (!request.deviceId) {
      return res.status(400).json({ 
        error: 'deviceId is required' 
      });
    }

    console.log('📊 Personalization request received:', {
      deviceId: request.deviceId.substring(0, 8) + '...',
      page: request.context?.page,
      destination: request.context?.destination,
      travelClass: request.context?.travelClass,
      timestamp: request.timestamp
    });

    const recommendations = generatePersonalizedRecommendations(request);
    
    console.log(`✅ Generated ${recommendations.length} personalized recommendations`);
    
    res.json({
      success: true,
      recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        deviceId: request.deviceId,
        count: recommendations.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating personalized recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/personalization/status - Health check
router.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'delta-personalization-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;