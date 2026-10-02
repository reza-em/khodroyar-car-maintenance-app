/**
 * Jalali Date Utilities for KhodroYar Application
 * 
 * This module provides utilities for working with Jalali (Persian) calendar
 * dates in the application. It wraps the moment-jalaali library with
 * additional convenience functions.
 */

import moment from 'moment-jalaali';
import { jalaliMoment } from 'jalali-moment';

// Persian month names
const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

// Persian month names in genitive case (for dates like "1 فروردین")
const PERSIAN_MONTH_NAMES_GENITIVE = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

// Persian weekday names
const PERSIAN_WEEKDAY_NAMES = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const;

// Persian weekday short names
const PERSIAN_WEEKDAY_SHORT_NAMES = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'] as const;

// Persian digits mapping
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/**
 * Convert Gregorian date to Jalali date
 */
export function gregorianToJalali(gregorianDate: string | Date): string {
  const date = new Date(gregorianDate);
  const jDate = moment(date).format('jYYYY/jMM/jDD');
  return jDate;
}

/**
 * Convert Jalali date to Gregorian date
 */
export function jalaliToGregorian(jalaliDate: string): Date {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD').toDate();
  return date;
}

/**
 * Format Jalali date with custom format
 */
export function formatJalaliDate(jalaliDate: string, format: string = 'jYYYY/jMM/jDD'): string {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD');
  return date.format(format);
}

/**
 * Get current Jalali date
 */
export function getCurrentJalaliDate(): string {
  const jDate = moment().format('jYYYY/jMM/jDD');
  return jDate;
}

/**
 * Get current Jalali date and time
 */
export function getCurrentJalaliDateTime(): string {
  const jDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
  return jDateTime;
}

/**
 * Get current Gregorian ISO string
 */
export function getCurrentGregorianISO(): string {
  return new Date().toISOString();
}

/**
 * Get Jalali year from date string
 */
export function getJalaliYear(jalaliDate: string): number {
  const parts = jalaliDate.split(/[/\-]/);
  return parseInt(parts[0], 10);
}

/**
 * Get Jalali month from date string
 */
export function getJalaliMonth(jalaliDate: string): number {
  const parts = jalaliDate.split(/[/\-]/);
  return parseInt(parts[1], 10);
}

/**
 * Get Jalali day from date string
 */
export function getJalaliDay(jalaliDate: string): number {
  const parts = jalaliDate.split(/[/\-]/);
  return parseInt(parts[2], 10);
}

/**
 * Get Persian month name by number (1-12)
 */
export function getPersianMonthName(month: number): string {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month number: ${month}`);
  }
  return PERSIAN_MONTH_NAMES[month - 1];
}

/**
 * Get Persian weekday name by number (0-6, where 0 is Sunday)
 */
export function getPersianWeekdayName(dayOfWeek: number): string {
  // moment-jalaali returns 0-6 where 0 is Saturday
  // We need to map this to our array where 0 is Sunday
  const mappedDay = (dayOfWeek + 1) % 7;
  return PERSIAN_WEEKDAY_NAMES[mappedDay];
}

/**
 * Get Persian weekday short name by number
 */
export function getPersianWeekdayShortName(dayOfWeek: number): string {
  const mappedDay = (dayOfWeek + 1) % 7;
  return PERSIAN_WEEKDAY_SHORT_NAMES[mappedDay];
}

/**
 * Get day of week for a Jalali date (0-6, where 0 is Sunday)
 */
export function getJalaliDayOfWeek(jalaliDate: string): number {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD');
  const dayOfWeek = date.day(); // 0-6 where 0 is Saturday in moment-jalaali
  // Map to our system: 0=Sunday, 1=Monday, ..., 6=Saturday
  return (dayOfWeek + 1) % 7;
}

/**
 * Check if a Jalali year is a leap year
 */
export function isJalaliLeapYear(year: number): boolean {
  // Jalali leap year rule: years that are divisible by 33 with remainder 1, 5, 9, 13, 17, 22, 26, or 30
  const remainders = [1, 5, 9, 13, 17, 22, 26, 30];
  const remainder = ((year + 10) % 33);
  return remainders.includes(remainder);
}

/**
 * Get number of days in a Jalali month
 */
export function getJalaliDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month number: ${month}`);
  }
  
  // Months 1-6 have 31 days
  if (month <= 6) {
    return 31;
  }
  
  // Months 7-11 have 30 days
  if (month <= 11) {
    return 30;
  }
  
  // Month 12 (Esfand) has 29 or 30 days depending on leap year
  return isJalaliLeapYear(year) ? 30 : 29;
}

