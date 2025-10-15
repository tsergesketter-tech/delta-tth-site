import { mapSFMemberProfile } from './mapMemberProfile';
import type { MemberProfile } from '../types/member';

// Default fallback value
const DEFAULT_CREDIT_CARD_OFFER = 125000;

/**
 * Fetch credit card offer value using the dedicated endpoint
 * @param membershipNumber - The member's membership number (e.g., "00000002")
 * @returns Promise<number> - The credit card offer value or default
 */
export async function getCreditCardOfferValue(membershipNumber: string): Promise<number> {
  try {
    const response = await fetch(`/api/loyalty/credit-card-offer?membershipNumber=${encodeURIComponent(membershipNumber)}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch credit card offer for ${membershipNumber}: ${response.status}`);
      return DEFAULT_CREDIT_CARD_OFFER;
    }

    const data = await response.json();
    
    // Log if we're using fallback value
    if (data.fallback) {
      console.info(`Using fallback credit card offer for ${membershipNumber}`);
    }
    
    return data.creditCardOfferValue || DEFAULT_CREDIT_CARD_OFFER;
  } catch (error) {
    console.error('Error fetching credit card offer value:', error);
    return DEFAULT_CREDIT_CARD_OFFER;
  }
}

/**
 * Format credit card offer value for display
 * @param value - The numeric offer value
 * @returns Formatted string (e.g., "125,000")
 */
export function formatCreditCardOffer(value: number): string {
  return value.toLocaleString();
}

/**
 * Get member profile with credit card offer information
 * @param membershipNumber - The member's membership number
 * @returns Promise<MemberProfile | null> - Full member profile or null if error
 */
export async function getMemberProfileWithOffer(membershipNumber: string): Promise<MemberProfile | null> {
  try {
    const response = await fetch(`/api/loyalty/member-profile?membershipNumber=${encodeURIComponent(membershipNumber)}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch member profile for ${membershipNumber}: ${response.status}`);
      return null;
    }

    const memberRecord = await response.json();
    return mapSFMemberProfile(memberRecord);
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return null;
  }
}