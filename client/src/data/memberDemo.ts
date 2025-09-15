// Demo fixtures for the Member page (safe to swap with SF data later)

export type Voucher = {
  id: string;
  type: string; // Now flexible - uses voucherDefinition from Salesforce (e.g., "Ajio", "10% Off Booking")
  code: string;
  value?: number; // remaining value, face value, or percentage
  currency?: string;
  expiresOn: string; // ISO
  status: "Active" | "Used" | "Expired";
  notes?: string;
  // Salesforce-specific fields
  originalType?: string; // Salesforce internal type (e.g., "FixedValue")
  voucherDefinition?: string; // Voucher definition name from Salesforce
  _raw?: {
    programId?: string;
    issuedDate?: string;
    lastModifiedDate?: string;
    effectiveDate?: string;
    expirationDateTime?: string;
    redeemedValue?: number;
    remainingValue?: number;
    faceValue?: number;
    isVoucherPartiallyRedeemable?: boolean;
    voucherNumber?: string;
  };
};

export type Badge = {
  id: string;
  name: string;
  icon: string; // emoji or path
  earnedOn: string;
  description?: string;
};

export type Trip = {
  id: string;
  flightId?: string;
  flightNumber?: string;
  fromCity?: string;
  toCity?: string;
  departureISO?: string;
  arrivalISO?: string;
  confirmation?: string;
  status: "Booked" | "Completed" | "Cancelled" | "Hold";
  estMiles?: number;
  aircraft?: string;
  seatClass?: string;
};

export type WalletItem = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  kind: "E-Cert" | "Travel Bank" | "Wallet";
};

export const DEMO_VOUCHERS: Voucher[] = [
  {
    id: "v1",
    type: "E-Cert",
    code: "EC-8X2K-91QF",
    value: 100,
    currency: "USD",
    expiresOn: "2025-12-31",
    status: "Active",
    notes: "Issued due to schedule change.",
  },
  {
    id: "v2",
    type: "Upgrade",
    code: "UPG-7431",
    expiresOn: "2025-10-15",
    status: "Active",
    notes: "Eligible for domestic routes only.",
  },
  {
    id: "v3",
    type: "E-Cert",
    code: "EC-1Z9P-33LM",
    value: 50,
    currency: "USD",
    expiresOn: "2025-05-01",
    status: "Expired",
  },
];

export const DEMO_BADGES: Badge[] = [
  {
    id: "b1",
    name: "Jet Setter",
    icon: "✈️",
    earnedOn: "2025-06-21",
    description: "5 flights in a quarter.",
  },
  {
    id: "b2",
    name: "Globe Trotter",
    icon: "🌍",
    earnedOn: "2025-04-09",
    description: "Flights to 3 different continents.",
  },
  {
    id: "b3",
    name: "Red Eye Flyer",
    icon: "🌙",
    earnedOn: "2025-03-12",
    description: "Completed an overnight flight.",
  },
];

export const DEMO_TRIPS: Trip[] = [
  {
    id: "t1",
    flightId: "DL-1234",
    flightNumber: "DL 1234",
    fromCity: "Atlanta (ATL)",
    toCity: "Seattle (SEA)",
    departureISO: "2025-09-05T08:30:00",
    arrivalISO: "2025-09-05T11:45:00",
    confirmation: "PNRXYZ123",
    status: "Booked",
    estMiles: 2000,
    aircraft: "Boeing 757-200",
    seatClass: "First Class",
  },
  {
    id: "t2",
    flightId: "DL-5678",
    flightNumber: "DL 5678",
    fromCity: "Chicago (ORD)",
    toCity: "New York (JFK)",
    departureISO: "2025-07-11T14:20:00",
    arrivalISO: "2025-07-11T17:35:00",
    confirmation: "PNRABC456",
    status: "Completed",
    estMiles: 1200,
    aircraft: "Airbus A321",
    seatClass: "Delta Comfort+",
  },
];

export const DEMO_WALLET: WalletItem[] = [
  { id: "w1", label: "Travel Bank", amount: 230, currency: "USD", kind: "Travel Bank" },
  { id: "w2", label: "E-Certs", amount: 150, currency: "USD", kind: "E-Cert" },
  { id: "w3", label: "Wallet Balance", amount: 0, currency: "USD", kind: "Wallet" },
];
