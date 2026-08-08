import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { startOfDay } from "../lib/date-utils";
import { useI18n } from "../lib/i18n";
import type { UiLanguage } from "../lib/types";

interface CalendarPopoverProps {
  selectedDate: number;
  onChange(timestamp: number): void;
  onClose(): void;
}

interface CalendarDay {
  timestamp: number;
  day: number;
  outside: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];

function addMonths(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return date;
}

function monthLabel(year: number, month: number, language: UiLanguage): string {
  if (language === "en") return MONTHS[month] ?? `${month + 1}`;
  return `${month + 1}月`;
}

function weekdayLabels(language: UiLanguage): string[] {
  return language === "en" ? WEEKDAYS : WEEKDAYS_ZH;
}

function buildDays(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDay[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const previous = new Date(year, month, index - firstWeekday + 1);
    cells.push({
      timestamp: startOfDay(previous.getTime()),
      day: previous.getDate(),
      outside: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    cells.push({
      timestamp: startOfDay(current.getTime()),
      day,
      outside: false,
    });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let index = 1; index <= trailing; index += 1) {
    const next = new Date(year, month + 1, index);
    cells.push({
      timestamp: startOfDay(next.getTime()),
      day: next.getDate(),
      outside: true,
    });
  }

  return cells;
}

export function CalendarPopover({
  selectedDate,
  onChange,
  onClose,
}: CalendarPopoverProps) {
  const { language, t } = useI18n();
  const selected = new Date(selectedDate);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const panelRef = useRef<HTMLDivElement>(null);
  const days = buildDays(viewYear, viewMonth);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function shiftYear(amount: number) {
    setViewYear((year) => year + amount);
  }

  function shiftMonth(amount: number) {
    const next = addMonths(new Date(viewYear, viewMonth, 1), amount);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className="calendar-popover" role="dialog" aria-label={t.openCalendar} ref={panelRef}>
      <header className="calendar-header">
        <span>{t.browsingHistoryEyebrow}</span>
        <strong>{formatDayHeading(selectedDate, language)}</strong>
        <button type="button" aria-label={t.closeCalendar} onClick={onClose}>
          <X />
        </button>
      </header>

      <div className="calendar-year-row" aria-label={t.calendarYear}>
        <button type="button" aria-label={t.previousYear} onClick={() => shiftYear(-1)}>
          <ChevronLeft />
        </button>
        <strong>{viewYear}</strong>
        <button type="button" aria-label={t.nextYear} onClick={() => shiftYear(1)}>
          <ChevronRight />
        </button>
      </div>

      <div className="calendar-month-row" aria-label={t.calendarMonth}>
        <button type="button" aria-label={t.previousMonth} onClick={() => shiftMonth(-1)}>
          <ChevronLeft />
        </button>
        <strong>{monthLabel(viewYear, viewMonth, language)}</strong>
        <button type="button" aria-label={t.nextMonth} onClick={() => shiftMonth(1)}>
          <ChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {weekdayLabels(language).map((label) => <span key={label}>{label}</span>)}
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          const active = day.timestamp === startOfDay(selectedDate);
          const classes = [
            "calendar-day",
            day.outside ? "outside" : "",
            active ? "active" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={day.timestamp}
              className={classes}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(day.timestamp)}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDayHeading(timestamp: number, language: UiLanguage): string {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}
