import { toDayKey } from "./date-utils";
import type {
  ArchiveCursor,
  ArchiveStats,
  ArchiveVisit,
  DailyUrlSummary,
  SummaryQuery,
  SummaryQueryResult,
  VisitQuery,
  VisitQueryResult,
} from "./types";

const DB_NAME = "betterHistoryInfinite";
const DB_VERSION = 1;
const VISITS_STORE = "visits";
const SUMMARIES_STORE = "dailyUrlSummaries";
const META_STORE = "meta";
const HIGH_STRING_KEY = "\uffff";

let databasePromise: Promise<IDBDatabase> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export function openArchiveDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(VISITS_STORE)) {
        const visits = database.createObjectStore(VISITS_STORE, { keyPath: "id" });
        visits.createIndex("visitTime", "visitTime", { unique: false });
        visits.createIndex("visitOrder", ["visitTime", "id"], { unique: true });
        visits.createIndex("url", "url", { unique: false });
        visits.createIndex("domain", "domain", { unique: false });
        visits.createIndex("visitId", "visitId", { unique: false });
      }

      if (!database.objectStoreNames.contains(SUMMARIES_STORE)) {
        const summaries = database.createObjectStore(SUMMARIES_STORE, { keyPath: "id" });
        summaries.createIndex("lastVisitOrder", ["lastVisitTime", "id"], { unique: true });
        summaries.createIndex("dayKey", "dayKey", { unique: false });
        summaries.createIndex("domain", "domain", { unique: false });
      }

      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error);
    };
  });

  return databasePromise;
}

async function findExistingVisitIds(database: IDBDatabase, records: ArchiveVisit[]): Promise<Set<string>> {
  const transaction = database.transaction(VISITS_STORE, "readonly");
  const store = transaction.objectStore(VISITS_STORE);
  const existing = new Set<string>();
  const completion = transactionToPromise(transaction);

  await Promise.all(records.map(async (record) => {
    const key = await requestToPromise(store.getKey(record.id));
    if (key !== undefined) existing.add(record.id);
  }));
  await completion;
  return existing;
}

interface SummaryDelta {
  id: string;
  dayKey: string;
  url: string;
  title: string;
  domain: string;
  firstVisitTime: number;
  lastVisitTime: number;
  transition: string;
  newVisitCount: number;
  batchVisitCount: number;
}

function createSummaryDeltas(records: ArchiveVisit[], existingIds: Set<string>): SummaryDelta[] {
  const deltas = new Map<string, SummaryDelta>();

  for (const record of records) {
    const dayKey = toDayKey(record.visitTime);
    const id = `${dayKey}|${record.url}`;
    const current = deltas.get(id);
    const newVisitCount = existingIds.has(record.id) ? 0 : 1;

    if (!current) {
      deltas.set(id, {
        id,
        dayKey,
        url: record.url,
        title: record.title,
        domain: record.domain,
        firstVisitTime: record.visitTime,
        lastVisitTime: record.visitTime,
        transition: record.transition,
        newVisitCount,
        batchVisitCount: 1,
      });
      continue;
    }

    current.firstVisitTime = Math.min(current.firstVisitTime, record.visitTime);
    if (record.visitTime >= current.lastVisitTime) {
      current.lastVisitTime = record.visitTime;
      current.title = record.title;
      current.transition = record.transition;
    }
    current.newVisitCount += newVisitCount;
    current.batchVisitCount += 1;
  }

  return [...deltas.values()];
}

async function writeVisits(database: IDBDatabase, records: ArchiveVisit[]): Promise<void> {
  const transaction = database.transaction(VISITS_STORE, "readwrite");
  const store = transaction.objectStore(VISITS_STORE);
  for (const record of records) store.put(record);
  await transactionToPromise(transaction);
}

async function updateSummaries(database: IDBDatabase, deltas: SummaryDelta[]): Promise<void> {
  if (!deltas.length) return;

  const transaction = database.transaction(SUMMARIES_STORE, "readwrite");
  const store = transaction.objectStore(SUMMARIES_STORE);

  for (const delta of deltas) {
    const request = store.get(delta.id);
    request.onsuccess = () => {
      const existing = request.result as DailyUrlSummary | undefined;
      const summary: DailyUrlSummary = existing
        ? {
            ...existing,
            title: delta.lastVisitTime >= existing.lastVisitTime ? delta.title : existing.title,
            domain: delta.domain || existing.domain,
            firstVisitTime: Math.min(existing.firstVisitTime, delta.firstVisitTime),
            lastVisitTime: Math.max(existing.lastVisitTime, delta.lastVisitTime),
            visitCount: existing.visitCount + delta.newVisitCount,
            transition: delta.lastVisitTime >= existing.lastVisitTime
              ? delta.transition
              : existing.transition,
            updatedAt: Date.now(),
          }
        : {
            id: delta.id,
            dayKey: delta.dayKey,
            url: delta.url,
            title: delta.title,
            domain: delta.domain,
            firstVisitTime: delta.firstVisitTime,
            lastVisitTime: delta.lastVisitTime,
            visitCount: Math.max(delta.newVisitCount, delta.batchVisitCount),
            transition: delta.transition,
            updatedAt: Date.now(),
          };
      store.put(summary);
    };
  }

  await transactionToPromise(transaction);
}

async function performPutVisits(records: ArchiveVisit[]): Promise<number> {
  if (!records.length) return 0;

  const database = await openArchiveDatabase();
  const existingIds = await findExistingVisitIds(database, records);
  const deltas = createSummaryDeltas(records, existingIds);
  await writeVisits(database, records);
  await updateSummaries(database, deltas);
  return records.length - existingIds.size;
}

