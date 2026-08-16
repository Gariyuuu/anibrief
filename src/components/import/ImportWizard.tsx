"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, FileCheck2 } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { parseImportPreview, commitImport, type ImportRow, type ImportPreviewEntry } from "@/lib/actions/listImport";

const MAX_ROWS = 200;

/** Deliberately simple hand-written CSV split: newline then comma, header row detected by
 * matching known column names case-insensitively. Does NOT handle quoted fields containing
 * commas (e.g. `"Attack on Titan, Part 2"`) — that's called out in the UI copy below. */
function parseCsv(text: string): ImportRow[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const KNOWN_COLUMNS = ["title", "status", "progress", "score"] as const;
  const firstCells = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const hasHeader = firstCells.some((c) => (KNOWN_COLUMNS as readonly string[]).includes(c));

  let columnIndex: Record<(typeof KNOWN_COLUMNS)[number], number> = { title: 0, status: -1, progress: -1, score: -1 };
  let dataLines = lines;

  if (hasHeader) {
    columnIndex = { title: -1, status: -1, progress: -1, score: -1 };
    firstCells.forEach((cell, idx) => {
      if ((KNOWN_COLUMNS as readonly string[]).includes(cell)) {
        columnIndex[cell as (typeof KNOWN_COLUMNS)[number]] = idx;
      }
    });
    dataLines = lines.slice(1);
  }

  return dataLines
    .map((line): ImportRow => {
      const cells = line.split(",").map((c) => c.trim());
      const title = columnIndex.title >= 0 ? cells[columnIndex.title] ?? "" : cells[0] ?? "";
      const statusRaw = columnIndex.status >= 0 ? cells[columnIndex.status] : undefined;
      const progressRaw = columnIndex.progress >= 0 ? cells[columnIndex.progress] : undefined;
      const scoreRaw = columnIndex.score >= 0 ? cells[columnIndex.score] : undefined;
      return {
        title,
        status: statusRaw || undefined,
        progress: progressRaw ? Number(progressRaw) : undefined,
        score: scoreRaw ? Number(scoreRaw) : undefined,
      };
    })
    .filter((row) => row.title.length > 0);
}

function parseJson(text: string): ImportRow[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON file must contain an array of entries.");
  return data
    .map((entry): ImportRow | null => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      const title = typeof e.title === "string" ? e.title.trim() : "";
      if (!title) return null;
      return {
        title,
        status: typeof e.status === "string" ? e.status : undefined,
        progress: typeof e.progress === "number" ? e.progress : undefined,
        score: typeof e.score === "number" ? e.score : undefined,
      };
    })
    .filter((row): row is ImportRow => row !== null);
}

type Stage = "upload" | "preview" | "committed";

