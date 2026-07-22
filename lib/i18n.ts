import { createContext, useContext } from "react";
import type {
  DateFormat,
  LinkDisplayMode,
  ThemeMode,
  UiDensity,
  UiLanguage,
} from "./types";

interface LocalizedOption {
  label: string;
  detail: string;
}

export interface Messages {
  languageLabel: string;
  languageTargetCode: string;
  switchLanguage: string;
  mainNavigation: string;
  historyNav: string;
  searchNav: string;
  exportNav: string;
  settingsNav: string;
  archiveTitle(count: number): string;
  archiveCaughtUp: string;
  archiveBackfilling: string;
  searchPlaceholder: string;
  clearSearch: string;
  readOnlyArchive: string;
  syncing: string;
  syncNow: string;
  searchResultsEyebrow: string;
  browsingHistoryEyebrow: string;
  urlCount(count: number): string;
  visitCount(count: number): string;
  noVisits: string;
  tryDifferentSearch: string;
  noArchiveForDate: string;
  loadingArchive: string;
  today: string;
  yesterday: string;
  searchScopeNote: string;
  previousDay: string;
  nextDay: string;
  sameLinkVisits(count: number): string;
  readOnlyActions: string;
  searchDomain: string;
  domain: string;
  copyLink: string;
  copied: string;
  copy: string;
  openPage: string;
  open: string;
  timeBlockCount(count: number): string;
  settingsEyebrow: string;
  settingsTitle: string;
  closeSettings: string;
  themeSection: string;
  densitySection: string;
  dateFormatSection: string;
  linkDisplaySection: string;
  themeOptions: Record<ThemeMode, LocalizedOption>;
  densityOptions: Record<UiDensity, LocalizedOption>;
  dateOptions: Record<DateFormat, LocalizedOption>;
  linkDisplayOptions: Record<LinkDisplayMode, LocalizedOption>;
  settingsFooter: string;
  exportEyebrow: string;
  exportTitle: string;
  exportDescription: string;
  localVisitTotal: string;
  exportRange: string;
  allArchive: string;
  customDates: string;
  startDate: string;
  endDate: string;
  allArchiveHelp: string;
  fileFormat: string;
  jsonDetail: string;
  csvDetail: string;
  exportReady: string;
  exportPreparing: string;
  exportProgress(count: number): string;
  exportComplete(count: number): string;
  exportCancelled: string;
  exportFailed(message: string): string;
  unknownError: string;
  exportSafetyNote: string;
  exporting: string;
  exportButton(format: string): string;
  exportFileDescription: string;
}

function numberFor(count: number, language: UiLanguage): string {
  return count.toLocaleString(language === "en" ? "en-US" : "zh-CN");
}

function englishCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${numberFor(count, "en")} ${count === 1 ? singular : plural}`;
}

const zhMessages: Messages = {
  languageLabel: "语言",
  languageTargetCode: "EN",
  switchLanguage: "切换到英文",
  mainNavigation: "主导航",
  historyNav: "历史记录",
  searchNav: "搜索",
  exportNav: "导出",
  settingsNav: "设置",
  archiveTitle: (count) => `本地已归档 ${numberFor(count, "zh-CN")} 次访问`,
  archiveCaughtUp: "归档已追平",
  archiveBackfilling: "正在回填",
  searchPlaceholder: "搜索标题或网址",
  clearSearch: "清空搜索",
  readOnlyArchive: "只读归档",
  syncing: "补录中",
  syncNow: "立即补录",
  searchResultsEyebrow: "SEARCH RESULTS",
  browsingHistoryEyebrow: "BROWSING HISTORY",
  urlCount: (count) => `${numberFor(count, "zh-CN")} 个网址`,
  visitCount: (count) => `${numberFor(count, "zh-CN")} 次访问`,
  noVisits: "没有找到访问记录",
  tryDifferentSearch: "尝试更换关键词。",
  noArchiveForDate: "该日期暂时没有本地归档。",
  loadingArchive: "正在读取本地归档",
  today: "今天",
  yesterday: "昨天",
  searchScopeNote: "正在搜索全部本地归档。清空关键词后恢复日期时间线。",
  previousDay: "前一天",
  nextDay: "后一天",
  sameLinkVisits: (count) => `此链接当天访问 ${numberFor(count, "zh-CN")} 次`,
  readOnlyActions: "只读操作",
  searchDomain: "搜索此域名",
  domain: "域名",
  copyLink: "复制链接",
  copied: "已复制",
  copy: "复制",
  openPage: "打开页面",
  open: "打开",
  timeBlockCount: (count) => `${numberFor(count, "zh-CN")} 个时段`,
  settingsEyebrow: "SETTINGS",
  settingsTitle: "界面设置",
  closeSettings: "关闭设置",
  themeSection: "主题",
  densitySection: "列表密度",
  dateFormatSection: "日期格式",
  linkDisplaySection: "链接显示",
  themeOptions: {
    system: { label: "跟随系统", detail: "自动匹配浏览器主题" },
    light: { label: "浅色", detail: "使用明亮的浅色界面" },
    dark: { label: "深色", detail: "使用低亮度深色界面" },
  },
  densityOptions: {
    compact: { label: "紧凑", detail: "缩小行距，一屏显示更多记录" },
    comfortable: { label: "舒适", detail: "增加行距和点击区域" },
  },
  dateOptions: {
    localized: { label: "本地日期", detail: "例如 7月19日 星期日" },
    iso: { label: "ISO 日期", detail: "例如 2026-07-19" },
  },
  linkDisplayOptions: {
    merged: { label: "一天内同链接合并", detail: "同一天同一网址只显示一行，并标注访问次数" },
    independent: { label: "独立显示", detail: "每一次访问单独一行，按各自时间排列" },
  },
  settingsFooter: "所有设置仅保存在本机。扩展不提供历史删除和自动清理功能。",
  exportEyebrow: "EXPORT",
  exportTitle: "导出浏览历史",
  exportDescription: "导出内容来自本地无限归档，不受 Chrome 90 天记录限制。",
  localVisitTotal: "本地逐次访问",
  exportRange: "导出范围",
  allArchive: "全部归档",
  customDates: "自定义日期",
  startDate: "开始日期",
  endDate: "结束日期",
  allArchiveHelp: "将读取 IndexedDB 中保存的全部逐次访问记录。",
  fileFormat: "文件格式",
  jsonDetail: "保留完整字段，适合备份和二次处理",
  csvDetail: "适合 Excel、表格分析和快速查看",
  exportReady: "准备导出",
  exportPreparing: "正在准备导出...",
  exportProgress: (count) => `正在导出 ${numberFor(count, "zh-CN")} 条记录`,
  exportComplete: (count) => `导出完成，共 ${numberFor(count, "zh-CN")} 条记录`,
  exportCancelled: "已取消导出",
  exportFailed: (message) => `导出失败：${message}`,
  unknownError: "未知错误",
  exportSafetyNote: "导出不会修改、清理或标记浏览器原始历史。",
  exporting: "正在导出",
  exportButton: (format) => `导出 ${format}`,
  exportFileDescription: "Infinite History 导出文件",
};

const enMessages: Messages = {
  languageLabel: "Language",
  languageTargetCode: "中",
  switchLanguage: "Switch to Chinese",
  mainNavigation: "Main navigation",
  historyNav: "History",
  searchNav: "Search",
  exportNav: "Export",
  settingsNav: "Settings",
  archiveTitle: (count) => `${englishCount(count, "visit")} archived locally`,
  archiveCaughtUp: "Archive up to date",
  archiveBackfilling: "Backfilling archive",
  searchPlaceholder: "Search titles or URLs",
  clearSearch: "Clear search",
  readOnlyArchive: "Read-only archive",
  syncing: "Syncing",
  syncNow: "Sync now",
  searchResultsEyebrow: "SEARCH RESULTS",
  browsingHistoryEyebrow: "BROWSING HISTORY",
  urlCount: (count) => englishCount(count, "URL"),
  visitCount: (count) => englishCount(count, "visit"),
  noVisits: "No visits found",
  tryDifferentSearch: "Try a different search term.",
  noArchiveForDate: "There are no local archive entries for this date.",
  loadingArchive: "Loading local archive",
  today: "Today",
  yesterday: "Yesterday",
  searchScopeNote: "Searching the entire local archive. Clear the query to return to the date timeline.",
  previousDay: "Previous day",
  nextDay: "Next day",
  sameLinkVisits: (count) => `Visited this link ${englishCount(count, "time")} that day`,
  readOnlyActions: "Read-only actions",
  searchDomain: "Search this domain",
  domain: "Domain",
  copyLink: "Copy link",
  copied: "Copied",
  copy: "Copy",
  openPage: "Open page",
  open: "Open",
  timeBlockCount: (count) => englishCount(count, "time block"),
  settingsEyebrow: "SETTINGS",
  settingsTitle: "Interface settings",
  closeSettings: "Close settings",
  themeSection: "Theme",
  densitySection: "List density",
  dateFormatSection: "Date format",
  linkDisplaySection: "Link display",
  themeOptions: {
    system: { label: "System", detail: "Match the browser theme automatically" },
    light: { label: "Light", detail: "Use the bright interface" },
    dark: { label: "Dark", detail: "Use the low-light interface" },
  },
  densityOptions: {
    compact: { label: "Compact", detail: "Fit more history into each screen" },
    comfortable: { label: "Comfortable", detail: "Increase spacing and click targets" },
  },
  dateOptions: {
    localized: { label: "Localized date", detail: "Example: Sunday, July 19" },
    iso: { label: "ISO date", detail: "Example: 2026-07-19" },
  },
  linkDisplayOptions: {
    merged: { label: "Merge same-day links", detail: "Show one row per URL each day with its visit count" },
    independent: { label: "Show every visit", detail: "List each visit separately at its exact time" },
  },
  settingsFooter: "All settings stay on this device. The extension never deletes or automatically clears history.",
  exportEyebrow: "EXPORT",
  exportTitle: "Export browsing history",
  exportDescription: "Export from the unlimited local archive, beyond Chrome's 90-day history window.",
  localVisitTotal: "Individual local visits",
  exportRange: "Export range",
  allArchive: "Entire archive",
  customDates: "Custom dates",
  startDate: "Start date",
  endDate: "End date",
  allArchiveHelp: "This reads every individual visit stored in IndexedDB.",
  fileFormat: "File format",
  jsonDetail: "Preserves every field for backups and further processing",
  csvDetail: "Best for Excel, analysis, and quick review",
  exportReady: "Ready to export",
  exportPreparing: "Preparing export...",
  exportProgress: (count) => `Exporting ${englishCount(count, "record")}`,
  exportComplete: (count) => `Export complete: ${englishCount(count, "record")}`,
  exportCancelled: "Export cancelled",
  exportFailed: (message) => `Export failed: ${message}`,
  unknownError: "Unknown error",
  exportSafetyNote: "Exporting never modifies, clears, or marks the browser's original history.",
  exporting: "Exporting",
  exportButton: (format) => `Export ${format}`,
  exportFileDescription: "Infinite History export file",
};

const messageSets: Record<UiLanguage, Messages> = {
  "zh-CN": zhMessages,
  en: enMessages,
};

const LanguageContext = createContext<UiLanguage>("zh-CN");

export const LanguageProvider = LanguageContext.Provider;

export function getMessages(language: UiLanguage): Messages {
  return messageSets[language];
}

export function localeFor(language: UiLanguage): string {
  return language === "en" ? "en-US" : "zh-CN";
}

export function formatNumber(value: number, language: UiLanguage): string {
  return numberFor(value, language);
}

export function useI18n(): { language: UiLanguage; locale: string; t: Messages } {
  const language = useContext(LanguageContext);
  return { language, locale: localeFor(language), t: getMessages(language) };
}
