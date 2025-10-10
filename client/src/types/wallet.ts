// types/wallet.ts

export type EarnedOwedGiven = "EARNED" | "OWED" | "GIVEN";
export type WalletCategory = "CORE" | "CERTS_VOUCHERS" | "PARTNER_FINANCIAL";
export type CoreType = "MILES" | "MQD" | "ECREDIT" | "GIFT_CARD";
export type CertType = "UPGRADE" | "COMPANION";
export type VoucherType = "WIFI" | "LOUNGE" | "DRINK" | "SERVICE";
export type PartnerType = "STARBUCKS" | "OTHER";
export type Status = "ACTIVE" | "USED" | "EXPIRED" | "PENDING" | "LOCKED";

export interface WalletAction {
  id: "APPLY" | "VIEW_RULES" | "TRANSFER" | "BOOK" | "CONVERT";
  label: string;
}

export interface BaseWalletItem {
  id: string;
  category: WalletCategory;
  subType: string;
  label: string;
  valueDisplay: string; // "82,000 miles", "$423", "1 cert"
  numericValue?: number; // for sorting (USD cents or miles)
  status: Status;
  source: EarnedOwedGiven;
  issuedAt?: string; // ISO
  expiresAt?: string; // ISO
  termsUrl?: string;
  notes?: string;
  actions?: WalletAction[];
}

export type CoreItem = BaseWalletItem & {
  category: "CORE";
  subType: CoreType;
  currency?: "USD" | "MILES" | "MQD";
};

export type CertVoucherItem = BaseWalletItem & {
  category: "CERTS_VOUCHERS";
  subType: CertType | VoucherType;
  eligibility?: {
    cabins?: string[];
    routes?: string[];
    transferable?: boolean;
  };
};

export type PartnerFinancialItem = BaseWalletItem & {
  category: "PARTNER_FINANCIAL";
  subType: PartnerType | "CREDIT_CARD_SPEND";
  partnerName?: string;
  convertibleToMiles?: boolean;
};

export type WalletItem = CoreItem | CertVoucherItem | PartnerFinancialItem;

export interface WalletSummaryData {
  totalDeltaValue: number; // USD value
  expiringItemsCount: number;
  activeItemsCount: number;
  totalMiles: number;
  totalMQDs: number;
}

export interface WalletFilters {
  status: Status[];
  expirationDays?: number; // 30, 60, 90 days
  source: EarnedOwedGiven[];
  sortBy: "expiry" | "value" | "recent";
  search: string;
  // Category-specific filters
  coreTypes?: CoreType[];
  certVoucherTypes?: (CertType | VoucherType)[];
  partnerTypes?: PartnerType[];
}