/**
 * All monetary amounts on the wire and in the DB are stored as integer minor units
 * (pesewa for GHS, cents for USD). Floating point is forbidden in money math.
 */
import { DEFAULT_CURRENCY } from '@back2u/shared-types';

export type MinorUnits = number; // integer

export interface Money {
  amount: MinorUnits;
  currency: string;
}

export const money = (amount: MinorUnits, currency: string = DEFAULT_CURRENCY): Money => {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('Money.amount must be a non-negative integer (minor units)');
  }
  return { amount, currency };
};

export const fromMajor = (major: number, currency: string = DEFAULT_CURRENCY): Money =>
  money(Math.round(major * 100), currency);

export const toMajor = (m: Money): number => m.amount / 100;

export const formatMoney = (m: Money): string =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: m.currency }).format(toMajor(m));
