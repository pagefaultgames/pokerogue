/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *
 * `pokemon-level-moves.ts` has `@ts-nocheck` at the top to disable type checking, as not
 * using this directive dramatically slows down type checking due to the sheer
 * size of the file.
 * To remedy this while preserving type safety, this test ensures that
 * each entry of `pokemonSpeciesLevelMoves` and `pokemonFormLevelMoves` is valid
 *
 * @module
 */

import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#balance/pokemon-level-moves";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { describe, expect, test } from "vitest";

describe("TypeCheck - pokemon-level-moves.ts", () => {
  function validateLevelMoves(value: any): void {
    expect(Array.isArray(value), "level moves must be an array").toBe(true);
    for (const entry of value) {
      expect(Array.isArray(entry) && entry.length === 2, "each entry must be an array of length 2").toBe(true);
      const [level, moveId] = entry;
      expect(level, "level must be a number").toBeTypeOf("number");
      expect(MoveId[moveId], "moveId must be a valid MoveId").toBeDefined();
    }
  }

  describe("pokemonSpeciesLevelMoves", () => {
    const pokemonSpeciesNameMap = Object.entries(pokemonSpeciesLevelMoves).map(([speciesId, value]) => {
      return { name: SpeciesId[+speciesId], value };
    });
    test.each(pokemonSpeciesNameMap)("$name has valid level moves", ({ name, value }) => {
      expect(name, "species is a valid species ID").toBeDefined();
      validateLevelMoves(value);
    });

    describe("pokemonFormLevelMoves", () => {
      const pokemonSpeciesFormNameMap = Object.entries(pokemonFormLevelMoves).map(([speciesId, value]) => {
        return { name: SpeciesId[+speciesId], value, speciesId };
      });

      test.each(pokemonSpeciesFormNameMap)("$name has valid form level moves", ({ name, value, speciesId }) => {
        expect(name, "species is a valid species ID").toBeDefined();
        expect(typeof value === "object" && value !== null, "value must be an object").toBe(true);

        const species = getPokemonSpecies(+speciesId);
        expect(species, "species must be in allSpecies").toBeDefined();
        const speciesForms = species.forms;
        expect(Array.isArray(speciesForms), "species.forms must be an array").toBe(true);

        for (const [formId, formLevelMoves] of Object.entries(value)) {
          const formIdAsNumber = +formId;
          expect(formIdAsNumber, "form ID must be a number").toBeTypeOf("number");
          expect(speciesForms[formIdAsNumber], "form ID must be in species.forms").toBeDefined();
          validateLevelMoves(formLevelMoves);
        }
      });
    });
  });
});
