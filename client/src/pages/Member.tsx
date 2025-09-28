// src/pages/Member.tsx
import React, { useState, useEffect } from "react";
import MemberProfile from "../components/MemberProfile";
import DeltaStyleMemberProfile from "../components/DeltaStyleMemberProfile";
import { DEMO_MEMBER } from "../constants/loyalty";
import TransactionHistory from "../components/profile/TransactionHistory";
import { mapSFMemberProfile } from "../utils/mapMemberProfile";
import type { MemberProfile as UIProfile } from "../types/member";

// Tab content components
import WalletSummary from "../components/profile/WalletSummary";
import VouchersList from "../components/profile/VouchersList";
import BadgesGrid from "../components/profile/BadgesGrid";
import UpcomingStays from "../components/profile/UpcomingStays";
import PartnerShortcuts from "../components/profile/PartnerShortcuts";
import EngagementTrail from "../components/profile/EngagementTrail";

type TabId = 'overview' | 'activity' | 'promotion-progress' | 'partner-linkage' | 'recommendations';

interface Tab {
  id: TabId;
  label: string;
  icon?: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'promotion-progress', label: 'Promotion Progress' },
  { id: 'partner-linkage', label: 'Partner Linkage' },
  { id: 'recommendations', label: 'Recommendations' }
];

export default function MemberPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [profileData, setProfileData] = useState<UIProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch member profile data
  useEffect(() => {
    let alive = true;

    (async () => {
      setProfileLoading(true);
      setProfileError(null);

      try {
        const res = await fetch(
          `/api/loyalty/members?program=${encodeURIComponent(DEMO_MEMBER.PROGRAM_NAME)}&membershipNumber=${encodeURIComponent(DEMO_MEMBER.MEMBERSHIP_NUMBER)}`
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Member API failed:', errorText);
          setProfileError(`Failed to load member profile: ${res.status}`);
          return;
        }

        const json = await res.json();
        const memberRecord: any = Array.isArray(json) ? json[0] : json;

        if (!memberRecord || typeof memberRecord !== 'object') {
          throw new Error('Member not found');
        }

        const mapped = mapSFMemberProfile(memberRecord);
        if (alive) setProfileData(mapped);

      } catch (e: any) {
        console.error('Member API error:', e.message);
        if (alive) {
          setProfileError('Failed to connect to member service');
        }
      } finally {
        if (alive) setProfileLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Delta Style Member Profile */}
            <section aria-labelledby="member-profile">
              <h2 id="member-profile" className="sr-only">Member Profile</h2>
              <DeltaStyleMemberProfile
                profile={profileData}
                loading={profileLoading}
                error={profileError}
              />
            </section>

            {/* Row 1: Upcoming + Wallet */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="plans-and-wallet">
              <h2 id="plans-and-wallet" className="sr-only">Bookings and Wallet</h2>
              <div className="md:col-span-2">
                <UpcomingStays />
              </div>
              <div>
                <WalletSummary />
              </div>
            </section>

            {/* Row 2: Vouchers + Badges */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="value-and-badges">
              <h2 id="value-and-badges" className="sr-only">Vouchers and Badges</h2>
              <div className="md:col-span-2">
                <VouchersList />
              </div>
              <div>
                <BadgesGrid />
              </div>
            </section>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Account Activity</h2>
            <TransactionHistory />
          </div>
        );

      case 'promotion-progress':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Promotion Progress</h2>
            <EngagementTrail membershipNumber={DEMO_MEMBER.MEMBERSHIP_NUMBER} />
          </div>
        );

      case 'partner-linkage':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Partner Linkage</h2>
            <PartnerShortcuts />
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600">Personalized recommendations coming soon...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Good Evening, Theodore</h1>
              <div className="flex items-center mt-2 space-x-8">
                <div>
                  <span className="text-sm text-gray-300">SKYMILES #</span>
                  <div className="text-lg font-semibold">{DEMO_MEMBER.MEMBERSHIP_NUMBER}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-300">MILES AVAILABLE</span>
                  <div className="text-lg font-semibold">121,338</div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 ml-8">
              <img
                src="/images/delta_logo_sideways.png"
                alt="Delta Logo"
                className="h-20 w-auto opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-8">
          {/* Left Navigation Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}