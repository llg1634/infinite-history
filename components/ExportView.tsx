import { CalendarRange, CheckCircle2, Download, FileJson2, Sheet } from "lucide-react";
import { useState } from "react";
import { endOfDay, startOfDay } from "../lib/date-utils";
import { exportHistory, type ExportFormat } from "../lib/export-history";
import { formatNumber, useI18n } from "../lib/i18n";
import type { ArchiveStats } from "../lib/types";

interface ExportViewProps {
  stats: ArchiveStats | null;
}

type ExportStatus =
  | { kind: "ready" }
  | { kind: "preparing" }
  | { kind: "progress"; count: number }
  | { kind: "complete"; count: number }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

export function ExportView({ stats }: ExportViewProps) {
  const { language, t } = useI18n();
  const [scope, setScope] = useState<"all" | "custom">("all");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<ExportStatus>({ kind: "ready" });
  const [exporting, setExporting] = useState(false);

  async function runExport() {
    const startTime = scope === "custom" && from
      ? startOfDay(new Date(`${from}T00:00:00`))
      : 0;
    const endTime = scope === "custom" && to
      ? endOfDay(new Date(`${to}T00:00:00`))
      : Number.MAX_SAFE_INTEGER;

    setExporting(true);
    setStatus({ kind: "preparing" });
    try {
      const count = await exportHistory({
        format,
        startTime,
        endTime,
        language,
        onProgress: (current) => setStatus({ kind: "progress", count: current }),
      });
      setStatus({ kind: "complete", count });
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === "AbortError"
        ? { kind: "cancelled" }
        : { kind: "error", message: error instanceof Error ? error.message : t.unknownError });
    } finally {
      setExporting(false);
    }
  }

  let progress = t.exportReady;
  if (status.kind === "preparing") progress = t.exportPreparing;
  if (status.kind === "progress") progress = t.exportProgress(status.count);
  if (status.kind === "complete") progress = t.exportComplete(status.count);
  if (status.kind === "cancelled") progress = t.exportCancelled;
  if (status.kind === "error") progress = t.exportFailed(status.message);

  return (
    <section className="export-page content-div">
      <header className="page-heading">
        <div>
          <p>{t.exportEyebrow}</p>
          <h1>{t.exportTitle}</h1>
          <span>{t.exportDescription}</span>
        </div>
        <div className="export-total">
          <strong>{formatNumber(stats?.visitCount ?? 0, language)}</strong>
          <small>{t.localVisitTotal}</small>
        </div>
      </header>

      <div className="export-grid">
        <section className="export-card">
          <header><CalendarRange /><span>{t.exportRange}</span></header>
          <div className="segmented-control">
            <button className={scope === "all" ? "active" : ""} type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>
              {t.allArchive}
            </button>
            <button className={scope === "custom" ? "active" : ""} type="button" aria-pressed={scope === "custom"} onClick={() => setScope("custom")}>
              {t.customDates}
            </button>
          </div>
          {scope === "custom" ? (
            <div className="date-range-fields">
              <label>{t.startDate}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
              <label>{t.endDate}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
            </div>
          ) : (
            <p className="export-help">{t.allArchiveHelp}</p>
          )}
        </section>

        <section className="export-card">
          <header><Download /><span>{t.fileFormat}</span></header>
          <div className="format-options">
            <button className={format === "json" ? "active" : ""} type="button" aria-pressed={format === "json"} onClick={() => setFormat("json")}>
              <FileJson2 /><span><strong>JSON</strong><small>{t.jsonDetail}</small></span>
            </button>
            <button className={format === "csv" ? "active" : ""} type="button" aria-pressed={format === "csv"} onClick={() => setFormat("csv")}>
              <Sheet /><span><strong>CSV</strong><small>{t.csvDetail}</small></span>
            </button>
          </div>
        </section>
      </div>

      <section className="export-action-panel">
        <div>
          {status.kind === "complete" ? <CheckCircle2 className="complete-icon" /> : <Download />}
          <span><strong>{progress}</strong><small>{t.exportSafetyNote}</small></span>
        </div>
        <button className="export-btn" type="button" disabled={exporting} onClick={runExport}>
          {exporting ? t.exporting : t.exportButton(format.toUpperCase())}
        </button>
      </section>
    </section>
  );
}
