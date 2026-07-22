export type ArchiveCursor = [number, string];
export type ThemeMode = "light" | "dark" | "system";
export type UiDensity = "compact" | "comfortable";
export type DateFormat = "localized" | "iso";
export type LinkDisplayMode = "merged" | "independent";
export type UiLanguage = "zh-CN" | "en";
export type AppView = "history" | "export";

export interface ArchiveVisit {
  id: string;
  visitId: string;
  historyId: string;
  url: string;
  title: string;
  domain: string;
  visitTime: number;
  referringVisitId: string;
  transition: string;
  typedCount: number;
  capturedAt: number;
}

export interface DailyUrlSummary {
  id: string;
  dayKey: string;
  url: string;
  title: string;
  domain: string;
  firstVisitTime: number;
  lastVisitTime: number;
  visitCount: number;
  transition: string;
  updatedAt: number;
}

export interface SummaryQuery {
  query?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  cursor?: ArchiveCursor | null;
}

export interface SummaryQueryResult {
  items: DailyUrlSummary[];
  nextCursor: ArchiveCursor | null;
}

export interface VisitQuery {
  query?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  cursor?: ArchiveCursor | null;
}

export interface VisitQueryResult {
  items: ArchiveVisit[];
  nextCursor: ArchiveCursor | null;
}

export interface ArchiveStats {
  visitCount: number;
  summaryCount: number;
  earliestVisit: ArchiveVisit | null;
  latestVisit: ArchiveVisit | null;
  backfillComplete: boolean;
  backfillPages: number;
  lastSuccessfulSyncAt: number | null;
}

export interface UserSettings {
  theme: ThemeMode;
  density: UiDensity;
  dateFormat: DateFormat;
  linkDisplay: LinkDisplayMode;
  language: UiLanguage;
}

/** Unified row model for timeline rendering. */
export interface TimelineEntry {
  id: string;
  url: string;
  title: string;
  domain: string;
  visitTime: number;
  visitCount: number;
}
