/**
 * Point value in USD cents (1 cent = $0.01)
 * Change this value to adjust how much each point is worth
 *
 * Examples:
 * - 1 = 1 cent per point ($0.01)
 * - 2 = 2 cents per point ($0.02)
 * - 0.5 = 0.5 cents per point ($0.005)
 */
export declare const POINT_VALUE_CENTS = 1;
/**
 * Point value in USD dollars (derived from POINT_VALUE_CENTS)
 * This is calculated automatically - don't change this directly
 */
export declare const POINT_VALUE_USD: number;
/**
 * Minimum points required for redemption
 */
export declare const MIN_REDEMPTION_POINTS = 100;
/**
 * Maximum points that can be redeemed in a single transaction
 * Set to null for no limit
 */
export declare const MAX_REDEMPTION_POINTS = 100000;
/**
 * Convert points to USD dollar amount
 */
export declare function pointsToUSD(points: number): number;
/**
 * Convert USD dollar amount to points
 */
export declare function usdToPoints(usd: number): number;
/**
 * Format points as currency string
 */
export declare function formatPointsAsCurrency(points: number, currency?: string): string;
/**
 * Default membership number for demo purposes
 */
export declare const DEFAULT_DEMO_MEMBERSHIP = "DL12345";
/**
 * Default loyalty program name
 */
export declare const DEFAULT_PROGRAM_NAME = "Cars and Stays by Delta";
