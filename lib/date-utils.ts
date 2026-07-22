import type { DateFormat } from "./types";
import { getMessages, localeFor } from "./i18n";
import type { UiLanguage } from "./types";

export function startOfDay(value: Date | number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfDay(value: Date | number): number {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function addDays(value: Date | number, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDayHeading(
  timestamp: number,
  format: DateFormat,
  language: UiLanguage,
): string {
  if (format === "iso") {
    return toDayKey(timestamp);
  }

  const today = startOfDay(Date.now());
  const target = startOfDay(timestamp);
  const yesterday = startOfDay(addDays(Date.now(), -1));
  const messages = getMessages(language);
  if (target === today) return messages.today;
  if (target === yesterday) return messages.yesterday;

  return new Intl.DateTimeFormat(localeFor(language), {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(timestamp);
}

export function formatShortDate(
  timestamp: number,
  format: DateFormat,
  language: UiLanguage,
): string {
  if (format === "iso") {
    return toDayKey(timestamp);
  }
  return new Intl.DateTimeFormat(localeFor(language), {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

export function formatTime(timestamp: number, language: UiLanguage): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(timestamp);
}
