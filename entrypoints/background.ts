import { browser } from "wxt/browser";
import {
  getMeta,
  openArchiveDatabase,
  putVisits,
  setMeta,
} from "../lib/archive-db";
import type { ArchiveVisit } from "../lib/types";

const SYNC_ALARM = "infinite-history-sync";
const BACKFILL_PAGE_SIZE = 500;
const BACKFILL_PAGES_PER_CYCLE = 3;
const RECENT_OVERLAP_MS = 10 * 60 * 1000;
const INITIAL_RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
const CAPTURE_CONCURRENCY = 8;

let activeSync: Promise<void> | undefined;

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLocaleLowerCase();
  } catch {
    return "";
  }
}

function toArchiveRecord(
  historyItem: Browser.history.HistoryItem,
  visit: Browser.history.VisitItem,
): ArchiveVisit {
  const visitTime = Number(visit.visitTime ?? historyItem.lastVisitTime ?? Date.now());
  const visitId = String(visit.visitId ?? "");
  const historyId = String(visit.id ?? historyItem.id ?? "");

  return {
    id: `${visitId || historyId}@${Math.round(visitTime)}`,
    visitId,
    historyId,
    url: historyItem.url ?? "",
    title: historyItem.title || historyItem.url || "Untitled",
    domain: domainFromUrl(historyItem.url ?? ""),
    visitTime,
    referringVisitId: String(visit.referringVisitId ?? ""),
    transition: visit.transition ?? "link",
    typedCount: Number(historyItem.typedCount ?? 0),
    capturedAt: Date.now(),
  };
}

async function captureHistoryItem(
  historyItem: Browser.history.HistoryItem,
  sinceTime = 0,
): Promise<number> {
  if (!historyItem.url) return 0;
  const visits = await browser.history.getVisits({ url: historyItem.url });
  return putVisits(
    visits
      .filter((visit) => Number(visit.visitTime) >= sinceTime)
      .map((visit) => toArchiveRecord(historyItem, visit)),
  );
}

async function processHistoryItems(
  items: Browser.history.HistoryItem[],
  sinceTime = 0,
): Promise<number> {
  if (!items.length) return 0;
  let nextIndex = 0;
  let inserted = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      if (!item) continue;
      try {
        inserted += await captureHistoryItem(item, sinceTime);
      } catch (error) {
        console.warn("[Infinite History] Failed to archive URL", item.url, error);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CAPTURE_CONCURRENCY, items.length) }, () => worker()),
  );
  return inserted;
}

async function syncRecentHistory(): Promise<void> {
  const now = Date.now();
  const lastScanAt = await getMeta("lastRecentScanAt", now - INITIAL_RECENT_WINDOW_MS);
  const startTime = Math.max(0, Number(lastScanAt) - RECENT_OVERLAP_MS);
  const items = await browser.history.search({
    text: "",
    startTime,
    endTime: now,
    maxResults: 10000,
  });
  await processHistoryItems(items, startTime);
  await setMeta("lastRecentScanAt", now);
}

async function backfillHistoryPage(): Promise<boolean> {
  if (await getMeta("backfillComplete", false)) return true;

  const cursor = Number(await getMeta("backfillCursor", Date.now()));
  const items = await browser.history.search({
    text: "",
    startTime: 0,
    endTime: cursor,
    maxResults: BACKFILL_PAGE_SIZE,
  });

  if (!items.length) {
    await setMeta("backfillComplete", true);
    await setMeta("backfillCompletedAt", Date.now());
    return true;
  }

  await processHistoryItems(items);
  await setMeta("backfillPages", (await getMeta("backfillPages", 0)) + 1);

  if (items.length < BACKFILL_PAGE_SIZE) {
    await setMeta("backfillComplete", true);
    await setMeta("backfillCompletedAt", Date.now());
    return true;
  }

  const times = items
    .map((item) => Number(item.lastVisitTime))
    .filter(Number.isFinite);
  const oldestLastVisit = times.length ? Math.min(...times) : Number.NaN;
  if (!Number.isFinite(oldestLastVisit) || oldestLastVisit <= 0 || oldestLastVisit >= cursor) {
    await setMeta("backfillComplete", true);
    await setMeta("backfillCompletedAt", Date.now());
    return true;
  }

  await setMeta("backfillCursor", oldestLastVisit - 1);
  return false;
}

async function backfillHistory(): Promise<void> {
  for (let page = 0; page < BACKFILL_PAGES_PER_CYCLE; page += 1) {
    if (await backfillHistoryPage()) break;
  }
}

function notifyArchiveUpdated(): void {
  browser.runtime.sendMessage({ type: "infiniteHistory:archiveUpdated" }).catch(() => undefined);
}

function runSyncCycle(): Promise<void> {
  if (activeSync) return activeSync;

  activeSync = (async () => {
    await openArchiveDatabase();
    await syncRecentHistory();
    await backfillHistory();
    await setMeta("lastSuccessfulSyncAt", Date.now());
    notifyArchiveUpdated();
  })()
    .catch((error) => {
      console.error("[Infinite History] Sync failed", error);
      throw error;
    })
    .finally(() => {
      activeSync = undefined;
    });
  return activeSync;
}

function ensureAlarm(): void {
  browser.alarms.create(SYNC_ALARM, { periodInMinutes: 1 });
}

async function configureToolbarAction(): Promise<void> {
  await browser.action.setPopup({ popup: "" });
}

export default defineBackground(() => {
  browser.history.onVisited.addListener((historyItem) => {
    const sinceTime = Math.max(0, Number(historyItem.lastVisitTime ?? Date.now()) - 5000);
    captureHistoryItem(historyItem, sinceTime)
      .then((inserted) => {
        if (inserted > 0) notifyArchiveUpdated();
      })
      .catch((error) => console.error("[Infinite History] Real-time capture failed", error));
  });

  // Browser deletion and retention cleanup are intentionally ignored so the
  // independent archive can never be removed by a browser-side cleanup event.

  browser.runtime.onInstalled.addListener(() => {
    configureToolbarAction().catch((error) => {
      console.error("[Infinite History] Failed to clear toolbar popup", error);
    });
    ensureAlarm();
    runSyncCycle().catch(() => undefined);
  });

  browser.runtime.onStartup.addListener(() => {
    configureToolbarAction().catch((error) => {
      console.error("[Infinite History] Failed to clear toolbar popup", error);
    });
    ensureAlarm();
    runSyncCycle().catch(() => undefined);
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SYNC_ALARM) runSyncCycle().catch(() => undefined);
  });

  browser.action.onClicked.addListener(() => {
    browser.tabs.create({ url: "chrome://history/" });
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type !== "infiniteHistory:syncNow") return undefined;
    return runSyncCycle()
      .then(() => ({ success: true }))
      .catch((error: Error) => ({ success: false, error: error.message }));
  });

  ensureAlarm();
  configureToolbarAction().catch((error) => {
    console.error("[Infinite History] Failed to clear toolbar popup", error);
  });
  openArchiveDatabase().catch((error) => {
    console.error("[Infinite History] Database initialization failed", error);
  });
});
