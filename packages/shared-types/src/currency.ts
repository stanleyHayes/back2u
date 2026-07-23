/**
 * Single source of truth for currency across the platform.
 * Amounts are always integer minor units (pesewa for GHS, cents for USD).
 *
 * Today the platform defaults to GHS; this type/const is the one place to widen
 * for multi-currency support (per-institution or per-user currency later).
 */
export type SupportedCurrency = 'GHS' | 'NGN' | 'USD' | 'EUR' | 'GBP';

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  'GHS',
  'NGN',
  'USD',
  'EUR',
  'GBP',
];

export const DEFAULT_CURRENCY: SupportedCurrency = 'GHS';
