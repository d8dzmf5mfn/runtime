#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const CHANGELOG_URL = "https://developers.openai.com/codex/changelog";

async function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf("--count");
  const count = countIdx >= 0 ? Number.parseInt(args[countIdx + 1], 10) : 3;
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("--count must be a positive integer");
  }
  console.log("Fetching Codex desktop app changelog...\n");
  const res = await fetch(CHANGELOG_URL);
  if (!res.ok) { console.error("Failed:", res.status, res.statusText); process.exit(1); }
  const html = await res.text();
  const releases = parseReleases(html);
  if (releases.length === 0) {
    throw new Error("No Codex app releases found; the changelog format may have changed");
  }
  for (const rel of releases.slice(0, count)) {
    console.log(`\uD83D\uDCE6 Codex app ${rel.version}`);
    console.log("\u2500".repeat(40));
    if (rel.newFeatures) { console.log("\n  \u25B8 New features:"); rel.newFeatures.forEach(i => console.log("    \u2022 " + i)); }
    if (rel.bugFixes) { console.log("\n  \u25B8 Improvements & fixes:"); rel.bugFixes.forEach(i => console.log("    \u2022 " + i)); }
    console.log("");
  }
  console.log("Source: " + CHANGELOG_URL);
}

export function parseReleases(html) {
  const entryStart = /<li\b[^>]*\bid="codex-[^"]+-app"[^>]*>/g;
  const starts = [...html.matchAll(entryStart)];
  const releases = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index].index;
    const end = starts[index + 1]?.index ?? html.length;
    const entry = html.slice(start, end);
    const heading = entry.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    const headingText = heading ? textContent(heading) : "";
    const version = headingText.match(/^Codex app(?: updates)?\s+([\d.]+)$/i)?.[1];
    if (!version) continue;

    const date = entry.match(/<time\b[^>]*>([\s\S]*?)<\/time>/)?.[1]?.trim();
    const article = entry.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? "";
    releases.push({
      version,
      date,
      newFeatures: extractSection(article, /^New features$/i),
      bugFixes: extractSection(article, /^(?:Performance improvements and bug fixes|Improvements and bug fixes)$/i),
    });
  }
  return releases;
}

function extractSection(article, headingPattern) {
  const headings = [...article.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
  const headingIndex = headings.findIndex((match) => headingPattern.test(textContent(match[1])));
  if (headingIndex === -1) return null;

  const start = headings[headingIndex].index + headings[headingIndex][0].length;
  const end = headings[headingIndex + 1]?.index ?? article.length;
  const content = article.slice(start, end);
  const items = [...content.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .map((match) => textContent(match[1]))
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function textContent(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([\da-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error("Error:", e.message); process.exit(1); });
}
