import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatShortDate, startOfDay } from "../lib/date-utils";
import { useI18n } from "../lib/i18n";
import type { DateFormat, UiLanguage } from "../lib/types";

interface DateNavigatorProps {
  selectedDate: number;
  dateFormat: DateFormat;
  searchActive: boolean;
  onChange(timestamp: number): void;
}

function dayName(timestamp: number, language: UiLanguage, today: string, yesterday: string): string {
  const day = startOfDay(timestamp);
  if (day === startOfDay(Date.now())) return today;
  if (day === startOfDay(addDays(Date.now(), -1))) return yesterday;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", { weekday: "short" }).format(timestamp);
}

export function DateNavigator({
  selectedDate,
  dateFormat,
  searchActive,
  onChange,
}: DateNavigatorProps) {
  const { language, t } = useI18n();
  const days = [-2, -1, 0, 1, 2].map((offset) => addDays(selectedDate, offset).getTime());

  return (
    <div className="controls border-bottom">
      {searchActive ? (
        <div className="search-scope-note">
          {t.searchScopeNote}
        </div>
      ) : (
        <div className="timeline-view">
          <button
            className="pagination-arrow"
            type="button"
            aria-label={t.previousDay}
            onClick={() => onChange(addDays(selectedDate, -1).getTime())}
          >
            <ChevronLeft />
          </button>
          <div className="pagination">
            {days.map((day) => {
              const active = startOfDay(day) === startOfDay(selectedDate);
              return (
                <button
                  key={day}
                  className={active ? "pagination-link active" : "pagination-link"}
                  type="button"
                  onClick={() => onChange(day)}
                >
                  <span>{dayName(day, language, t.today, t.yesterday)}</span>
                  <small className="date">{formatShortDate(day, dateFormat, language)}</small>
                </button>
              );
            })}
          </div>
          <button
            className="pagination-arrow"
            type="button"
            aria-label={t.nextDay}
            onClick={() => onChange(addDays(selectedDate, 1).getTime())}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
