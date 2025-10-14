/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * `tm-species-map.ts` has `@ts-nocheck` at the top to disable type checking, as not
 * using this directive dramatically slows down type checking due to the sheer
 * size of the file.
 * To remedy this while preserving type safety, this test ensures that
 * each entry of `tmSpecies` is a valid `TMSpeciesEntry`.
 *
 *
 * @module
 */

import { tmSpecies } from "#balance/tm-species-map";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { describe, expect, test } from "vitest";

describe("TypeCheck - tmSpecies", () => {
  // Basic sanity check
  const tmNameMap = Object.entries(tmSpecies).map(([moveId, value]) => {
    return { name: MoveId[+moveId], value };
  });
  test.each(tmNameMap)("$name has valid species", ({ name, value }) => {
    expect(name, "tm is a valid move ID").toBeDefined();
    expect(Array.isArray(value), "value is an array").toBe(true);

    for (const entry of value) {
      const speciesId = typeof entry === "number" ? entry : entry[0];
      expect(SpeciesId[speciesId], "each entry should be a species ID").toBeDefined();

      if (typeof entry !== "number") {
        expect(Array.isArray(entry), "non-numeric entry must be array").toBe(true);
        expect(entry.length, "array entry must have at least 2 elements").toBeGreaterThan(1);

        for (const subEntry of entry.slice(1)) {
          expect(subEntry, "form arrays must have strings for remaining elements").toBeTypeOf("string");
        }
      }
    }
  });
});
