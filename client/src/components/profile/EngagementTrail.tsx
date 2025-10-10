// src/components/profile/EngagementTrail.tsx
import React, { useEffect, useState } from 'react';

// Types based on Salesforce API documentation
type EngagementTrailStep = {
  id: string;
  name: string;
  description?: string;
  stepNumber: number;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  completedDate?: string;
  requiredCount?: number;
  currentCount?: number;
  rewardPoints?: number;
  rewardTier?: string;
};

type EngagementTrailProgress = {
  promotionId: string;
  promotionName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  totalSteps: number;
  completedSteps: number;
  currentStepNumber?: number;
  overallStatus: 'NotStarted' | 'InProgress' | 'Completed' | 'Expired';
  steps?: EngagementTrailStep[];
  enrollmentDate?: string;
  completionDate?: string;
  totalPossiblePoints?: number;
  earnedPoints?: number;
};

type EnrolledPromotion = {
  id: string;
  name: string;
  type: string;
  status: string;
  enrollmentDate: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  promotionConfiguration?: string;
  _raw?: any;
};

interface EngagementTrailProps {
  membershipNumber: string;
}

export default function EngagementTrail({ membershipNumber }: EngagementTrailProps) {
  const [enrolledPromotions, setEnrolledPromotions] = useState<EnrolledPromotion[]>([]);
  const [engagementTrails, setEngagementTrails] = useState<EngagementTrailProgress[]>([]);
  const [allTrails, setAllTrails] = useState<EngagementTrailProgress[]>([]); // Store unfiltered trails
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (!membershipNumber) return;

    const fetchEngagementTrails = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = window.location.origin;

        // Step 1: Get enrolled promotions for the member
        console.log('🎯 Fetching enrolled promotions for member:', membershipNumber);
        const promotionsRes = await fetch(
          `${apiBase}/api/loyalty/member/${encodeURIComponent(membershipNumber)}/enrolled-promotions`,
          { credentials: 'include' }
        );

        if (!promotionsRes.ok) {
          throw new Error(`Failed to fetch enrolled promotions: ${promotionsRes.status}`);
        }

        const promotionsData = await promotionsRes.json();
        console.log('📋 Enrolled promotions:', promotionsData);
        
        const promotions = promotionsData.promotions || promotionsData || [];
        setEnrolledPromotions(promotions);

        // Step 2: Filter for multi-step promotions based on description
        // Look for 'Delta Milestone Promotion' in the description field to identify multi-step promotions
        const engagementTrailPromotions = promotions.filter(
          (promo: any) => {
            // Check description field for Delta Milestone Promotion
            if (promo.description && promo.description.includes('Delta Milestone Promotion')) {
              return true;
            }
            
            // Fallback to existing logic for backward compatibility
            return promo.type === 'EngagementTrail' || 
                   promo.type === 'Engagement Trail' ||
                   promo.type === 'ENGAGEMENT_TRAIL' ||
                   promo.description === 'EngagementTrail' ||
                   promo.description?.toLowerCase().includes('engagement') ||
                   promo.name?.toLowerCase().includes('engagement trail');
          }
        );

        console.log('🛤️ Multi-step promotions found:', engagementTrailPromotions.length);
        
        // Log details about found promotions for debugging
        engagementTrailPromotions.forEach((promo: any) => {
          console.log(`📊 Multi-step promotion: ${promo.name}`, {
            type: promo.type,
            description: promo.description,
            hasDeltaMilestonePromotion: promo.description?.includes('Delta Milestone Promotion')
          });
        });

        if (engagementTrailPromotions.length === 0) {
          setEngagementTrails([]);
          return;
        }

        // Step 3: Fetch progress for each Engagement Trail promotion
        const trailProgressPromises = engagementTrailPromotions.map(async (promo: EnrolledPromotion) => {
          try {
            console.log(`📈 Fetching progress for engagement trail: ${promo.name} (${promo.id})`);
            
            const progressRes = await fetch(
              `${apiBase}/api/loyalty/member/${encodeURIComponent(membershipNumber)}/engagement-trail/${encodeURIComponent(promo.id)}`,
              { credentials: 'include' }
            );

            if (!progressRes.ok) {
              console.warn(`Failed to fetch trail progress for ${promo.id}:`, progressRes.status);
              return null;
            }

            const progressData = await progressRes.json();
            console.log(`✅ Trail progress for ${promo.name}:`, progressData);

            return {
              promotionId: promo.id,
              promotionName: promo.name,
              description: progressData.description,
              startDate: promo.startDate || progressData.startDate,
              endDate: promo.endDate || progressData.endDate,
              totalSteps: progressData.totalSteps || progressData.steps?.length || 0,
              completedSteps: progressData.completedSteps || 
                progressData.steps?.filter((s: any) => s.status === 'Completed').length || 0,
              currentStepNumber: progressData.currentStepNumber || 
                (progressData.steps?.find((s: any) => s.status === 'InProgress')?.stepNumber) || 1,
              overallStatus: progressData.overallStatus || promo.status || 'NotStarted',
              steps: progressData.steps || [],
              enrollmentDate: promo.enrollmentDate,
              completionDate: progressData.completionDate,
              totalPossiblePoints: progressData.totalPossiblePoints || 
                progressData.steps?.reduce((sum: number, s: any) => sum + (s.rewardPoints || 0), 0) || 0,
              earnedPoints: progressData.earnedPoints || 
                progressData.steps?.filter((s: any) => s.status === 'Completed')
                  .reduce((sum: number, s: any) => sum + (s.rewardPoints || 0), 0) || 0,
            } as EngagementTrailProgress;

          } catch (err) {
            console.error(`Error fetching progress for trail ${promo.id}:`, err);
            return null;
          }
        });

        const trailResults = await Promise.all(trailProgressPromises);
        const validTrails = trailResults.filter((trail): trail is EngagementTrailProgress => trail !== null);
        
        console.log('🎯 Final engagement trails with progress:', validTrails);
        setAllTrails(validTrails);
        setEngagementTrails(validTrails);

      } catch (err: any) {
        console.error('❌ Error fetching engagement trails:', err);
        setError(err.message || 'Failed to load engagement trails');
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementTrails();
  }, [membershipNumber]);

  // Filter trails based on active filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setEngagementTrails(allTrails);
      return;
    }

    const filtered = allTrails.filter((trail) => {
      const enrolledPromo = enrolledPromotions.find((p: any) => p.id === trail.promotionId);
      const isMilestone = enrolledPromo?.description?.includes('Delta Milestone Promotion');
      const category = categorizePromotion(trail);
      
      switch (activeFilter) {
        case 'milestone':
          return isMilestone;
        case 'trail':
          return !isMilestone;
        case 'active':
          return trail.overallStatus === 'InProgress';
        case 'completed':
          return trail.overallStatus === 'Completed';
        case 'not-started':
          return trail.overallStatus === 'NotStarted';
        case 'sports':
          return category === 'sports';
        case 'credit-card':
          return category === 'credit-card';
        case 'dining':
          return category === 'dining';
        case 'travel':
          return category === 'travel';
        case 'other':
          return category === 'other';
        default:
          return true;
      }
    });

    setEngagementTrails(filtered);
  }, [activeFilter, allTrails, enrolledPromotions]);

  const handleFilterChange = (filter: string) => {
    // Allow deselecting active filter to go back to 'all'
    if (activeFilter === filter && filter !== 'all') {
      setActiveFilter('all');
    } else {
      setActiveFilter(filter);
    }
  };

  // Helper function to categorize promotions
  const categorizePromotion = (trail: EngagementTrailProgress) => {
    const enrolledPromo = enrolledPromotions.find((p: any) => p.id === trail.promotionId);
    const name = trail.promotionName.toLowerCase();
    const description = (trail.description || '').toLowerCase();
    
    if (name.includes('credit card') || name.includes('amex') || description.includes('credit card') || description.includes('amex')) {
      return 'credit-card';
    }
    if (name.includes('49ers') || name.includes('seahawks') || name.includes('game') || name.includes('sport') || description.includes('game')) {
      return 'sports';
    }
    if (name.includes('starbucks') || name.includes('coffee') || name.includes('dining') || description.includes('starbucks')) {
      return 'dining';
    }
    if (name.includes('uber') || name.includes('ride') || name.includes('transportation') || description.includes('uber')) {
      return 'travel';
    }
    return 'other';
  };

  const getStepIcon = (status: EngagementTrailStep['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'InProgress':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-500 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        );
      case 'NotStarted':
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: EngagementTrailProgress['overallStatus']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'InProgress':
        return <span className={`${baseClasses} bg-indigo-100 text-indigo-800`}>In Progress</span>;
      case 'Expired':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Expired</span>;
      case 'NotStarted':
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Not Started</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Engagement Trails</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (engagementTrails.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="http://localhost:3000/images/delta_logo_sideways.png" 
            alt="Delta" 
            className="h-4 opacity-80"
          />
          <h3 className="text-lg font-medium text-gray-900">Multi-Step Promotions</h3>
        </div>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714m0 0A9.971 9.971 0 0118 32a9.971 9.971 0 013.288 2.286m0 0A9.971 9.971 0 0124 32a9.971 9.971 0 013.288 2.286" />
          </svg>
          <p className="text-gray-500">No multi-step promotions found</p>
          <p className="text-sm text-gray-400 mt-1">You're not currently enrolled in any milestone-based or engagement trail promotions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="http://localhost:3000/images/delta_logo_sideways.png" 
            alt="Delta" 
            className="h-4 opacity-80"
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Multi-Step Promotions</h3>
            <p className="text-sm text-gray-600 mt-1">Track your progress through milestone-based promotions and engagement trails</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: allTrails.length },
            { key: 'milestone', label: '🏆 Milestone', count: allTrails.filter(t => enrolledPromotions.find(p => p.id === t.promotionId)?.description?.includes('Delta Milestone Promotion')).length },
            { key: 'trail', label: '🛤️ Trail', count: allTrails.filter(t => !enrolledPromotions.find(p => p.id === t.promotionId)?.description?.includes('Delta Milestone Promotion')).length },
            { key: 'active', label: 'In Progress', count: allTrails.filter(t => t.overallStatus === 'InProgress').length },
            { key: 'completed', label: 'Completed', count: allTrails.filter(t => t.overallStatus === 'Completed').length },
            { key: 'sports', label: '⚽ Sports', count: allTrails.filter(t => categorizePromotion(t) === 'sports').length },
            { key: 'credit-card', label: '💳 Credit Card', count: allTrails.filter(t => categorizePromotion(t) === 'credit-card').length },
            { key: 'dining', label: '☕ Dining', count: allTrails.filter(t => categorizePromotion(t) === 'dining').length },
            { key: 'travel', label: '🚗 Travel', count: allTrails.filter(t => categorizePromotion(t) === 'travel').length }
          ].filter(filter => filter.count > 0 || filter.key === 'all').map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} {filter.count > 0 && `(${filter.count})`}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {engagementTrails.map((trail) => (
          <div key={trail.promotionId} className="rounded-lg p-4" style={{ backgroundColor: '#0F182A' }}>
            {/* Trail Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-medium text-white truncate">{decodeHtmlEntities(trail.promotionName)}</h4>
                  {/* Add badge to identify promotion type */}
                  {(() => {
                    // Check if this is a Delta Milestone Promotion from the enrolled promotion data
                    const enrolledPromo = enrolledPromotions.find((p: any) => p.id === trail.promotionId);
                    const isMilestone = enrolledPromo?.description?.includes('Delta Milestone Promotion');
                    
                    if (isMilestone) {
                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🏆 Milestone
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          🛤️ Trail
                        </span>
                      );
                    }
                  })()}
                </div>
                {trail.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">{decodeHtmlEntities(trail.description)}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {trail.startDate && <span>Started: {formatDate(trail.startDate)}</span>}
                  {trail.endDate && <span>Ends: {formatDate(trail.endDate)}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {getStatusBadge(trail.overallStatus)}
                <div className="text-xs text-gray-300 mt-1">
                  {trail.completedSteps}/{trail.totalSteps} steps
                </div>
              </div>
            </div>

            {/* Radial Progress - Delta Style Arc (300 degrees) */}
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg 
                  width="128" 
                  height="128" 
                  viewBox="0 0 128 112" 
                  className="transform rotate-0"
                  style={{ transform: 'translateX(-10px) translateY(-8px)' }}
                >
                  {/* Background arc - 300 degrees */}
                  <path 
                    d="M 28 72 A 48 48 0 1 1 108 72" 
                    fill="none" 
                    stroke="#374151" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                  />
                  {/* Progress arc */}
                  <path 
                    d="M 28 72 A 48 48 0 1 1 108 72" 
                    fill="none" 
                    stroke="#B91C1B" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    strokeDasharray="251.33"
                    strokeDashoffset={`${251.33 * (1 - (trail.completedSteps / trail.totalSteps))}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'translateX(-5px) translateY(-16px)' }}>
                  <div className="text-xl font-bold text-white text-center">
                    {trail.completedSteps}
                  </div>
                  <div className="text-xs text-gray-300 text-center">
                    of {trail.totalSteps}
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    steps
                  </div>
                </div>
              </div>
            </div>

            {/* Points Summary - Moved after progress bar, emphasizing completion reward */}
            {(trail.totalPossiblePoints || 0) > 0 && (
              <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <img 
                    src="http://localhost:3000/images/delta_logo_sideways.png" 
                    alt="Delta" 
                    className="h-3 opacity-70"
                  />
                  <span className="text-xs font-medium text-blue-800">Completion Reward</span>
                </div>
                <span className="text-sm text-blue-900">
                  <span className="font-bold" style={{ color: '#B91C1B' }}>{(trail.totalPossiblePoints || 0).toLocaleString()}</span>
                  <span className="ml-1" style={{ color: '#B91C1B' }}>Miles</span>
                </span>
              </div>
            )}

            {/* Steps Timeline - Compact View */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-white">Steps ({trail.completedSteps}/{trail.totalSteps})</h5>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {(trail.steps || []).map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3 p-2 bg-white rounded border border-gray-200">
                    {/* Step Icon - Smaller */}
                    <div className="flex-shrink-0">
                      {step.status === 'Completed' ? (
                        <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : step.status === 'InProgress' ? (
                        <div className="flex items-center justify-center w-5 h-5 bg-indigo-500 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-5 h-5 bg-gray-300 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Step Content - Compact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {step.stepNumber}. {decodeHtmlEntities(step.name)}
                        </p>
                        {step.rewardPoints && (
                          <span className="text-xs font-medium ml-2" style={{ color: '#B91C1B' }}>
                            {step.rewardPoints.toLocaleString()}pts
                          </span>
                        )}
                      </div>

                      {/* Progress indicator for current step - inline */}
                      {step.status === 'InProgress' && step.requiredCount && step.currentCount !== undefined && (
                        <div className="flex items-center mt-1 space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-indigo-600 h-1 rounded-full"
                              style={{ width: `${Math.min((step.currentCount / step.requiredCount) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {step.currentCount}/{step.requiredCount}
                          </span>
                        </div>
                      )}

                      {/* Completion date - compact */}
                      {step.status === 'Completed' && step.completedDate && (
                        <p className="text-xs text-gray-600 mt-1">
                          ✓ {formatDate(step.completedDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}