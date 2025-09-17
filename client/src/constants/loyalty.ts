// src/constants/loyalty.ts

/**
 * Centralized loyalty program constants
 * Update these values in one place to change across the entire application
 */

export const LOYALTY_PROGRAM = {
  NAME: "Delta SkyMiles",
  MEMBERSHIP_NUMBER: "00000002"
} as const;

export const DEMO_MEMBER = {
  MEMBERSHIP_NUMBER: LOYALTY_PROGRAM.MEMBERSHIP_NUMBER,
  PROGRAM_NAME: LOYALTY_PROGRAM.NAME
} as const;