// data/mockWalletData.ts
import { WalletItem, WalletSummaryData } from '../types/wallet';

export const mockWalletItems: WalletItem[] = [
  // Core Delta Currencies
  {
    id: 'miles-1',
    category: 'CORE',
    subType: 'MILES',
    label: 'SkyMiles Balance',
    valueDisplay: '121,338 miles',
    numericValue: 121338,
    status: 'ACTIVE',
    source: 'EARNED',
    currency: 'MILES',
    actions: [
      { id: 'BOOK', label: 'Book Award' },
      { id: 'TRANSFER', label: 'Transfer Miles' }
    ]
  },
  {
    id: 'mqd-1',
    category: 'CORE',
    subType: 'MQD',
    label: 'MQD Progress',
    valueDisplay: '$3,250 MQDs',
    numericValue: 3250,
    status: 'ACTIVE',
    source: 'EARNED',
    currency: 'MQD',
    notes: 'Toward Platinum Medallion status'
  },
  {
    id: 'ecredit-1',
    category: 'CORE',
    subType: 'ECREDIT',
    label: 'Trip Credit - DL1234',
    valueDisplay: '$423.50',
    numericValue: 42350,
    status: 'ACTIVE',
    source: 'OWED',
    currency: 'USD',
    issuedAt: '2024-08-15T10:30:00Z',
    expiresAt: '2025-08-15T23:59:59Z',
    actions: [
      { id: 'APPLY', label: 'Apply to Booking' },
      { id: 'VIEW_RULES', label: 'View Terms' }
    ]
  },
  {
    id: 'gift-1',
    category: 'CORE',
    subType: 'GIFT_CARD',
    label: 'Delta Gift Card',
    valueDisplay: '$100.00',
    numericValue: 10000,
    status: 'ACTIVE',
    source: 'GIVEN',
    currency: 'USD',
    issuedAt: '2024-12-01T00:00:00Z',
    expiresAt: '2026-12-01T23:59:59Z',
    actions: [
      { id: 'APPLY', label: 'Apply to Booking' }
    ]
  },

  // Certificates & Vouchers
  {
    id: 'upgrade-1',
    category: 'CERTS_VOUCHERS',
    subType: 'UPGRADE',
    label: 'Domestic First Class Upgrade',
    valueDisplay: '1 certificate',
    numericValue: 1,
    status: 'ACTIVE',
    source: 'EARNED',
    issuedAt: '2024-10-01T00:00:00Z',
    expiresAt: '2025-01-31T23:59:59Z',
    eligibility: {
      cabins: ['First Class'],
      routes: ['Domestic US'],
      transferable: false
    },
    actions: [
      { id: 'APPLY', label: 'Apply to Trip' },
      { id: 'VIEW_RULES', label: 'View Eligibility' }
    ]
  },
  {
    id: 'companion-1',
    category: 'CERTS_VOUCHERS',
    subType: 'COMPANION',
    label: 'Companion Certificate',
    valueDisplay: '1 certificate',
    numericValue: 1,
    status: 'ACTIVE',
    source: 'EARNED',
    issuedAt: '2024-09-15T00:00:00Z',
    expiresAt: '2025-09-15T23:59:59Z',
    eligibility: {
      cabins: ['Main Cabin', 'Comfort+'],
      routes: ['Domestic US', 'Canada'],
      transferable: false
    },
    actions: [
      { id: 'BOOK', label: 'Book Companion Trip' },
      { id: 'VIEW_RULES', label: 'View Terms' }
    ]
  },
  {
    id: 'wifi-1',
    category: 'CERTS_VOUCHERS',
    subType: 'WIFI',
    label: 'Wi-Fi Voucher',
    valueDisplay: '3 passes',
    numericValue: 3,
    status: 'ACTIVE',
    source: 'GIVEN',
    issuedAt: '2024-11-01T00:00:00Z',
    expiresAt: '2025-02-28T23:59:59Z',
    actions: [
      { id: 'APPLY', label: 'Use on Flight' },
      { id: 'VIEW_RULES', label: 'View Terms' }
    ]
  },
  {
    id: 'lounge-1',
    category: 'CERTS_VOUCHERS',
    subType: 'LOUNGE',
    label: 'Sky Club Day Pass',
    valueDisplay: '2 passes',
    numericValue: 2,
    status: 'ACTIVE',
    source: 'EARNED',
    issuedAt: '2024-10-15T00:00:00Z',
    expiresAt: '2025-01-15T23:59:59Z',
    actions: [
      { id: 'APPLY', label: 'Use at Club' },
      { id: 'VIEW_RULES', label: 'View Locations' }
    ]
  },

  // Partner & Financial
  {
    id: 'starbucks-1',
    category: 'PARTNER_FINANCIAL',
    subType: 'STARBUCKS',
    label: 'Starbucks Stars',
    valueDisplay: '2,450 Stars',
    numericValue: 2450,
    status: 'ACTIVE',
    source: 'EARNED',
    partnerName: 'Starbucks',
    convertibleToMiles: true,
    actions: [
      { id: 'CONVERT', label: 'Convert to Miles' },
      { id: 'VIEW_RULES', label: 'View Exchange Rate' }
    ]
  },
  {
    id: 'cc-spend-1',
    category: 'PARTNER_FINANCIAL',
    subType: 'CREDIT_CARD_SPEND',
    label: 'Delta Amex Reserve Spend',
    valueDisplay: '$4,280 (Last 90 days)',
    numericValue: 428000,
    status: 'ACTIVE',
    source: 'EARNED',
    partnerName: 'American Express',
    notes: 'Earning 3X miles on Delta purchases',
    actions: [
      { id: 'VIEW_RULES', label: 'View Earning Details' }
    ]
  }
];

export const mockWalletSummary: WalletSummaryData = {
  totalDeltaValue: 52350, // $523.50 in USD value
  expiringItemsCount: 3, // Items expiring in next 60 days
  activeItemsCount: 10,
  totalMiles: 121338,
  totalMQDs: 3250,
};