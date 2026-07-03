/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Logger, Plugin as VitePlugin } from "vite";

const NAME = "static-shell-plugin";
const VERSION = "1.0.0";

/** Shape of the entry we care about within Vite's `.vite/manifest.json`. */
interface ManifestEntry {
  file: string;
  css?: string[];
  imports?: string[];
}

/**
 * Inline critical CSS injected alongside the bootstrap script so the correct
 * background paints immediately, before the async stylesheet loads (avoids a
 * flash of default white background). Mirrors the `body`/fullscreen rules in
 * index.css.
 */
const CRITICAL_STYLE = `<style>
  html, body { background: #484050; }
  @media (display-mode: fullscreen) {
    body { background: #000000; }
  }
  #touchControls:not(.visible) { display: none; }
</style>`;

/**
 * Bootstrap loader injected into the shipped index.html in place of Vite's
 * hashed entry `<script>`/`<link>` tags.
 *
 * At runtime, fetches asset-manifest.json (no-store) to find the current
 * entry bundle and injects it.
 *
 * Keeps index.html identical across deploys, so it's safe for it to be
 * hard-cached indefinitely - notably by iOS "Add to Home Screen" apps, which
 * cache the start_url regardless of headers or service worker state.
 */
const BOOTSTRAP_SCRIPT = `<script>
(function () {
  function inject(manifest) {
    (manifest.preloads || []).forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "modulepreload";
      link.href = href;
      document.head.appendChild(link);
    });
    (manifest.css || []).forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
    var script = document.createElement("script");
    script.type = "module";
    script.src = manifest.js;
    document.body.appendChild(script);
  }

  fetch("./asset-manifest.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("asset-manifest.json fetch failed: " + res.status);
      }
      return res.json();
    })
    .then(inject)
    .catch(function (err) {
      console.error("Failed to fetch current asset manifest:", err);
      document.body.innerHTML =
        '<p style="color:#fff;text-align:center;margin-top:2em;">Failed to load PokéRogue. Please check your connection and try again.</p>';
    });
})();
</script>`;

/** Matches Vite's injected entry `<script type="module" crossorigin src="...">` tag. */
const ENTRY_SCRIPT_PATTERN = /<script type="module" crossorigin src="[^"]*"><\/script>/;
/** Matches Vite's injected `<link rel="modulepreload" ...>` tags (one or more, greedy across lines). */
const MODULEPRELOAD_LINK_PATTERN = /<link rel="modulepreload"[^>]*>\n?/g;
/** Matches Vite's injected `<link rel="stylesheet" crossorigin href="...">` tag(s). */
const STYLESHEET_LINK_PATTERN = /<link rel="stylesheet" crossorigin href="[^"]*">\n?/g;

/** The small runtime manifest written to dist/asset-manifest.json. */
interface AssetManifest {
  js: string;
  css: string[];
  preloads: string[];
}

function resolveAssetManifest(
  manifest: Record<string, ManifestEntry>,
  entry: ManifestEntry,
  warn: (message: string) => void,
): AssetManifest {
  const cssFiles = new Set<string>(entry.css ?? []);
  const preloadFiles: string[] = [];

  for (const importKey of entry.imports ?? []) {
    const chunk = manifest[importKey];
    if (!chunk) {
      warn(`"${importKey}" referenced by entry imports but missing from manifest.`);
      continue;
    }
    preloadFiles.push(chunk.file);
    for (const css of chunk.css ?? []) {
      cssFiles.add(css);
    }
  }

  return {
    js: `./${entry.file}`,
    css: [...cssFiles].map(file => `./${file}`),
    preloads: preloadFiles.map(file => `./${file}`),
  };
}

/**
 * Rewrites the built `index.html` so it no longer references any deploy-specific
 * (content-hashed) filenames directly, and writes a small `asset-manifest.json`
 * that the inline bootstrap loader fetches at runtime to discover the current bundle.
 *
 * Must run after Vite's core `manifest: true` output and the built index.html have
 * both been written to disk, hence `closeBundle`.
 */
export function staticShellPlugin(): VitePlugin {
  let logger: Logger;
  const { cyan, gray, green, yellow } = chalk;

  return {
    name: NAME,
    version: VERSION,
    apply: "build",
    enforce: "post",
    configResolved(resolvedConfig): void {
      logger = resolvedConfig.logger;
    },
    closeBundle(): void {
      const logSuffix = gray(` [${NAME}]`);
      const warn = (message: string) => logger.warn(yellow(`${message}${logSuffix}`));
      logger.info(cyan(`\t→ Plugin: ${NAME} v${VERSION}`));

      const outDir = path.resolve("dist");
      const manifestPath = path.join(outDir, ".vite", "manifest.json");
      const indexPath = path.join(outDir, "index.html");

      if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) {
        warn(`Skipping: expected ${manifestPath} and ${indexPath} to exist.`);
        return;
      }

      const manifest: Record<string, ManifestEntry> = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const entry = manifest["index.html"];

      if (!entry) {
        warn(`Skipping: no "index.html" entry found in ${manifestPath}.`);
        return;
      }

      const assetManifest = resolveAssetManifest(manifest, entry, warn);
      fs.writeFileSync(path.join(outDir, "asset-manifest.json"), JSON.stringify(assetManifest));

      let html = fs.readFileSync(indexPath, "utf-8");
      const hadEntryScript = ENTRY_SCRIPT_PATTERN.test(html);

      if (!hadEntryScript) {
        warn(`"${indexPath}" did not contain the expected Vite entry <script> tag - static shell was not applied.`);
        return;
      }

      html = html.replace(ENTRY_SCRIPT_PATTERN, CRITICAL_STYLE + BOOTSTRAP_SCRIPT);
      html = html.replace(MODULEPRELOAD_LINK_PATTERN, "");
      html = html.replace(STYLESHEET_LINK_PATTERN, "");

      fs.writeFileSync(indexPath, html);
      fs.rmSync(path.join(outDir, ".vite"), { recursive: true, force: true });

      logger.info(`${green(`✓ Rewrote index.html into a deploy-invariant shell (entry: ${entry.file})`)}${logSuffix}`);
    },
  };
}
