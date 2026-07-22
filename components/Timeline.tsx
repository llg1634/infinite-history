import {
  Check,
  Copy,
  ExternalLink,
  Search,
} from "lucide-react";
import { useState } from "react";
import { formatDayHeading, formatTime, toDayKey } from "../lib/date-utils";
import { useI18n } from "../lib/i18n";
import type { DateFormat, LinkDisplayMode, TimelineEntry } from "../lib/types";

interface TimelineProps {
  items: TimelineEntry[];
  dateFormat: DateFormat;
  searchActive: boolean;
  linkDisplay: LinkDisplayMode;
  onSearchDomain(domain: string): void;
}

interface HourGroup {
  key: string;
  label: string;
  items: TimelineEntry[];
}

interface DayGroup {
  key: string;
  timestamp: number;
  hours: HourGroup[];
}

function groupTimeline(items: TimelineEntry[]): DayGroup[] {
  const days: DayGroup[] = [];

  for (const item of items) {
    const dayKey = toDayKey(item.visitTime);
    let day = days.at(-1);
    if (!day || day.key !== dayKey) {
      day = { key: dayKey, timestamp: item.visitTime, hours: [] };
      days.push(day);
    }

    const hour = new Date(item.visitTime).getHours();
    const hourKey = `${dayKey}-${hour}`;
    let hourGroup = day.hours.at(-1);
    if (!hourGroup || hourGroup.key !== hourKey) {
      hourGroup = {
        key: hourKey,
        label: `${String(hour).padStart(2, "0")}:00 - ${String(hour).padStart(2, "0")}:59`,
        items: [],
      };
      day.hours.push(hourGroup);
    }
    hourGroup.items.push(item);
  }

  return days;
}

function faviconUrl(url: string): string {
  const endpoint = new URL("/_favicon/", location.origin);
  endpoint.searchParams.set("pageUrl", url);
  endpoint.searchParams.set("size", "32");
  return endpoint.href;
}

function VisitRow({
  item,
  copied,
  onCopy,
  onSearchDomain,
}: {
  item: TimelineEntry;
  copied: boolean;
  onCopy(item: TimelineEntry): void;
  onSearchDomain(domain: string): void;
}) {
  const { language, t } = useI18n();

  return (
    <article className="visit">
      <a className="visit-link" href={item.url} target="_blank" rel="noreferrer">
        <img className="favicon icon" src={faviconUrl(item.url)} alt="" />
        <span className="details">
          <span className="title">{item.title || item.url}</span>
          <span className="location">{item.url}</span>
          {item.visitCount > 1 ? (
            <span className="visit-count">{t.sameLinkVisits(item.visitCount)}</span>
          ) : null}
        </span>
        <time className="time-stamp" dateTime={new Date(item.visitTime).toISOString()}>
          {formatTime(item.visitTime, language)}
        </time>
      </a>
      <div className="more-actions" aria-label={t.readOnlyActions}>
        <button type="button" onClick={() => onSearchDomain(item.domain)} title={t.searchDomain}>
          <Search aria-hidden="true" />
          <span>{t.domain}</span>
        </button>
        <button type="button" onClick={() => onCopy(item)} title={t.copyLink}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span>{copied ? t.copied : t.copy}</span>
        </button>
        <a href={item.url} target="_blank" rel="noreferrer" title={t.openPage}>
          <ExternalLink aria-hidden="true" />
          <span>{t.open}</span>
        </a>
      </div>
    </article>
  );
}

export function Timeline({
  items,
  dateFormat,
  searchActive,
  linkDisplay,
  onSearchDomain,
}: TimelineProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { language, t } = useI18n();
  const groups = groupTimeline(items);

  async function copyLink(item: TimelineEntry) {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((current) => current === item.id ? null : current), 1400);
  }

  return (
    <div className="history--visits">
      {groups.map((day) => (
        <section key={day.key} className="date-section">
          <header className="date--header">
            <h2 className="cap">{formatDayHeading(day.timestamp, dateFormat, language)}</h2>
            <span>{searchActive ? day.key : t.timeBlockCount(day.hours.length)}</span>
          </header>
          {day.hours.map((hour) => (
            <section key={hour.key} className="hour-visits">
              <header className="section-header">
                <h4>{hour.label}</h4>
                <span>{linkDisplay === "merged" ? t.urlCount(hour.items.length) : t.visitCount(hour.items.length)}</span>
              </header>
              <div className="visits">
                {hour.items.map((item) => (
                  <VisitRow
                    key={item.id}
                    item={item}
                    copied={copiedId === item.id}
                    onCopy={copyLink}
                    onSearchDomain={onSearchDomain}
                  />
                ))}
              </div>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}