export function ImportWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewEntry[]>([]);
  const [commitResult, setCommitResult] = useState<{ committed: number; total: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setStage("upload");
    setFileName(null);
    setRows([]);
    setTruncated(false);
    setParseError(null);
    setJobId(null);
    setPreview([]);
    setCommitResult(null);
    setActionError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setActionError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith(".json");
      const parsed = isJson ? parseJson(text) : parseCsv(text);

      if (parsed.length === 0) {
        setParseError("No rows with a title could be parsed from this file.");
        setRows([]);
        return;
      }

      setTruncated(parsed.length > MAX_ROWS);
      setRows(parsed.slice(0, MAX_ROWS));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Couldn't parse that file.");
      setRows([]);
    }
  }

  function handleGeneratePreview() {
    if (rows.length === 0) return;
    const sourceType = fileName?.toLowerCase().endsWith(".json") ? "json" : "csv";
    setActionError(null);
    startTransition(async () => {
      try {
        const result = await parseImportPreview(rows, sourceType);
        setJobId(result.jobId);
        setPreview(result.preview);
        setStage("preview");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to generate preview.");
      }
    });
  }

  function handleCommit() {
    if (!jobId) return;
    setActionError(null);
    startTransition(async () => {
      try {
        const result = await commitImport(jobId);
        setCommitResult(result);
        setStage("committed");
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to commit import.");
      }
    });
  }

  const matchedCount = preview.filter((p) => p.confidence === "matched").length;

  return (
    <div className="flex flex-col gap-4">
      {stage === "upload" && (
        <Card className="flex flex-col gap-3 p-6">
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <UploadCloud className="h-8 w-8 text-muted" aria-hidden />
            <p className="text-sm font-medium text-foreground">Choose a CSV or JSON file</p>
            <p className="max-w-md text-xs text-muted">
              CSV: a header row with any of <code>title,status,progress,score</code> (in any order), or just one title
              per line. The parser is intentionally simple — it splits on commas and does not handle quoted fields
              containing commas. JSON: an array of <code>{"{ title, status, progress, score }"}</code> objects. Files
              are capped at {MAX_ROWS} rows per import to stay within AniList&apos;s search rate limits.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="mt-2 text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-raised file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
          </div>

          {parseError && <p className="text-xs text-negative">{parseError}</p>}

          {rows.length > 0 && !parseError && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-sm text-foreground">
                <FileCheck2 className="mr-1 inline h-3.5 w-3.5 text-positive" />
                Parsed {rows.length} row{rows.length === 1 ? "" : "s"} from <span className="font-medium">{fileName}</span>.
                {truncated && <span className="text-muted"> (file had more rows; only the first {MAX_ROWS} were kept)</span>}
              </p>
              {actionError && <p className="text-xs text-negative">{actionError}</p>}
              <div>
                <Button variant="primary" size="sm" disabled={pending} onClick={handleGeneratePreview}>
                  {pending && <ThinkingOrb state="searching" size={20} aria-label="Matching titles" />}
                  {pending ? "Matching titles…" : "Generate preview"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {stage === "preview" && (
        <Card className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {matchedCount} of {preview.length} row{preview.length === 1 ? "" : "s"} matched an AniList title.
            </p>
            <p className="text-xs text-muted">
              This is a one-time, best-effort text match — not a live sync. Review it below; only matched rows will be
              added to My List when you commit. Unmatched rows are skipped, not guessed at.
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Input title</th>
                  <th className="px-3 py-2">Matched to</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Progress</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Match</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{p.inputTitle}</td>
                    <td className="px-3 py-2 text-muted">{p.matchedTitle ?? "—"}</td>
                    <td className="px-3 py-2 text-muted">{p.status ?? "—"}</td>
                    <td className="px-3 py-2 text-muted">{p.progress ?? "—"}</td>
                    <td className="px-3 py-2 text-muted">{p.score ?? "—"}</td>
                    <td className="px-3 py-2">
                      {p.confidence === "matched" ? (
                        <Badge tone="positive">Matched</Badge>
                      ) : (
                        <Badge tone="neutral">No match</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {actionError && <p className="text-xs text-negative">{actionError}</p>}

          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={pending || matchedCount === 0} onClick={handleCommit}>
              {pending && <ThinkingOrb state="working" size={20} aria-label="Importing" />}
              {pending ? "Importing…" : `Commit import (${matchedCount})`}
            </Button>
            <Button variant="secondary" size="sm" disabled={pending} onClick={reset}>
              Start over
            </Button>
          </div>
        </Card>
      )}

      {stage === "committed" && commitResult && (
        <Card className="flex flex-col gap-3 p-6 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-positive" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Imported {commitResult.committed} of {commitResult.total} row{commitResult.total === 1 ? "" : "s"} to My
            List.
          </p>
          <p className="text-xs text-muted">
            This was a one-time import, not an ongoing sync — future changes on the source you exported from
            won&apos;t appear here automatically.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="primary" size="sm" href="/my-list">
              View My List
            </Button>
            <Button variant="secondary" size="sm" onClick={reset}>
              Import another file
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
