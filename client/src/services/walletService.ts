// services/walletService.ts
import { WalletItem, WalletSummaryData, type CoreItem, type CertVoucherItem, type PartnerFinancialItem, type CoreType, type CertType, type VoucherType, type PartnerType, type EarnedOwedGiven, type WalletAction } from '../types/wallet';
import { mockWalletItems, mockWalletSummary } from '../data/mockWalletData';
import { fetchMemberVouchers, VOUCHER_DEFINITION_FILTERS, type VoucherDefinitionFilter, type SalesforceVoucher } from '../utils/vouchersApi';

const USE_MOCK_DATA = process.env.REACT_APP_WALLET_MODE !== 'SALESFORCE';

console.log('[WalletService] Module loaded');
console.log('[WalletService] REACT_APP_WALLET_MODE:', process.env.REACT_APP_WALLET_MODE);
console.log('[WalletService] USE_MOCK_DATA:', USE_MOCK_DATA);

class WalletService {
  async getWalletItems(membershipNumber: string): Promise<WalletItem[]> {
    console.log(`[WalletService] getWalletItems called with membershipNumber: ${membershipNumber}`);
    console.log(`[WalletService] USE_MOCK_DATA: ${USE_MOCK_DATA}`);
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      console.log('[WalletService] Using mock data');
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockWalletItems;
    }

