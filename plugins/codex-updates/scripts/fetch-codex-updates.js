#!/usr/bin/env node
const CHANGELOG_URL = "https://developers.openai.com/codex/changelog";

async function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf("--count");
  let count = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) || 3 : 3;
  console.log("Fetching Codex desktop app changelog...\n");
  const res = await fetch(CHANGELOG_URL);
  if (!res.ok) { console.error("Failed:", res.status, res.statusText); process.exit(1); }
  const html = await res.text();
  const releases = parseReleases(html);
  for (const rel of releases.slice(0, count)) {
    console.log(`\uD83D\uDCE6 Codex app ${rel.version}`);
    console.log("\u2500".repeat(40));
    if (rel.newFeatures) { console.log("\n  \u25B8 New features:"); rel.newFeatures.forEach(i => console.log("    \u2022 " + i)); }
    if (rel.bugFixes) { console.log("\n  \u25B8 Improvements & fixes:"); rel.bugFixes.forEach(i => console.log("    \u2022 " + i)); }
    console.log("");
  }
  console.log("Source: " + CHANGELOG_URL);
}

function parseReleases(html) {
  const sections = html.split(/<h2\b[^>]*>/);
  const releases = [];
  for (const section of sections) {
    if (!section.includes("Codex app")) continue;
    const h3Match = section.match(/<h3\b[^>]*>Codex app\s+([\d.]+)<\/h3>/);
    if (!h3Match) continue;
    const version = h3Match[1];
    const newFeatures = extract(section, "New features", "Performance improvements");
    const bugFixes = extract(section, "Performance improvements and bug fixes", "</h3>");
    releases.push({ version, newFeatures, bugFixes });
  }
  return releases;
}

function extract(html, startH, endH) {
  const si = html.indexOf(">" + startH + "<");
  if (si === -1) return null;
  const after = html.slice(si);
  const ei = after.indexOf(">" + endH + "<");
  const ce = ei > 0 ? ei : after.indexOf("</section>");
  const content = ce > 0 ? after.slice(0, ce) : after;
  const items = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const t = m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
    if (t) items.push(t);
  }
  return items.length > 0 ? items : null;
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
