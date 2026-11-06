/* LEARNING NOTE: keeps the page's "Content Security Policy" (CSP) in step with its inline scripts.
   A CSP is a rule list the browser enforces: "only run scripts I have listed". Because index.html holds its scripts
   inline (inside <script> tags), each one is listed by its fingerprint, called a SHA-256 hash. If a single character
   of an inline script changes, its fingerprint changes and the browser refuses to run it, so the app goes dead.
   After ANY edit to a <script> or <style> block in index.html, run:   node scripts/update-csp.mjs
   To only check (changes nothing, exits 1 when out of date):         node scripts/update-csp.mjs --check
   Uses only built-in Node modules; reads and rewrites index.html next to this folder. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "index.html");
let html = readFileSync(file, "utf8");

const hash = (text) => "'sha256-" + createHash("sha256").update(text, "utf8").digest("base64") + "'";

// Walk the page the way the browser does: find an opening tag, then jump straight to the first matching closing tag.
// (A simple search would be fooled by the text "<script" appearing inside a script, as it does in this app.)
function blocks(tagName) {
  const out = [];
  let pos = 0;
  for (;;) {
    const open = html.indexOf("<" + tagName, pos);
    if (open < 0) break;
    const openEnd = html.indexOf(">", open);
    const close = html.indexOf("</" + tagName + ">", openEnd);
    if (openEnd < 0 || close < 0) break;
    out.push({ attrs: html.slice(open + tagName.length + 1, openEnd), body: html.slice(openEnd + 1, close) });
    pos = close + tagName.length + 3;
  }
  return out;
}
// Inline scripts that RUN (no src, and not the JSON data block, which is data and needs no entry).
const scripts = blocks("script")
  .filter((b) => !/\bsrc=/.test(b.attrs) && !/application\/json/i.test(b.attrs))
  .map((b) => hash(b.body));
const styles = blocks("style").map((b) => hash(b.body));

// What the page may do. Why each line:
//  default-src 'self'      anything not listed below may only come from this site
//  script-src <hashes>     only the listed inline scripts run (no 'unsafe-inline'); worker-src covers sw.js
//  style-src <hash>        the one <style> block; style-src-attr allows style="..." attributes (they cannot run code)
//  img-src                 own files, data: (all photos are data: strings), blob: (photo resizing), https: (store photos)
//  connect-src             the GitHub contents API (saving) and the r.jina.ai page reader
//  object-src/base-uri     no plug-ins, and nobody can change what relative links point at
const policy = [
  "default-src 'self'",
  `script-src ${[...new Set(scripts)].join(" ")}`,
  "worker-src 'self'",
  `style-src ${[...new Set(styles)].join(" ")}`,
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.github.com https://r.jina.ai",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
const re = /<meta http-equiv="Content-Security-Policy"[^>]*>/;
const next = re.test(html) ? html.replace(re, () => tag) : html.replace(/(<meta charset="utf-8">\n)/, (m) => m + tag + "\n");

if (process.argv.includes("--check")) {
  if (next !== html) { console.error("CSP is out of date: run node scripts/update-csp.mjs"); process.exit(1); }
  console.log(`CSP up to date (${scripts.length} script hashes, ${styles.length} style hash)`);
} else {
  writeFileSync(file, next);
  console.log(`CSP written (${scripts.length} script hashes, ${styles.length} style hash)`);
}
