/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { namespaceMap } from "#app/i18n-namespace-map";
import { supportedLngs } from "#app/i18n-supported-lngs";
import { toKebabCase } from "#utils/strings";
import { readFileSync } from "node:fs";
import { join } from "path";
import i18next from "i18next";
import I18NextHttpBackend from "i18next-http-backend";

// Copied here from constants to avoid the species data registry getting created before i18next is laoded
const PROJECT_ROOT = join(import.meta.dirname, "..", "..");

// assigned during post-processing in #app/plugins/vite/namespaces-i18n-plugin.ts
const nsEn: string[] = [];

// TODO: find a better way to handle this
await i18next.use(I18NextHttpBackend).init({
  lng: "en",
  fallbackLng: "en",
  supportedLngs,
  ns: nsEn,
  defaultNS: "pokemon",
  interpolation: {
    escapeValue: false,
  },
  backend: {
    loadPath(lng: string | string[], [ns]: string[]) {
      const language = Array.isArray(lng) ? lng[0] : lng;
      // Use namespace maps where required
      let fileName: string;
      if (namespaceMap[ns]) {
        fileName = namespaceMap[ns];
      } else if (ns.startsWith("mysteryEncounters/")) {
        fileName = toKebabCase(ns + "-dialogue"); // mystery-encounters/a-trainers-test-dialogue
      } else {
        fileName = toKebabCase(ns);
      }
      const path = join(PROJECT_ROOT, "locales", language, `${fileName}.json`);
      return path;
    },
    request(_options, url, _payload, callback) {
      try {
        const data = readFileSync(url, "utf8");
        callback(null, { status: 200, data });
      } catch (error) {
        callback(error as Error, { status: 500, data: "" });
      }
    },
  },
  preload: supportedLngs,
});
