import {
  Clock3,
  Download,
  History,
  Languages,
  Search,
  Settings,
} from "lucide-react";
import { formatNumber, useI18n } from "../lib/i18n";
import type { AppView } from "../lib/types";

interface SidebarProps {
  activeView: AppView;
  archiveCount: number;
  backfillComplete: boolean;
  settingsOpen: boolean;
  onViewChange(view: AppView): void;
  onSearch(): void;
  onToggleLanguage(): void;
  onToggleSettings(): void;
  children?: React.ReactNode;
}

export function Sidebar({
  activeView,
  archiveCount,
  backfillComplete,
  settingsOpen,
  onViewChange,
  onSearch,
  onToggleLanguage,
  onToggleSettings,
  children,
}: SidebarProps) {
  const { language, t } = useI18n();

  return (
    <aside className="navigation" aria-label={t.mainNavigation}>
      <div className="brand-block">
        <span className="brand-icon"><Clock3 aria-hidden="true" /></span>
        <span className="brand-copy">
          <strong>Infinite</strong>
          <small>History</small>
        </span>
      </div>

      <nav className="nav-menu">
        <button
          className={activeView === "history" ? "active" : ""}
          type="button"
          onClick={() => onViewChange("history")}
        >
          <History className="icon" aria-hidden="true" />
          <span className="nav-label">{t.historyNav}</span>
        </button>
        <button type="button" onClick={onSearch}>
          <Search className="icon" aria-hidden="true" />
          <span className="nav-label">{t.searchNav}</span>
        </button>
        <button
          className={activeView === "export" ? "active" : ""}
          type="button"
          onClick={() => onViewChange("export")}
        >
          <Download className="icon" aria-hidden="true" />
          <span className="nav-label">{t.exportNav}</span>
        </button>
      </nav>

      <div className="nav-bottom">
        <div className="archive-mini-status" title={t.archiveTitle(archiveCount)}>
          <span className={backfillComplete ? "status-dot complete" : "status-dot"} />
          <div>
            <strong>{formatNumber(archiveCount, language)}</strong>
            <small>{backfillComplete ? t.archiveCaughtUp : t.archiveBackfilling}</small>
          </div>
        </div>
        <div className="sidebar-controls">
          <button
            className="language-button"
            type="button"
            aria-label={t.switchLanguage}
            title={t.switchLanguage}
            onClick={onToggleLanguage}
          >
            <Languages className="icon" aria-hidden="true" />
            <span className="nav-label">{t.languageLabel}</span>
            <span className="language-code" aria-hidden="true">{t.languageTargetCode}</span>
          </button>
          <div className="settings-anchor">
            <button
              className={settingsOpen ? "settings-button active" : "settings-button"}
              type="button"
              aria-label={t.settingsNav}
              title={t.settingsNav}
              aria-expanded={settingsOpen}
              onClick={onToggleSettings}
            >
              <Settings className="icon" aria-hidden="true" />
              <span className="nav-label">{t.settingsNav}</span>
            </button>
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
