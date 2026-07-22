import { iterateVisitBatches } from "./archive-db";
import { getMessages } from "./i18n";
import type { ArchiveVisit, UiLanguage } from "./types";

export type ExportFormat = "json" | "csv";

interface ExportOptions {
  format: ExportFormat;
  startTime: number;
  endTime: number;
  language: UiLanguage;
  onProgress?: (count: number) => void;
}

interface WritableOutput {
  write(chunk: string): Promise<void>;
  close(): Promise<void>;
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable(): Promise<{
      write(chunk: string): Promise<void>;
      close(): Promise<void>;
    }>;
  }>;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(record: ArchiveVisit): string {
  return [
    new Date(record.visitTime).toISOString(),
    record.title,
    record.url,
    record.domain,
    record.transition,
    record.visitId,
    record.referringVisitId,
  ].map(csvCell).join(",");
}

async function createOutput(
  filename: string,
  format: ExportFormat,
  language: UiLanguage,
): Promise<WritableOutput> {
  const pickerWindow = window as SaveFilePickerWindow;
  if (pickerWindow.showSaveFilePicker) {
    const mime = format === "json" ? "application/json" : "text/csv";
    const extension = format === "json" ? ".json" : ".csv";
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: getMessages(language).exportFileDescription, accept: { [mime]: [extension] } }],
    });
    const writable = await handle.createWritable();
    return {
      write: (chunk) => writable.write(chunk),
      close: () => writable.close(),
    };
  }

  const chunks: string[] = [];
  return {
    async write(chunk) {
      chunks.push(chunk);
    },
    async close() {
      const type = format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    },
  };
}

export async function exportHistory({
  format,
  startTime,
  endTime,
  language,
  onProgress = () => undefined,
}: ExportOptions): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `infinite-history-${date}.${format}`;
  const output = await createOutput(filename, format, language);
  let exported = 0;
  let firstJsonRecord = true;

  try {
    if (format === "json") {
      const metadata = {
        format: "InfiniteHistoryArchive",
        version: 1,
        exportedAt: new Date().toISOString(),
        range: { startTime, endTime },
      };
      await output.write(`${JSON.stringify(metadata).slice(0, -1)},\n  "visits": [\n`);
    } else {
      await output.write("\ufeffvisitTime,title,url,domain,transition,visitId,referringVisitId\r\n");
    }

    await iterateVisitBatches({ startTime, endTime }, async (records) => {
      if (format === "json") {
        const chunk = records
          .map((record) => `${firstJsonRecord ? "" : ",\n"}    ${JSON.stringify(record)}`)
          .join("");
        firstJsonRecord = false;
        await output.write(chunk);
      } else {
        await output.write(`${records.map(csvRow).join("\r\n")}\r\n`);
      }
      exported += records.length;
      onProgress(exported);
    });

    if (format === "json") await output.write("\n  ]\n}\n");
    await output.close();
    return exported;
  } catch (error) {
    try {
      await output.close();
    } catch {
      // Preserve the original export error.
    }
    throw error;
  }
}
