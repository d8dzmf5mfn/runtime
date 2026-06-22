import test from "node:test";
import assert from "node:assert/strict";

import { parseReleases } from "./fetch-codex-updates.js";

test("parses the current changelog entry structure", () => {
  const html = `
    <li id="codex-2026-06-18-app" data-codex-topics="codex-app">
      <time>2026-06-18</time>
      <h3><span>Codex app <span>26.616</span></span></h3>
      <article>
        <h3 id="new-features">New features</h3>
        <ul><li>Added <a href="/feature">Record &amp; Replay</a>.</li></ul>
        <h3 id="performance-improvements-and-bug-fixes">Performance improvements and bug fixes</h3>
        <ul><li>Improved reliability.</li></ul>
      </article>
    </li>`;

  assert.deepEqual(parseReleases(html), [{
    version: "26.616",
    date: "2026-06-18",
    newFeatures: ["Added Record & Replay."],
    bugFixes: ["Improved reliability."],
  }]);
});

test("ignores app announcements that are not versioned releases", () => {
  const html = `
    <li id="codex-2026-06-16-app" data-codex-topics="codex-app">
      <h3><span>Codex app features are available worldwide</span></h3>
      <article><p>Availability announcement.</p></article>
    </li>`;

  assert.deepEqual(parseReleases(html), []);
});
