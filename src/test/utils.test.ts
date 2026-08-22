import { describe, it, expect } from 'vitest';
import {
  cn,
  formatPrice,
  formatNumber,
  formatPercent,
  formatTimeAgo,
} from '@/lib/utils';

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', 'b', false, null, undefined, 'c')).toBe('a b c');
  });

  it('returns empty string for all falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('formatPrice', () => {
  it('formats prices >= 1 with 2 decimals', () => {
    expect(formatPrice(42000.5)).toBe('$42,000.50');
  });

  it('formats prices < 1 with 6 decimals', () => {
    expect(formatPrice(0.123456)).toBe('$0.123456');
  });

  it('returns dash for null/undefined', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
  });
});

describe('formatNumber', () => {
  it('formats trillions', () => {
    expect(formatNumber(1.5e12)).toBe('1.50T');
  });

  it('formats billions', () => {
    expect(formatNumber(2.5e9)).toBe('2.50B');
  });

  it('formats millions', () => {
    expect(formatNumber(5e6)).toBe('5.00M');
  });

  it('formats thousands', () => {
    expect(formatNumber(3.5e3)).toBe('3.50K');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42.5)).toBe('42.50');
  });

  it('returns dash for null/undefined', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('adds plus sign for positive values', () => {
    expect(formatPercent(5.23)).toBe('+5.23%');
  });

  it('keeps minus sign for negative values', () => {
    expect(formatPercent(-3.45)).toBe('-3.45%');
  });

  it('returns dash for null/undefined', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
  });
});

describe('formatTimeAgo', () => {
  it('returns "just now" for < 1 minute', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatTimeAgo(d)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatTimeAgo(d)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const d = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatTimeAgo(d)).toBe('2d ago');
  });
});
