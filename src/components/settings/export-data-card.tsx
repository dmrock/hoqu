"use client";

import { useState } from "react";
import { exportDataAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { itemsToCsv } from "@/lib/export";

type ExportFormat = "json" | "csv";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportDataCard() {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setError(null);
    setDownloading(format);
    try {
      const res = await exportDataAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      if (format === "json") {
        triggerDownload(
          new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" }),
          `hoqu-export-${date}.json`,
        );
      } else {
        triggerDownload(
          new Blob([itemsToCsv(res.data.items)], { type: "text/csv" }),
          `hoqu-items-${date}.csv`,
        );
      }
    } catch {
      setError("Export failed. Try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Export your data</CardTitle>
        <CardDescription>
          Download everything you've logged. JSON is the full export — items, stats and
          achievements; CSV is a flat list of your items, one row per entry (seasons included).
        </CardDescription>
      </CardHeader>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => handleExport("json")} disabled={downloading !== null}>
          {downloading === "json" ? "Preparing…" : "Download JSON"}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport("csv")}
          disabled={downloading !== null}
        >
          {downloading === "csv" ? "Preparing…" : "Download CSV"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </Card>
  );
}
