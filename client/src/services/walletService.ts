// services/walletService.ts
import { WalletItem, WalletSummaryData } from '../types/wallet';
import { mockWalletItems, mockWalletSummary } from '../data/mockWalletData';

const USE_MOCK_DATA = process.env.REACT_APP_WALLET_MODE !== 'SALESFORCE';

class WalletService {
  async getWalletItems(memberId: string): Promise<WalletItem[]> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockWalletItems;
    }

    // TODO: Implement Salesforce integration
    const response = await fetch(`/api/wallet/items?memberId=${encodeURIComponent(memberId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet items: ${response.status}`);
    }
    return response.json();
  }

  async getWalletSummary(memberId: string): Promise<WalletSummaryData> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockWalletSummary;
    }

    // TODO: Implement Salesforce integration
    const response = await fetch(`/api/wallet/summary?memberId=${encodeURIComponent(memberId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet summary: ${response.status}`);
    }
    return response.json();
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