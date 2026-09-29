#!/usr/bin/env node
/**
 * verify-pages.mjs  -  the front-end agent's safety check.
 *
 * Run:  npm run verify            (starts the built app on port 3100)
 *       BASE_URL=http://localhost:3000 npm run verify   (checks a running app)
 *
 * It fails (exit code 1) when:
 *   1. A page in agent/page-registry.json has lost its source file.
 *      For "confirmed" pages this means a locked page was deleted.
 *   2. Any registered route does not return HTTP 200, or renders a
 *      Next.js error screen.
 *   3. An unknown URL does not return the 404 page.
 * It warns (does not fail) when a page.tsx exists that is not registered.
 *
 * Requires `npm run build` first when BASE_URL is not set.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(root, "agent/page-registry.json"), "utf8"));
const PORT = 3100;
let base = process.env.BASE_URL;
let server;

const results = [];
let failed = false;
const fail = (route, why) => {
  failed = true;
  results.push({ route, ok: false, why });
};

// ---------- 1. Source files still exist ----------
for (const p of registry.pages) {
  if (!existsSync(join(root, p.file))) {
    fail(p.route, p.status === "confirmed" ? `LOCKED page deleted: ${p.file}` : `missing file: ${p.file}`);
  }
}

// Unregistered pages (warning only)
function findPages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return findPages(full);
    return name === "page.tsx" ? [relative(root, full)] : [];
  });
}
const registered = new Set(registry.pages.map((p) => p.file));
const unregistered = findPages(join(root, "app")).filter((f) => !registered.has(f));

// ---------- 2. Every route renders ----------
async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not start at ${url}`);
}

try {
  if (!base) {
    base = `http://localhost:${PORT}`;
    // Refuse to test a stale server left on this port by an earlier run.
    const busy = await fetch(base).then(() => true, () => false);
    if (busy) throw new Error(`Port ${PORT} is already in use. Stop that server or set BASE_URL.`);
    // detached = own process group, so we can stop npx AND the Next.js server it starts
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: root, stdio: "ignore", detached: true });
    await waitForServer(base);
  }

  for (const p of registry.pages) {
    try {
      const res = await fetch(base + p.route);
      const html = await res.text();
      if (res.status !== 200) fail(p.route, `HTTP ${res.status}`);
      else if (/Application error|Unhandled Runtime Error|Internal Server Error/i.test(html)) fail(p.route, "error screen rendered");
      else results.push({ route: p.route, ok: true, why: p.status === "confirmed" ? "ok (locked)" : "ok" });
    } catch (e) {
      fail(p.route, `request failed: ${e.message}`);
    }
  }

  // ---------- 3. Unknown URLs show the 404 page ----------
  const missing = await fetch(`${base}/dashboard/this-page-does-not-exist`);
  if (missing.status !== 404) fail("404 check", `expected 404, got ${missing.status}`);
  else results.push({ route: "404 check", ok: true, why: "ok" });
} catch (e) {
  fail("server", e.message);
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM"); // whole process group
    } catch {
      server.kill();
    }
  }
}

// ---------- Report ----------
const pad = Math.max(...results.map((r) => r.route.length));
console.log("\nAccountPulse page check\n");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.route.padEnd(pad)}  ${r.why}`);
if (unregistered.length) {
  console.log("\nWARN  pages not in agent/page-registry.json (add them):");
  unregistered.forEach((f) => console.log(`      ${f}`));
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed\n`);
process.exit(failed ? 1 : 0);
