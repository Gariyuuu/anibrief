import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "What's New" };

interface Release {
  version: string;
  title: string;
  body: string[];
}

function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  const lines = markdown.split("\n");
  let current: Release | null = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(\S+)\s*(?:—|-)?\s*(.*)$/);
    if (heading) {
      if (current) releases.push(current);
      current = { version: heading[1], title: heading[2] || "", body: [] };
      continue;
    }
    if (current && line.trim()) current.body.push(line);
  }
  if (current) releases.push(current);
  return releases;
}

export default async function WhatsNewPage() {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  let releases: Release[] = [];
  try {
    const raw = await readFile(changelogPath, "utf-8");
    releases = parseChangelog(raw);
  } catch {
    releases = [];
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What&apos;s New</h1>
        <p className="mt-1 text-sm text-muted">Release notes for AniBrief, generated from CHANGELOG.md.</p>
      </div>
      {releases.length === 0 ? (
        <p className="text-sm text-muted">No changelog entries found.</p>
      ) : (
        releases.map((release) => (
          <Card key={release.version} className="p-5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">{release.version}</h2>
              {release.title && <span className="text-sm text-muted">{release.title}</span>}
            </div>
            <div className="prose-sm mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {release.body.join("\n")}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