    try {
      console.log('[WalletService] Fetching vouchers from Salesforce API...');
      // Fetch vouchers from the new Salesforce API and combine with mock data
      const [vouchersResponse] = await Promise.all([
        fetchMemberVouchers(membershipNumber)
      ]);

      console.log(`[WalletService] Received vouchers response:`, vouchersResponse);

      // Transform Salesforce vouchers to WalletItem format
      const voucherItems: WalletItem[] = vouchersResponse.vouchers.map(voucher => 
        this.transformVoucherToWalletItem(voucher)
      );

      console.log(`[WalletService] Transformed ${voucherItems.length} vouchers:`, voucherItems);

      // Combine with mock wallet items (for miles, MQDs, etc. that aren't vouchers)
      const mockCoreItems = mockWalletItems.filter(item => 
        item.category === 'CORE' || 
        (item.category === 'PARTNER_FINANCIAL' && item.subType === 'CREDIT_CARD_SPEND')
      );

      // Combine voucher items with core wallet items
      const allItems = [...mockCoreItems, ...voucherItems];

      console.log(`[WalletService] Retrieved ${voucherItems.length} vouchers from Salesforce and ${mockCoreItems.length} core items from mock data`);
      console.log(`[WalletService] Total items to return:`, allItems);
      
      return allItems;
    } catch (error) {
      console.error('[WalletService] Failed to fetch vouchers from Salesforce:', error);
      // Fallback to mock data on error
      console.log('[WalletService] Falling back to mock data due to error');
      return mockWalletItems;
    }
  }

  async getFilteredWalletItems(
    membershipNumber: string, 
    voucherDefinitions?: VoucherDefinitionFilter[]
  ): Promise<WalletItem[]> {
    if (USE_MOCK_DATA) {
      // Simulate API delay and filter mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      if (voucherDefinitions && voucherDefinitions.length > 0) {
        return mockWalletItems.filter(item => 
          voucherDefinitions.some(def => 
            item.subType?.toLowerCase().includes(def.toLowerCase()) ||
            item.label?.toLowerCase().includes(def.toLowerCase())
          )
        );
      }
      return mockWalletItems;
    }

    try {
      // Fetch filtered vouchers from the new Salesforce API
      const vouchersResponse = await fetchMemberVouchers(membershipNumber, voucherDefinitions);
      
      // Transform Salesforce vouchers to WalletItem format
      const voucherItems: WalletItem[] = vouchersResponse.vouchers.map(voucher => 
        this.transformVoucherToWalletItem(voucher)
      );

      // If filtering vouchers, only return voucher items
      if (voucherDefinitions && voucherDefinitions.length > 0) {
        console.log(`[WalletService] Filtered ${voucherItems.length} vouchers by definitions: ${voucherDefinitions.join(', ')}`);
        return voucherItems;
      }

      // If no filters, combine with core items like the main getWalletItems method
      const mockCoreItems = mockWalletItems.filter(item => 
        item.category === 'CORE' || 
        (item.category === 'PARTNER_FINANCIAL' && item.subType === 'CREDIT_CARD_SPEND')
      );

      const allItems = [...mockCoreItems, ...voucherItems];
      console.log(`[WalletService] Retrieved ${voucherItems.length} vouchers + ${mockCoreItems.length} core items`);
      
      return allItems;
    } catch (error) {
      console.error('Failed to fetch filtered vouchers from Salesforce:', error);
      // Fallback to mock data with filtering
      if (voucherDefinitions && voucherDefinitions.length > 0) {
        return mockWalletItems.filter(item => 
          voucherDefinitions.some(def => 
            item.subType?.toLowerCase().includes(def.toLowerCase()) ||
            item.label?.toLowerCase().includes(def.toLowerCase())
          )
        );
      }
      return mockWalletItems;
    }
  }

  private transformVoucherToWalletItem(voucher: SalesforceVoucher): WalletItem {
    // Map voucher definition to wallet category and subtype
    const category = this.mapVoucherDefinitionToCategory(voucher.voucherDefinition);
    const subType = this.mapVoucherDefinitionToSubType(voucher.voucherDefinition);
    const value = voucher.remainingValue || voucher.faceValue || 0;
    
    // Handle both currencyIsoCode (from SF API) and currency (legacy)
    const currency = voucher.currencyIsoCode || voucher.currency || 'USD';
    
    const baseItem = {
      id: voucher.voucherId,
      category,
      subType,
      label: voucher.voucherDefinition,
      valueDisplay: this.formatVoucherValue(value, currency),
      numericValue: value,
      status: this.mapVoucherStatusToWalletStatus(voucher.status),
      source: 'EARNED' as EarnedOwedGiven,
      issuedAt: voucher.effectiveDate,
      expiresAt: voucher.expirationDate,
      notes: `${voucher.voucherDefinition} - Code: ${voucher.voucherCode}`,
      actions: this.getActionsForVoucher(voucher)
    };

    // Return the appropriate type based on category
    if (category === 'CREDITS') {
      return {
        ...baseItem,
        category: 'CORE',
        subType: subType as CoreType,
        currency: currency === 'USD' ? 'USD' : 'USD'
      } as CoreItem;
    } else if (category === 'CERTIFICATES' || category === 'VOUCHERS') {
      return {
        ...baseItem,
        category: 'CERTS_VOUCHERS',
        subType: subType as CertType | VoucherType,
        voucherCategory: category // Add custom field to distinguish certificates from vouchers
      } as CertVoucherItem & { voucherCategory: string };
    } else {
      return {
        ...baseItem,
        category: 'PARTNER_FINANCIAL',
        subType: subType as PartnerType | 'CREDIT_CARD_SPEND'
      } as PartnerFinancialItem;
    }
  }

  private formatVoucherValue(value: number, currency: string): string {
    if (currency === 'USD') {
      return `$${value.toFixed(2)}`;
    }
    return `${value.toLocaleString()} ${currency}`;
  }

  private mapVoucherDefinitionToCategory(voucherDefinition: string): 'CERTIFICATES' | 'VOUCHERS' | 'CREDITS' | 'PARTNER_FINANCIAL' {
    const def = voucherDefinition.toLowerCase();
    
    // Certificates section - anything with "certificate" in the name
    if (def.includes('certificate')) {
      return 'CERTIFICATES';
    }
    
    // Credits section - E-Credits and gift cards
    if (def.includes('e-credit') || def.includes('ecredit') || def.includes('gift card')) {
      return 'CREDITS';
    }
    
    // Vouchers section - drink vouchers, SkyClub passes, day passes
    if (def.includes('drink') || def.includes('skyclub') || def.includes('sky club') || def.includes('day pass')) {
      return 'VOUCHERS';
    }
    
    // Default to vouchers for other items
    return 'VOUCHERS';
  }

  private mapVoucherDefinitionToSubType(voucherDefinition: string): string {
    const def = voucherDefinition.toLowerCase();
    
    if (def.includes('upgrade')) return 'UPGRADE';
    if (def.includes('companion')) return 'COMPANION';
    if (def.includes('skyclub') || def.includes('sky club') || def.includes('lounge')) return 'LOUNGE';
    if (def.includes('drink')) return 'DRINK';
    if (def.includes('wifi')) return 'WIFI';
    if (def.includes('service')) return 'SERVICE';
    if (def.includes('e-credit') || def.includes('ecredit')) return 'ECREDIT';
    if (def.includes('gift card')) return 'GIFT_CARD';
    if (def.includes('miles')) return 'MILES';
    if (def.includes('mqd')) return 'MQD';
    if (def.includes('starbucks')) return 'STARBUCKS';
    
    return 'OTHER';
  }

  private mapVoucherStatusToWalletStatus(voucherStatus: string): 'ACTIVE' | 'USED' | 'EXPIRED' {
    const status = voucherStatus.toLowerCase();
    
    if (status === 'active' || status === 'available' || status === 'issued') {
      return 'ACTIVE';
    }
    
    if (status === 'used' || status === 'redeemed' || status === 'consumed') {
      return 'USED';
    }
    
    return 'EXPIRED';
  }

  private getActionsForVoucher(voucher: SalesforceVoucher): WalletAction[] {
    const actions: WalletAction[] = [];
    
    if (voucher.status.toLowerCase() === 'active' || voucher.status.toLowerCase() === 'available' || voucher.status.toLowerCase() === 'issued') {
      actions.push({
        id: 'APPLY',
        label: 'Apply to Trip'
      });
      
      if (voucher.voucherDefinition.toLowerCase().includes('upgrade') || 
          voucher.voucherDefinition.toLowerCase().includes('certificate')) {
        actions.push({
          id: 'BOOK',
          label: 'Use for Booking'
        });
      }
    }
    
    actions.push({
      id: 'VIEW_RULES',
      label: 'View Terms'
    });
    
    return actions;
  }

  // New method to get vouchers by specific filter categories
  async getVouchersByCategory(
    membershipNumber: string,
    category: 'certificates' | 'day-passes' | 'vouchers' | 'skyclub' | 'e-credits'
  ): Promise<WalletItem[]> {
    const filterMap: Record<typeof category, VoucherDefinitionFilter[]> = {
      'certificates': [VOUCHER_DEFINITION_FILTERS.CERTIFICATE],
      'day-passes': [VOUCHER_DEFINITION_FILTERS.DAY_PASS],
      'vouchers': [VOUCHER_DEFINITION_FILTERS.VOUCHER],
      'skyclub': [VOUCHER_DEFINITION_FILTERS.SKYCLUB],
      'e-credits': [VOUCHER_DEFINITION_FILTERS.E_CREDIT]
    };

    const filters = filterMap[category];
    return this.getFilteredWalletItems(membershipNumber, filters);
  }

  async getWalletSummary(memberId: string): Promise<WalletSummaryData> {
    console.log(`[WalletService] getWalletSummary called with memberId: ${memberId}`);
    console.log(`[WalletService] USE_MOCK_DATA: ${USE_MOCK_DATA}`);
    
    // Get all wallet items to calculate dynamic summary
    const allItems = await this.getWalletItems(memberId);
    
    // Calculate total value from E-Credits and Gift Cards in USD cents
    const totalDeltaValue = allItems
      .filter(item => 
        (item.subType === 'ECREDIT' || item.subType === 'GIFT_CARD') && 
        item.category === 'CORE' &&
        (item as CoreItem).currency === 'USD' && 
        item.status === 'ACTIVE'
      )
      .reduce((total, item) => total + (item.numericValue || 0), 0);
    
    // Count active items and expiring items
    const activeItemsCount = allItems.filter(item => item.status === 'ACTIVE').length;
    const expiringItemsCount = allItems.filter(item => {
      if (!item.expiresAt || item.status !== 'ACTIVE') return false;
      const expiryDate = new Date(item.expiresAt);
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      return expiryDate <= sixtyDaysFromNow;
    }).length;
    
    // Calculate total miles and MQDs
    const totalMiles = allItems
      .filter(item => item.category === 'CORE' && (item as CoreItem).currency === 'MILES')
      .reduce((total, item) => total + (item.numericValue || 0), 0);
    
    const totalMQDs = allItems
      .filter(item => item.category === 'CORE' && (item as CoreItem).currency === 'MQD')
      .reduce((total, item) => total + (item.numericValue || 0), 0);
    
    console.log(`[WalletService] Calculated dynamic summary: totalDeltaValue=${totalDeltaValue}, activeItems=${activeItemsCount}, expiringItems=${expiringItemsCount}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      totalDeltaValue,
      expiringItemsCount,
      activeItemsCount,
      totalMiles,
      totalMQDs
    };
  }

  async applyItemToPNR(itemId: string, pnrId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Mock: Applied item ${itemId} to PNR ${pnrId}`);
      return;
    }

    // TODO: Implement Salesforce integration
    const response = await fetch('/api/wallet/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, pnrId })
    });

    if (!response.ok) {
      throw new Error(`Failed to apply item: ${response.status}`);
    }
  }

  async convertPartnerCurrency(itemId: string, target: 'MILES'): Promise<void> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      console.log(`Mock: Converted item ${itemId} to ${target}`);
      return;
    }

    // TODO: Implement Salesforce integration
    const response = await fetch('/api/wallet/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, target })
    });

    if (!response.ok) {
      throw new Error(`Failed to convert currency: ${response.status}`);
    }
  }

  async getCreditCardSpendSummary(memberId: string, rangeDays: number): Promise<any> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        totalSpend: 4280,
        milesEarned: 12840,
        transactions: 23,
        period: `Last ${rangeDays} days`
      };
    }

    // TODO: Implement Salesforce integration
    const response = await fetch(`/api/wallet/cc-spend?memberId=${encodeURIComponent(memberId)}&days=${rangeDays}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch credit card spend: ${response.status}`);
    }
    return response.json();
  }
}

export const walletService = new WalletService();