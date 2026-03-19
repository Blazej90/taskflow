import { describe, expect, it } from 'vitest';
import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  const pipe = new DateFormatPipe();

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format ISO date to DD-MM-YYYY', () => {
    const result = pipe.transform('2024-03-15');
    expect(result).toBe('15-03-2024');
  });

  it('should handle different dates correctly', () => {
    expect(pipe.transform('2023-12-25')).toBe('25-12-2023');
    expect(pipe.transform('2025-01-01')).toBe('01-01-2025');
    expect(pipe.transform('2024-06-30')).toBe('30-06-2024');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return original value for invalid format', () => {
    const invalidDate = 'invalid-date';
    const result = pipe.transform(invalidDate);
    expect(result).toBe(invalidDate);
  });

  it('should return original value for partial date', () => {
    const partialDate = '2024-03';
    const result = pipe.transform(partialDate);
    expect(result).toBe(partialDate);
  });

  it('should handle edge case dates', () => {
    // Leap year
    expect(pipe.transform('2024-02-29')).toBe('29-02-2024');
    
    // Year boundary
    expect(pipe.transform('1999-12-31')).toBe('31-12-1999');
    expect(pipe.transform('2000-01-01')).toBe('01-01-2000');
  });
});
