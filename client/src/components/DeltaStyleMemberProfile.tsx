// src/components/DeltaStyleMemberProfile.tsx
import React from 'react';
import type { MemberProfile } from '../types/member';

type Props = {
  profile: MemberProfile | null;
  loading?: boolean;
  error?: string | null;
};

// Tier thresholds for MQD progression
const TIER_THRESHOLDS = {
  'Silver Medallion': 5000,
  'Gold Medallion': 10000,
  'Platinum Medallion': 15000,
  'Diamond Medallion': 28000,
};

const getTierInfo = (currentTier: string, currentMqds: number) => {
  const tiers = Object.entries(TIER_THRESHOLDS);

  // Find current tier index
  const currentTierIndex = tiers.findIndex(([tier]) => tier === currentTier);

  // If at highest tier (Diamond), show progress towards maintaining it
  if (currentTier === 'Diamond Medallion') {
    return {
      nextTier: 'Diamond Medallion',
      nextThreshold: 28000,
      currentThreshold: 15000,
      progressPercent: Math.min(100, (currentMqds / 28000) * 100),
      remainingMqds: Math.max(0, 28000 - currentMqds)
    };
  }

  // Find next tier
  const nextTierEntry = tiers[currentTierIndex + 1];
  if (!nextTierEntry) {
    return {
      nextTier: 'Diamond Medallion',
      nextThreshold: 28000,
      currentThreshold: 0,
      progressPercent: Math.min(100, (currentMqds / 28000) * 100),
      remainingMqds: Math.max(0, 28000 - currentMqds)
    };
  }

  const [nextTier, nextThreshold] = nextTierEntry;
  const currentThreshold = currentTierIndex >= 0 ? tiers[currentTierIndex][1] : 0;

  return {
    nextTier,
    nextThreshold,
    currentThreshold,
    progressPercent: Math.min(100, (currentMqds / nextThreshold) * 100),
    remainingMqds: Math.max(0, nextThreshold - currentMqds)
  };
};

const fmtNumber = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString() : '—';

export default function DeltaStyleMemberProfile({ profile, loading, error }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600 font-semibold">
          {error || 'Unable to load profile'}
        </div>
      </div>
    );
  }

  const mqds = (profile as any)?.mqds || 0;
  const pendingMqds = (profile as any)?.pendingMqds || 0;
  const miles = (profile as any)?.miles || profile.availablePoints || 0;
  const lifetimePoints = profile.lifetimePoints || 0;

  const tierInfo = getTierInfo(profile.tier.name, mqds);

  // Calculate the stroke-dasharray for the 300-degree arc (5/6 of a circle)
  const radius = 96;
  const circumference = (300 / 360) * 2 * Math.PI * radius; // 300 degrees of a circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (tierInfo.progressPercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Progress Card */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">
            2026 MEDALLION STATUS PROGRESS
          </div>
          <h2 className="text-2xl font-bold text-blue-900">{profile.tier.name}</h2>
        </div>

        {/* 300-degree Arc Progress Indicator */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-64 h-56 px-4 py-8">
            <svg
              width="256"
              height="256"
              viewBox="0 0 256 224"
              className="transform rotate-0"
              style={{ transform: 'translateX(-20px) translateY(-16px)' }}
            >
              {/* Background arc - 300 degrees */}
              <path
                d="M 56 144 A 96 96 0 1 1 216 144"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Progress arc - 300 degrees */}
              <path
                d="M 56 144 A 96 96 0 1 1 216 144"
                fill="none"
                stroke="#1e40af"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              {/* Pending progress arc */}
              {pendingMqds > 0 && (
                <path
                  d="M 56 144 A 96 96 0 1 1 216 144"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (Math.min(100, ((mqds + pendingMqds) / tierInfo.nextThreshold) * 100) / 100) * circumference}
                  className="transition-all duration-1000 ease-out"
                />
              )}
            </svg>

            {/* Center content - precisely centered */}
            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -30%)' }}>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900">${fmtNumber(mqds)}</div>
                <div className="text-sm text-gray-600">MQDs</div>
              </div>
            </div>

            {/* Scale labels - positioned below arc without interference */}
            <div className="absolute" style={{ bottom: '24px', left: '56px', right: '56px' }}>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">$0</span>
                <span className="text-sm text-gray-600">${(tierInfo.nextThreshold / 1000)}k</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending and Progress Info */}
        <div className="space-y-2 mb-6">
          {pendingMqds > 0 && (
            <div className="flex items-center text-sm">
              <span className="text-blue-600 font-medium italic">
                ${fmtNumber(pendingMqds)} MQDs Pending
              </span>
              <div className="ml-2 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs text-blue-600">?</span>
              </div>
            </div>
          )}
          <div className="text-sm text-blue-900 font-medium">
            ${fmtNumber(tierInfo.remainingMqds)} MQDs to {tierInfo.nextTier.replace(' Medallion', '')} Medallion
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-900"></div>
            <span className="text-sm text-gray-600">Earned</span>
          </div>
          {pendingMqds > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Earn Status for the following year from Jan. 1 to Dec. 31.
        </div>

        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          How Do I Reach Status?
        </button>
      </div>

      {/* Right Column - Miles Cards */}
      <div className="space-y-6">
        {/* Miles Available Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">
            MILES AVAILABLE
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-4">
            {fmtNumber(miles)}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Use these miles for Award Travel and other redemptions.
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Book with Miles
          </button>
        </div>

        {/* Million Miler Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">
            MILLION MILER STATUS
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-4">
            {fmtNumber(lifetimePoints)}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Lifetime Miles Flown
          </div>
          <div className="flex justify-between items-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Learn More
            </button>
            <div className="w-8 h-8 border-2 border-dashed border-blue-300 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}