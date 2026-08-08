# Infinite History

Search Keywords: unlimited history, unlimited history extension, unlimited history plugin, unlimited browser history, Chrome unlimited history, Edge unlimited history, Chrome/Edge unlimited history extension, history only keeps 90 days, history disappears after 90 days, history auto deleted, history cleared, browser history missing, history limit, bypass history limit, history permanently saved, history stored locally, history backup, history export, history export CSV, history export JSON, history visits merged. 无限历史记录, 无限历史记录扩展, 无限历史记录插件, 浏览器无限历史记录, Chrome 无限历史记录, Edge 无限历史记录, Chrome/Edge 无限历史记录扩展, 历史记录只能保留90天, 历史记录90天后没了, 历史记录自动删除, 历史记录被清空了, 浏览器历史记录不见了, 历史记录上限, 历史记录突破上限, 历史记录永久保存, 历史记录本地保存, 历史记录备份, 历史记录导出, 历史记录导出CSV, 历史记录导出JSON, 历史记录合并显示.

[中文说明](README.md)

## About

This extension replaces `chrome://history/` with a local-first browsing-history archive. It records new visits in real time, backfills the history Chrome can still read in batches, and stores every visit independently in the extension's own IndexedDB. As long as the extension remains installed and its site data is retained, Chrome's native retention limits and cleanup actions do not directly remove archived records (see Safety Constraints below).

Archiving, search, date navigation, and export all run locally. The extension never uploads history and provides no deletion, blacklist, or automatic-cleanup features. Its archive design is informed by the Bilibili Infinite History extension ([mundane799699/bilibili-history-wxt](https://github.com/mundane799699/bilibili-history-wxt)).

## Core Purpose

- Extends Chrome and Edge history beyond the native limit, preventing the loss of searchable history after the browser's 90-day automatic cleanup.

## Features

- Replaces `chrome://history/`.
- Archives new visits in real time with `history.onVisited`.
- Backfills the Chrome history that is still available after installation, in batches.
- Stores every visit in IndexedDB and maintains daily URL summaries grouped by date and URL.
- Provides a fixed sidebar, date cards, date/hour groups, and compact visit rows.
- Merges repeated visits to the same URL on the same day while retaining every original visit in the archive.
- Supports global search, date browsing, and full or date-range JSON/CSV exports.
- Supports light and dark themes, compact and comfortable density, and localized or ISO date formats.
- Starts in Chinese. A dedicated sidebar control switches the entire interface between Chinese and English, and the selected language is stored locally.

## Safety Constraints

- Only uses `history.search`, `history.getVisits`, and `history.onVisited`.
- Does not listen for `history.onVisitRemoved`.
- Does not implement `deleteUrl`, `deleteRange`, `deleteAll`, or `browsingData`.
- Provides no UI for deletion, cleanup, blacklisting, or automatic cleanup.
- Clearing Chrome's own history does not remove the independent IndexedDB archive.

## Install From Release

1. Download `infinite-history-chrome-mv3-v1.0.0.zip` from the project's [Releases](../../releases).
2. Extract the ZIP file to any local directory.
3. Open `chrome://extensions/` in Chrome or `edge://extensions/` in Edge, then enable Developer mode.
4. Click **Load unpacked** and select the extracted directory that directly contains `manifest.json`.
5. After the extension loads, open `chrome://history/` to use Infinite History.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run compile
npm run build
```

The Chrome build directory is `.output/chrome-mv3`.

## Main Directories

- `entrypoints/background.ts`: Real-time collection, recent-history repair, and historical backfill.
- `entrypoints/history/`: The history-page entry point, state management, and UI styles.
- `components/`: Navigation, date controls, timeline, settings, and export views.
- `lib/archive-db.ts`: IndexedDB access, idempotent writes, and paginated queries.
- `lib/export-history.ts`: Streaming JSON/CSV export.
- `lib/i18n.ts`: Chinese and English copy, number formatting, and the language context.

"Unlimited" means the extension does not impose a visit-count or time limit. Actual capacity still depends on local disk space. Uninstalling the extension or clearing its site data deletes the IndexedDB archive, so regular exports are recommended for backup.
