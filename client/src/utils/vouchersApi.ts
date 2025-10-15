// client/src/utils/vouchersApi.ts

// New Salesforce voucher structure based on the API response
export interface SalesforceVoucher {
  effectiveDate: string;
  effectiveDateTime?: string;
  expirationDate: string;
  expirationDateTime?: string;
  faceValue: number;
  isVoucherDefinitionActive: boolean;
  isVoucherPartiallyRedeemable: boolean;
  hasTimeBasedVoucherPeriod: boolean;
  redeemedValue?: number;
  remainingValue?: number;
  status: string;
  type: string;
  voucherCode: string;
  voucherDefinition: string;
  voucherId: string;
  voucherNumber: string;
  currencyIsoCode: string;
  description?: string;
  partnerAccountName?: string;
  productId?: string;
  productName?: string;
  voucherImageUrl?: string;
  // Legacy compatibility fields
  id: string;
  value: number;
  currency: string;
  expiresOn: string;
  code: string;
  notes: string;
  _raw: any;
}

type VouchersResponse = {
  voucherCount: number;
  vouchers: SalesforceVoucher[];
  totalCount: number;
  _meta: {
    membershipNumber: string;
    program: string;
    fetchedAt: string;
    sourceApi: string;
    appliedFilters?: { voucherDefinition?: string | string[] } | null;
  };
};

// Voucher definition filter options
export const VOUCHER_DEFINITION_FILTERS = {
  CERTIFICATE: 'Certificate',
  DAY_PASS: 'Day Pass',
  VOUCHER: 'Voucher',
  SKYCLUB: 'SkyClub',
  E_CREDIT: 'E-Credit'
} as const;

export type VoucherDefinitionFilter = typeof VOUCHER_DEFINITION_FILTERS[keyof typeof VOUCHER_DEFINITION_FILTERS];

/**
 * Fetch vouchers for a member from Salesforce
 * @param membershipNumber Member's membership number
 * @param voucherDefinitionFilter Optional filter for voucher definitions
 */
export async function fetchMemberVouchers(
  membershipNumber: string = "00000002", 
  voucherDefinitionFilter?: VoucherDefinitionFilter | VoucherDefinitionFilter[]
): Promise<VouchersResponse> {
  console.log(`[vouchersApi] fetchMemberVouchers called with membershipNumber: ${membershipNumber}, filters:`, voucherDefinitionFilter);
  
  const url = new URL(`/api/loyalty/member/${encodeURIComponent(membershipNumber)}/vouchers`, window.location.origin);
  
  // Add voucher definition filter if provided
  if (voucherDefinitionFilter) {
    const filters = Array.isArray(voucherDefinitionFilter) ? voucherDefinitionFilter : [voucherDefinitionFilter];
    filters.forEach(filter => url.searchParams.append('voucherDefinition', filter));
  }

  console.log(`[vouchersApi] Fetching from URL: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  console.log(`[vouchersApi] Response status: ${response.status}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      errorData.message ||
      `Failed to fetch vouchers: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log(`[vouchersApi] Response data:`, data);
  return data;
}

/**
 * Fetch vouchers filtered by specific definitions
 * @param membershipNumber Member's membership number
 * @param definitions Array of voucher definitions to filter by
 */
export async function fetchFilteredVouchers(
  membershipNumber: string = "00000002",
  definitions: VoucherDefinitionFilter[]
): Promise<VouchersResponse> {
  return fetchMemberVouchers(membershipNumber, definitions);
}

/**
 * Fetch active vouchers only
 * @param membershipNumber Member's membership number
 * @param voucherDefinitionFilter Optional filter for voucher definitions
 */
export async function fetchActiveVouchers(
  membershipNumber: string = "00000002",
  voucherDefinitionFilter?: VoucherDefinitionFilter | VoucherDefinitionFilter[]
): Promise<SalesforceVoucher[]> {
  const response = await fetchMemberVouchers(membershipNumber, voucherDefinitionFilter);
  return response.vouchers.filter(voucher => 
    voucher.status.toLowerCase() === 'active' || 
    voucher.status.toLowerCase() === 'available' ||
    voucher.status.toLowerCase() === 'issued'
  );
}

/**
 * Redeem a voucher by ID (placeholder for future implementation)
 */
export async function redeemVoucher(voucherId: string, redemptionDetails?: any): Promise<any> {
  const response = await fetch(`/api/loyalty/vouchers/${voucherId}/redeem`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(redemptionDetails || {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || 
      errorData.message || 
      `Failed to redeem voucher: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}