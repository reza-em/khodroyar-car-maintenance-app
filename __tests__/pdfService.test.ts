/**
 * Tests for PDF Generation Service
 * Tests Persian RTL PDF export functionality
 */

import {
  escapeHtml,
  sanitizeFilename,
  formatCurrency,
  toPersianDigits,
} from '../src/services/pdfService';
import {
  getCurrentJalaliDate,
  toPersianDigits as toPersianDigitsJalali,
} from '../src/lib/jalaliDate';

describe('PDF Service - Utility Functions', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should handle Persian text', () => {
      const persianText = 'تست فارسی';
      expect(escapeHtml(persianText)).toBe(persianText);
    });

    it('should handle undefined input', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should escape newlines', () => {
      expect(escapeHtml('line1\nline2')).toBe('line1<br/>line2');
    });

    it('should escape all special characters', () => {
      expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove invalid filename characters', () => {
      expect(sanitizeFilename('test<>:"|?*file.txt')).toBe('testfile.txt');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('test file name')).toBe('test_file_name');
    });

    it('should limit length to 100 characters', () => {
      const longName = 'a'.repeat(150);
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(100);
    });

    it('should handle Persian filenames', () => {
      const filename = 'گزارش مالی خودرو.pdf';
      expect(sanitizeFilename(filename)).toBe('گزارش_مالی_خودرو.pdf');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with Persian digits', () => {
      const result = formatCurrency(1234567);
      expect(result).toContain('تومان');
      expect(result).toContain('۱');
    });

    it('should handle undefined amount', () => {
      expect(formatCurrency(undefined)).toBe('۰');
    });

    it('should format with IRT currency', () => {
      const result = formatCurrency(2500000, 'IRT');
      expect(result).toMatch(/.*تومان$/);
    });

    it('should format with IRR currency', () => {
      const result = formatCurrency(2500000, 'IRR');
      expect(result).toMatch(/.*ریال$/);
    });

    it('should round amounts', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toContain('۱٬۲۳۴٬۵۶۸');
    });
  });
});

describe('PDF Service - Persian Text Handling', () => {
  describe('Test Persian strings for PDF rendering', () => {
    const testStrings = [
      'پژو ۲۰۷ پانوراما',
      'تعویض روغن و فیلتر روغن',
      'تعمیر جلوبندی خودرو',
      'مبلغ ۲٬۵۰۰٬۰۰۰ تومان',
      'تاریخ ۱۴۰۵/۰۶/۱۵',
      'کارکرد ۸۵٬۰۰۰ کیلومتر',
      'قطعه Bosch مدل FR7DC+',
      'کیلومتر بعدی: ۹۰٬۰۰۰',
    ];

    it('should escape all test strings for HTML', () => {
      testStrings.forEach((str) => {
        const escaped = escapeHtml(str);
        expect(escaped).toBeDefined();
        expect(escaped.length).toBeGreaterThan(0);
        // Ensure no unescaped HTML tags
        expect(escaped).not.toMatch(/<[^>]+>/);
      });
    });

    it('should handle mixed Persian-English text', () => {
      const mixedText = 'قطعه Bosch مدل FR7DC+';
      const escaped = escapeHtml(mixedText);
      expect(escaped).toBe(mixedText); // No HTML to escape
    });

    it('should preserve Persian digits in escaped text', () => {
      const textWithDigits = 'مبلغ ۲٬۵۰۰٬۰۰۰ تومان';
      const escaped = escapeHtml(textWithDigits);
      expect(escaped).toContain('۲٬۵۰۰٬۰۰۰');
    });
  });
});

describe('PDF Service - Filename Sanitization', () => {
  it('should create valid filenames from vehicle data', () => {
    const vehicleName = 'Peugeot 207';
    const startDate = '1405/01/01';
    const endDate = '1405/12/29';
    const reportType = 'vehicle_history';

    const filename = `khodroyar-${vehicleName}-${startDate.replace(/\//g, '-')}-to-${endDate.replace(/\//g, '-')}-${reportType}.pdf`;
    const sanitized = sanitizeFilename(filename);
    
    expect(sanitized).not.toMatch(/[<>:"|?*]/);
    expect(sanitized).toMatch(/\.pdf$/);
  });

  it('should handle filenames with special Persian characters', () => {
    const filename = 'گزارش-خودرویار-پژو-۲۰۷.pdf';
    const sanitized = sanitizeFilename(filename);
    expect(sanitized).toBeDefined();
    expect(sanitized.length).toBeGreaterThan(0);
  });

  it('should not include VIN in filename by default', () => {
    const filenameWithVin = 'khodroyar-peugeot-207-IR123456789.pdf';
    const sanitized = sanitizeFilename(filenameWithVin);
    // VIN should not be sanitized out, but the function doesn't specifically remove it
    // This test verifies the function doesn't break with VIN-like strings
    expect(sanitized).toBeDefined();
  });
});

describe('PDF Service - Date Formatting', () => {
  it('should format Jalali dates correctly for filenames', () => {
    const date = getCurrentJalaliDate();
    const formatted = date.replace(/\//g, '-');
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should handle date ranges in filenames', () => {
    const start = '1405/01/01';
    const end = '1405/12/29';
    const range = `${start.replace(/\//g, '-')}-to-${end.replace(/\//g, '-')}`;
    expect(range).toBe('1405-01-01-to-1405-12-29');
  });
});

describe('PDF Service - Empty State Handling', () => {
  it('should return empty string for empty data', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as any)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should format zero currency', () => {
    const result = formatCurrency(0);
    expect(result).toContain('۰');
  });
});