export function putVisits(records: ArchiveVisit[]): Promise<number> {
  const operation = writeQueue
    .catch(() => undefined)
    .then(() => performPutVisits(records));
  writeQueue = operation;
  return operation;
}

export async function getMeta<T>(key: string, fallbackValue: T): Promise<T> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(META_STORE, "readonly");
  const record = await requestToPromise(transaction.objectStore(META_STORE).get(key));
  return record ? (record.value as T) : fallbackValue;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(META_STORE, "readwrite");
  transaction.objectStore(META_STORE).put({ key, value, updatedAt: Date.now() });
  await transactionToPromise(transaction);
}

function matchesSummary(summary: DailyUrlSummary, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [summary.title, summary.url, summary.domain]
    .some((value) => value.toLocaleLowerCase().includes(normalized));
}

function matchesVisit(visit: ArchiveVisit, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [visit.title, visit.url, visit.domain]
    .some((value) => value.toLocaleLowerCase().includes(normalized));
}

export async function queryDailySummaries({
  query = "",
  startTime = 0,
  endTime = Number.MAX_SAFE_INTEGER,
  limit = 100,
  cursor = null,
}: SummaryQuery = {}): Promise<SummaryQueryResult> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(SUMMARIES_STORE, "readonly");
  const index = transaction.objectStore(SUMMARIES_STORE).index("lastVisitOrder");
  const lower: ArchiveCursor = [Math.max(0, startTime), ""];
  const upper: ArchiveCursor = cursor ?? [Math.min(Number.MAX_SAFE_INTEGER, endTime), HIGH_STRING_KEY];

  if (upper[0] < lower[0]) return { items: [], nextCursor: null };

  const range = IDBKeyRange.bound(lower, upper, false, cursor !== null);
  return new Promise((resolve, reject) => {
    const items: DailyUrlSummary[] = [];
    let nextCursor: ArchiveCursor | null = null;
    const request = index.openCursor(range, "prev");

    request.onsuccess = () => {
      const current = request.result;
      if (!current) {
        resolve({ items, nextCursor: null });
        return;
      }

      const summary = current.value as DailyUrlSummary;
      if (matchesSummary(summary, query)) {
        items.push(summary);
        nextCursor = current.key as ArchiveCursor;
        if (items.length >= limit) {
          resolve({ items, nextCursor });
          return;
        }
      }
      current.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function queryVisits({
  query = "",
  startTime = 0,
  endTime = Number.MAX_SAFE_INTEGER,
  limit = 1000,
  cursor = null,
}: VisitQuery = {}): Promise<VisitQueryResult> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(VISITS_STORE, "readonly");
  const index = transaction.objectStore(VISITS_STORE).index("visitOrder");
  const lower: ArchiveCursor = [Math.max(0, startTime), ""];
  const upper: ArchiveCursor = cursor ?? [Math.min(Number.MAX_SAFE_INTEGER, endTime), HIGH_STRING_KEY];

  if (upper[0] < lower[0]) return { items: [], nextCursor: null };

  const range = IDBKeyRange.bound(lower, upper, false, cursor !== null);
  return new Promise((resolve, reject) => {
    const items: ArchiveVisit[] = [];
    let nextCursor: ArchiveCursor | null = null;
    const request = index.openCursor(range, "prev");

    request.onsuccess = () => {
      const current = request.result;
      if (!current) {
        resolve({ items, nextCursor: null });
        return;
      }

      const visit = current.value as ArchiveVisit;
      if (matchesVisit(visit, query)) {
        items.push(visit);
        nextCursor = current.key as ArchiveCursor;
        if (items.length >= limit) {
          resolve({ items, nextCursor });
          return;
        }
      }
      current.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function iterateVisitBatches(
  query: Omit<VisitQuery, "limit" | "cursor">,
  onBatch: (records: ArchiveVisit[], totalBeforeBatch: number) => Promise<void>,
  batchSize = 1000,
): Promise<number> {
  let cursor: ArchiveCursor | null = null;
  let total = 0;

  while (true) {
    const result = await queryVisits({ ...query, cursor, limit: batchSize });
    if (!result.items.length) break;
    await onBatch(result.items, total);
    total += result.items.length;
    if (!result.nextCursor || result.items.length < batchSize) break;
    cursor = result.nextCursor;
  }
  return total;
}

async function countStore(storeName: string): Promise<number> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(storeName, "readonly");
  return requestToPromise(transaction.objectStore(storeName).count());
}

async function getVisitBoundary(direction: IDBCursorDirection): Promise<ArchiveVisit | null> {
  const database = await openArchiveDatabase();
  const transaction = database.transaction(VISITS_STORE, "readonly");
  const cursor = await requestToPromise(
    transaction.objectStore(VISITS_STORE).index("visitOrder").openCursor(null, direction),
  );
  return cursor ? (cursor.value as ArchiveVisit) : null;
}

export async function getArchiveStats(): Promise<ArchiveStats> {
  const [
    visitCount,
    summaryCount,
    earliestVisit,
    latestVisit,
    backfillComplete,
    backfillPages,
    lastSuccessfulSyncAt,
  ] = await Promise.all([
    countStore(VISITS_STORE),
    countStore(SUMMARIES_STORE),
    getVisitBoundary("next"),
    getVisitBoundary("prev"),
    getMeta("backfillComplete", false),
    getMeta("backfillPages", 0),
    getMeta<number | null>("lastSuccessfulSyncAt", null),
  ]);

  return {
    visitCount,
    summaryCount,
    earliestVisit,
    latestVisit,
    backfillComplete,
    backfillPages,
    lastSuccessfulSyncAt,
  };
}
