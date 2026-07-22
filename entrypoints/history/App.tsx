import { browser } from "wxt/browser";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { DateNavigator } from "../../components/DateNavigator";
import { ExportView } from "../../components/ExportView";
import { SettingsPopover } from "../../components/SettingsPopover";
import { Sidebar } from "../../components/Sidebar";
import { Timeline } from "../../components/Timeline";
import {
  getArchiveStats,
  queryDailySummaries,
  queryVisits,
} from "../../lib/archive-db";
import { endOfDay, formatDayHeading, startOfDay } from "../../lib/date-utils";
import { getMessages, LanguageProvider } from "../../lib/i18n";
import type {
  AppView,
  ArchiveCursor,
  ArchiveStats,
  ArchiveVisit,
  DailyUrlSummary,
  TimelineEntry,
  UserSettings,
} from "../../lib/types";

const PAGE_SIZE = 100;
const SETTINGS_KEY = "infiniteHistory.settings.v1";
const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  density: "compact",
  dateFormat: "localized",
  linkDisplay: "merged",
  language: "zh-CN",
};

function readSettings(): UserSettings {
  try {
    const value = localStorage.getItem(SETTINGS_KEY);
    if (!value) return DEFAULT_SETTINGS;
    const saved = JSON.parse(value) as Partial<UserSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      language: saved.language === "en" ? "en" : "zh-CN",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function summaryToEntry(summary: DailyUrlSummary): TimelineEntry {
  return {
    id: summary.id,
    url: summary.url,
    title: summary.title,
    domain: summary.domain,
    visitTime: summary.lastVisitTime,
    visitCount: summary.visitCount,
  };
}

function visitToEntry(visit: ArchiveVisit): TimelineEntry {
  return {
    id: visit.id,
    url: visit.url,
    title: visit.title,
    domain: visit.domain,
    visitTime: visit.visitTime,
    visitCount: 1,
  };
}

export function App() {
  const [activeView, setActiveView] = useState<AppView>("history");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(readSettings);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(Date.now()));
  const [items, setItems] = useState<TimelineEntry[]>([]);
  const [cursor, setCursor] = useState<ArchiveCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [archiveRevision, setArchiveRevision] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchActive = deferredQuery.length > 0;
  const rangeStart = searchActive ? 0 : startOfDay(selectedDate);
  const rangeEnd = searchActive ? Number.MAX_SAFE_INTEGER : endOfDay(selectedDate);
  const mergedMode = settings.linkDisplay === "merged";
  const t = getMessages(settings.language);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.dataset.density = settings.density;
    document.documentElement.lang = settings.language;

    const media = matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark-theme", dark);
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const request = mergedMode
      ? queryDailySummaries({
          query: deferredQuery,
          startTime: rangeStart,
          endTime: rangeEnd,
          limit: PAGE_SIZE,
        }).then((result) => ({
          items: result.items.map(summaryToEntry),
          nextCursor: result.nextCursor,
        }))
      : queryVisits({
          query: deferredQuery,
          startTime: rangeStart,
          endTime: rangeEnd,
          limit: PAGE_SIZE,
        }).then((result) => ({
          items: result.items.map(visitToEntry),
          nextCursor: result.nextCursor,
        }));

    request.then((result) => {
      if (cancelled) return;
      startTransition(() => {
        setItems(result.items);
        setCursor(result.nextCursor);
        setHasMore(Boolean(result.nextCursor) && result.items.length === PAGE_SIZE);
        setLoading(false);
      });
    }).catch((error) => {
      console.error("Failed to read history entries", error);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [archiveRevision, deferredQuery, mergedMode, rangeEnd, rangeStart]);

  useEffect(() => {
    let cancelled = false;
    async function refreshStats() {
      try {
        const nextStats = await getArchiveStats();
        if (!cancelled) setStats(nextStats);
      } catch (error) {
        console.error("Failed to read archive stats", error);
      }
    }
    void refreshStats();
    const timer = setInterval(refreshStats, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [archiveRevision]);

  useEffect(() => {
    const listener = (message: unknown) => {
      if ((message as { type?: string })?.type === "infiniteHistory:archiveUpdated") {
        setArchiveRevision((current) => current + 1);
      }
      return undefined;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const loadMore = useEffectEvent(async () => {
    if (!hasMore || loading || !cursor) return;
    setLoading(true);
    try {
      const result = mergedMode
        ? await queryDailySummaries({
            query: deferredQuery,
            startTime: rangeStart,
            endTime: rangeEnd,
            limit: PAGE_SIZE,
            cursor,
          }).then((page) => ({
            items: page.items.map(summaryToEntry),
            nextCursor: page.nextCursor,
          }))
        : await queryVisits({
            query: deferredQuery,
            startTime: rangeStart,
            endTime: rangeEnd,
            limit: PAGE_SIZE,
            cursor,
          }).then((page) => ({
            items: page.items.map(visitToEntry),
            nextCursor: page.nextCursor,
          }));

      startTransition(() => {
        setItems((current) => [...current, ...result.items]);
        setCursor(result.nextCursor);
        setHasMore(Boolean(result.nextCursor) && result.items.length === PAGE_SIZE);
      });
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "500px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setActiveView("history");
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  async function syncNow() {
    setSyncing(true);
    try {
      await browser.runtime.sendMessage({ type: "infiniteHistory:syncNow" });
      setArchiveRevision((current) => current + 1);
    } finally {
      setSyncing(false);
    }
  }

  function focusSearch() {
    setActiveView("history");
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function searchDomain(domain: string) {
    setActiveView("history");
    setQuery(domain);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function changeDate(timestamp: number) {
    setQuery("");
    setSelectedDate(startOfDay(timestamp));
  }

  function toggleLanguage() {
    setSettingsOpen(false);
    setSettings((current) => ({
      ...current,
      language: current.language === "zh-CN" ? "en" : "zh-CN",
    }));
  }

  return (
    <LanguageProvider value={settings.language}>
      <div className="app-root">
      <Sidebar
        activeView={activeView}
        archiveCount={stats?.visitCount ?? 0}
        backfillComplete={stats?.backfillComplete ?? false}
        settingsOpen={settingsOpen}
        onViewChange={setActiveView}
        onSearch={focusSearch}
        onToggleLanguage={toggleLanguage}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      >
        {settingsOpen ? (
          <SettingsPopover
            settings={settings}
            onChange={setSettings}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </Sidebar>

      <div className="workspace">
        <header className={activeView === "export" ? "header-search compact" : "header-search"}>
          <div className="header-row">
            <label className="main-search">
              <Search aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={t.searchPlaceholder}
                onFocus={() => setActiveView("history")}
                onChange={(event) => {
                  setActiveView("history");
                  setQuery(event.target.value);
                }}
              />
              {query ? (
                <button type="button" aria-label={t.clearSearch} onClick={() => setQuery("")}><X /></button>
              ) : <kbd>Ctrl K</kbd>}
            </label>

            <div className="header-status">
              <span className="safe-indicator"><ShieldCheck />{t.readOnlyArchive}</span>
              <button className={syncing ? "sync-button spinning" : "sync-button"} type="button" onClick={syncNow}>
                <RefreshCw aria-hidden="true" />
                <span>{syncing ? t.syncing : t.syncNow}</span>
              </button>
            </div>
          </div>

          {activeView === "history" ? (
            <DateNavigator
              selectedDate={selectedDate}
              dateFormat={settings.dateFormat}
              searchActive={searchActive}
              onChange={changeDate}
            />
          ) : null}
        </header>

        <main className={activeView === "export" ? "main export-main" : "main"}>
          {activeView === "export" ? (
            <ExportView stats={stats} />
          ) : (
            <section className="content-div history-view">
              <header className="history-heading">
                <div>
                  <p>{searchActive ? t.searchResultsEyebrow : t.browsingHistoryEyebrow}</p>
                  <h1>{searchActive ? `“${deferredQuery}”` : formatDayHeading(selectedDate, settings.dateFormat, settings.language)}</h1>
                </div>
                <span>{mergedMode ? t.urlCount(items.length) : t.visitCount(items.length)}</span>
              </header>

              {!loading && items.length === 0 ? (
                <div className="empty-state">
                  <Search aria-hidden="true" />
                  <h2>{t.noVisits}</h2>
                  <p>{searchActive ? t.tryDifferentSearch : t.noArchiveForDate}</p>
                </div>
              ) : (
                <Timeline
                  items={items}
                  dateFormat={settings.dateFormat}
                  searchActive={searchActive}
                  linkDisplay={settings.linkDisplay}
                  onSearchDomain={searchDomain}
                />
              )}

              {loading ? <div className="list-loader"><span /><span /><span />{t.loadingArchive}</div> : null}
              <div ref={sentinelRef} className="load-sentinel" aria-hidden="true" />
            </section>
          )}
        </main>
      </div>
      </div>
    </LanguageProvider>
  );
}
