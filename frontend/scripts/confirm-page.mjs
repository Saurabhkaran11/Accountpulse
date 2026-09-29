#!/usr/bin/env node
/**
 * confirm-page.mjs  -  lock a page after you have reviewed and approved it.
 *
 *   npm run confirm -- /dashboard/profile      lock one page
 *   npm run confirm -- --all                   lock every registered page
 *   npm run confirm -- --list                  show each page's status
 *
 * Locked ("confirmed") pages can still be improved by the front-end agent,
 * but never deleted or renamed. `npm run verify` fails if one goes missing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const file = join(new URL("..", import.meta.url).pathname, "agent/page-registry.json");
const registry = JSON.parse(readFileSync(file, "utf8"));
const arg = process.argv[2];
const today = new Date().toISOString().slice(0, 10);

if (!arg || arg === "--list") {
  for (const p of registry.pages) console.log(`${p.status.padEnd(9)} ${p.route}`);
  process.exit(0);
}

const targets = arg === "--all" ? registry.pages : registry.pages.filter((p) => p.route === arg);
if (!targets.length) {
  console.error(`No registered page with route "${arg}". Run with --list to see routes.`);
  process.exit(1);
}
for (const p of targets) {
  p.status = "confirmed";
  p.confirmedOn = p.confirmedOn ?? today;
  console.log(`Locked ${p.route}`);
}
writeFileSync(file, JSON.stringify(registry, null, 2) + "\n");
