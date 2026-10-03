import { Injectable } from '@angular/core';
import { DateAdapter, MatDateFormats } from '@angular/material/core';
import {
  addDays,
  addMonths,
  addYears,
  format,
  addSeconds,
  getDate,
  getDaysInMonth,
  getMonth,
  getYear,
  parse,
  setDay,
  setMonth,
  toDate,
  setHours,
  setMinutes,
  setSeconds,
  getHours,
  getMinutes,
  getSeconds
} from 'date-fns';
// Ruta profunda a proposito: `date-fns/locale` es un barril que el servidor de desarrollo pre-empaqueta entero.
import locale from 'date-fns/locale/es';

const WEEK_STARTS_ON = 1; // lunes

export const MAT_DATE_CUSTOM_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'dd/MM/yyyy',
    timeInput: 'HH:mm'
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    timeInput: 'HH:mm',
    timeOptionLabel: 'HH:mm',
    monthYearLabel: 'LLL y',
    dateA11yLabel: 'MMMM d, y',
    monthYearA11yLabel: 'MMMM y'
  }
};

function range(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
}

@Injectable()
export class CustomDateAdapter extends DateAdapter<Date> {

  override addCalendarDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  override addCalendarMonths(date: Date, months: number): Date {
    return addMonths(date, months);
  }

  override addCalendarYears(date: Date, years: number): Date {
    return addYears(date, years);
  }

  override clone(date: Date): Date {
    return toDate(date);
  }

  override createDate(year: number, month: number, date: number): Date {
    return new Date(year, month, date);
  }

  override format(date: Date, displayFormat: string): string {
    return format(date, displayFormat, { locale });
  }

  override getDate(date: Date): number {
    return getDate(date);
  }

  override getDateNames(): string[] {
    return range(1, 31);
  }

  override getDayOfWeek(date: Date): number {
    return Number(format(date, 'i'));
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const map = {
      long: 'EEEE',
      short: 'EEE',
      narrow: 'EEEEE'
    };

    return range(0, 6).map(d =>
      format(setDay(new Date(), Number(d)), map[style], { locale })
    );
  }

  override getFirstDayOfWeek(): number {
    return WEEK_STARTS_ON;
  }

  override getMonth(date: Date): number {
    return getMonth(date);
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const map = {
      long: 'LLLL',
      short: 'LLL',
      narrow: 'LLLLL'
    };

    return range(0, 11).map(m =>
      format(setMonth(new Date(), Number(m)), map[style], { locale })
    );
  }

  override getNumDaysInMonth(date: Date): number {
    return getDaysInMonth(date);
  }

  override getYear(date: Date): number {
    return getYear(date);
  }

  override getYearName(date: Date): string {
    return format(date, 'yyyy', { locale });
  }

  override invalid(): Date {
    return new Date(NaN);
  }

  override isDateInstance(obj: any): boolean {
    return obj instanceof Date;
  }

  override isValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  override parse(value: any, parseFormat: string): Date | null {
    if (!value) return null;
    return parse(value, parseFormat, new Date(), { locale });
  }

  override toIso8601(date: Date): string {
    return date.toISOString();
  }

  override today(): Date {
    return new Date();
  }

  override setTime(
    date: Date,
    hours: number,
    minutes: number,
    seconds = 0
  ): Date {
    let d = toDate(date);
    d = setHours(d, hours);
    d = setMinutes(d, minutes);
    d = setSeconds(d, seconds);
    return d;
  }

  override getHours(date: Date): number {
    return getHours(date);
  }

  override getMinutes(date: Date): number {
    return getMinutes(date);
  }

  override getSeconds(date: Date): number {
    return getSeconds(date);
  }

  override addSeconds(date: Date, seconds: number): Date {
    return addSeconds(date, seconds);
  }

  override parseTime(value: any): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
    if (!match) {
      return null;
    }

    const hours = Math.min(Number(match[1]), 23);
    const minutes = Math.min(Number(match[2]), 59);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date;
  }


}