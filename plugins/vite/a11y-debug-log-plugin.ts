/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from "node:fs";
import path from "node:path";
import type { Plugin as VitePlugin } from "vite";

/**
 * Temporary diagnostic Vite plugin -- writes a11y bindings-tab log lines from the
 * browser to a real file on disk so they can be inspected without copying
 * localStorage by hand.
 *
 * Endpoints (only available on the dev server):
 *
 *   POST /a11y-debug-log    Append the request body to .a11y-debug-log.txt
 *   DELETE /a11y-debug-log  Clear the file
 *
 * Will be removed when the underlying issue is identified.
 */
export function a11yDebugLogPlugin(): VitePlugin {
  const logPath = path.resolve(process.cwd(), ".a11y-debug-log.txt");

  return {
    name: "a11y-debug-log",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/a11y-debug-log", (req, res, next) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", chunk => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              fs.appendFileSync(logPath, body);
            } catch {
              // best effort -- never block the request
            }
            res.statusCode = 204;
            res.end();
          });
          return;
        }
        if (req.method === "DELETE") {
          try {
            fs.writeFileSync(logPath, "");
          } catch {
            // ignore
          }
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    },
  };
}