/**
 * Add days to a Jalali date
 */
export function addJalaliDays(jalaliDate: string, days: number): string {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD').add(days, 'days');
  return date.format('jYYYY/jMM/jDD');
}

/**
 * Add months to a Jalali date
 */
export function addJalaliMonths(jalaliDate: string, months: number): string {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD').add(months, 'months');
  return date.format('jYYYY/jMM/jDD');
}

/**
 * Add years to a Jalali date
 */
export function addJalaliYears(jalaliDate: string, years: number): string {
  const date = jalaliMoment(jalaliDate, 'jYYYY/jMM/jDD').add(years, 'years');
  return date.format('jYYYY/jMM/jDD');
}

/**
 * Calculate difference between two Jalali dates in days
 */
export function jalaliDateDiffInDays(date1: string, date2: string): number {
  const gDate1 = jalaliToGregorian(date1);
  const gDate2 = jalaliToGregorian(date2);
  const diff = gDate1.getTime() - gDate2.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if a Jalali date is before another Jalali date
 */
export function isJalaliDateBefore(date1: string, date2: string): boolean {
  const gDate1 = jalaliToGregorian(date1);
  const gDate2 = jalaliToGregorian(date2);
  return gDate1 < gDate2;
}

/**
 * Check if a Jalali date is after another Jalali date
 */
export function isJalaliDateAfter(date1: string, date2: string): boolean {
  const gDate1 = jalaliToGregorian(date1);
  const gDate2 = jalaliToGregorian(date2);
  return gDate1 > gDate2;
}

/**
 * Check if a Jalali date is the same as another Jalali date
 */
export function isJalaliDateSame(date1: string, date2: string): boolean {
  const gDate1 = jalaliToGregorian(date1);
  const gDate2 = jalaliToGregorian(date2);
  return gDate1.getTime() === gDate2.getTime();
}

/**
 * Convert numeric string to Persian digits
 */
export function toPersianDigits(num: string | number): string {
  const str = String(num);
  let result = str;
  
  // Convert Arabic digits to English
  for (let i = 0; i < ARABIC_DIGITS.length; i++) {
    result = result.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  
  // Convert English digits to Persian
  for (let i = 0; i < PERSIAN_DIGITS.length; i++) {
    result = result.replace(new RegExp(String(i), 'g'), PERSIAN_DIGITS[i]);
  }
  
  return result;
}

/**
 * Convert Persian digits to numeric string
 */
export function fromPersianDigits(str: string): string {
  let result = str;
  
  // Convert Persian digits to English
  for (let i = 0; i < PERSIAN_DIGITS.length; i++) {
    result = result.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
  }
  
  // Convert Arabic digits to English
  for (let i = 0; i < ARABIC_DIGITS.length; i++) {
    result = result.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  
  return result;
}

/**
 * Format a Jalali date with Persian digits
 */
export function formatJalaliDateWithPersianDigits(jalaliDate: string): string {
  const parts = jalaliDate.split(/[/\-]/);
  const formattedParts = parts.map(part => toPersianDigits(part));
  return formattedParts.join('/');
}

/**
 * Format Jalali date in Persian with month name
 * Example: "۱۵ فروردین ۱۴۰۳"
 */
export function formatJalaliDateLong(jalaliDate: string): string {
  const parts = jalaliDate.split(/[/\-]/);
  const year = toPersianDigits(parts[0]);
  const month = parseInt(parts[1], 10);
  const day = toPersianDigits(parts[2]);
  const monthName = getPersianMonthName(month);
  
  return `${day} ${monthName} ${year}`;
}

/**
 * Format Jalali date with weekday
 * Example: "شنبه، ۱۵ فروردین ۱۴۰۳"
 */
export function formatJalaliDateWithWeekday(jalaliDate: string): string {
  const weekday = getPersianWeekdayName(getJalaliDayOfWeek(jalaliDate));
  const longDate = formatJalaliDateLong(jalaliDate);
  return `${weekday)، ${longDate}`;
}

/**
 * Format Jalali date in compact format
 * Example: "۱۴۰۳/۰۱/۱۵"
 */
export function formatJalaliDateCompact(jalaliDate: string): string {
  return formatJalaliDateWithPersianDigits(jalaliDate);
}

/**
 * Format Jalali date for display (smart format based on how recent it is)
 */
export function formatJalaliDateSmart(jalaliDate: string): string {
  const today = getCurrentJalaliDate();
  
  if (isJalaliDateSame(jalaliDate, today)) {
    return 'امروز';
  }
  
  const yesterday = addJalaliDays(today, -1);
  if (isJalaliDateSame(jalaliDate, yesterday)) {
    return 'دیروز';
  }
  
  const tomorrow = addJalaliDays(today, 1);
  if (isJalaliDateSame(jalaliDate, tomorrow)) {
    return 'فردا';
  }
  
  // Check if within current week
  const currentYear = getJalaliYear(today);
  const currentMonth = getJalaliMonth(today);
  const dateYear = getJalaliYear(jalaliDate);
  const dateMonth = getJalaliMonth(jalaliDate);
  
  if (dateYear === currentYear && dateMonth === currentMonth) {
    // Same month, show day and month name
    const day = getJalaliDay(jalaliDate);
    const weekday = getPersianWeekdayName(getJalaliDayOfWeek(jalaliDate));
    return `${weekday)، ${toPersianDigits(day)} ${getPersianMonthName(dateMonth)}`;
  }
  
  // Show full date
  return formatJalaliDateCompact(jalaliDate);
}

/**
 * Format Jalali date for input fields (YYYY/MM/DD)
 */
export function formatJalaliDateForInput(jalaliDate: string): string {
  const parts = jalaliDate.split(/[/\-]/);
  return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
}

/**
 * Parse Jalali date from input (YYYY/MM/DD or YYYY-MM-DD)
 */
export function parseJalaliDateFromInput(input: string): string {
  // Replace any non-digit characters
  const cleaned = input.replace(/[^\d]/g, '');
  
  if (cleaned.length === 8) {
    // YYYYMMDD format
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    return `${year}/${month}/${day}`;
  }
  
  return input;
}

/**
 * Validate a Jalali date string
 */
export function isValidJalaliDate(date: string): boolean {
  const parts = date.split(/[/\-]/);
  if (parts.length !== 3) return false;
  
  try {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    
    const maxDays = getJalaliDaysInMonth(year, month);
    return day <= maxDays;
  } catch {
    return false;
  }
}

/**
 * Get Jalali date range for a month
 */
export function getJalaliMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}/${month.toString().padStart(2, '0')}/01`;
  const daysInMonth = getJalaliDaysInMonth(year, month);
  const end = `${year}/${month.toString().padStart(2, '0')}/${daysInMonth.toString().padStart(2, '0')}`;
  return { start, end };
}

/**
 * Get current Jalali month range
 */
export function getCurrentJalaliMonthRange(): { start: string; end: string } {
  const today = getCurrentJalaliDate();
  const year = getJalaliYear(today);
  const month = getJalaliMonth(today);
  return getJalaliMonthRange(year, month);
}

/**
 * Get Jalali dates for all days in a month
 */
export function getJalaliMonthDays(year: number, month: number): string[] {
  const daysInMonth = getJalaliDaysInMonth(year, month);
  const days: string[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    days.push(date);
  }
  
  return days;
}

/**
 * Get Jalali date from Date object
 */
export function getJalaliFromDate(date: Date): string {
  const jDate = moment(date).format('jYYYY/jMM/jDD');
  return jDate;
}

/**
 * Convert ISO string to Jalali date string
 */
export function isoToJalali(isoString: string): string {
  const date = new Date(isoString);
  return getJalaliFromDate(date);
}

/**
 * Convert Jalali date to ISO string
 */
export function jalaliToISO(jalaliDate: string): string {
  const date = jalaliToGregorian(jalaliDate);
  return date.toISOString();
}

/**
 * Get start and end of Jalali year
 */
export function getJalaliYearRange(year: number): { start: string; end: string } {
  const start = `${year}/01/01`;
  const end = isJalaliLeapYear(year) ? `${year}/12/30` : `${year}/12/29`;
  return { start, end };
}

/**
 * Get Jalali date difference in various units
 */
export function getJalaliDateDifference(date1: string, date2: string): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
} {
  const gDate1 = jalaliToGregorian(date1);
  const gDate2 = jalaliToGregorian(date2);
  const diff = gDate1.getTime() - gDate2.getTime();
  const totalDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
  
  // Approximate years and months (for display purposes)
  const jYear1 = getJalaliYear(date1);
  const jMonth1 = getJalaliMonth(date1);
  const jDay1 = getJalaliDay(date1);
  const jYear2 = getJalaliYear(date2);
  const jMonth2 = getJalaliMonth(date2);
  const jDay2 = getJalaliDay(date2);
  
  let years = jYear1 - jYear2;
  let months = jMonth1 - jMonth2;
  let days = jDay1 - jDay2;
  
  if (days < 0) {
    months--;
    const daysInPrevMonth = getJalaliDaysInMonth(jYear1, jMonth1 - 1 > 0 ? jMonth1 - 1 : 12);
    days += daysInPrevMonth;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years: Math.abs(years),
    months: Math.abs(months),
    days: Math.abs(days),
    totalDays,
  };
}

/**
 * Format a duration in Persian
 */
export function formatDurationPersian(days: number): string {
  if (days === 0) return 'امروز';
  if (days === 1) return '۱ روز دیگر';
  if (days < 7) return `۱${toPersianDigits(days)} روز دیگر`;
  
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '۱ هفته دیگر';
  if (weeks < 4) return `۱${toPersianDigits(weeks)} هفته دیگر`;
  
  const months = Math.floor(days / 30);
  if (months === 1) return '۱ ماه دیگر';
  return `۱${toPersianDigits(months)} ماه دیگر`;
}

/**
 * Format a past duration in Persian
 */
export function formatPastDurationPersian(days: number): string {
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `۱${toPersianDigits(days)} روز پیش`;
  
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '۱ هفته پیش';
  if (weeks < 4) return `۱${toPersianDigits(weeks)} هفته پیش`;
  
  const months = Math.floor(days / 30);
  if (months === 1) return '۱ ماه پیش';
  return `۱${toPersianDigits(months)} ماه پیش`;
}

/**
 * Get all Persian month names
 */
export function getAllPersianMonthNames(): readonly string[] {
  return [...PERSIAN_MONTH_NAMES];
}

/**
 * Get all Persian weekday names
 */
export function getAllPersianWeekdayNames(): readonly string[] {
  return [...PERSIAN_WEEKDAY_NAMES];
}

/**
 * Get Persian month number from name
 */
export function getPersianMonthNumber(monthName: string): number | undefined {
  const index = PERSIAN_MONTH_NAMES.findIndex(name => name === monthName);
  return index >= 0 ? index + 1 : undefined;
}

// Export constants
export {
  PERSIAN_MONTH_NAMES,
  PERSIAN_MONTH_NAMES_GENITIVE,
  PERSIAN_WEEKDAY_NAMES,
  PERSIAN_WEEKDAY_SHORT_NAMES,
};
