/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import * as EncounterPokemonUtils from "#mystery-encounters/encounter-pokemon-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounter-biomes";
import { GameManager } from "#test/framework/game-manager";
import { runMysteryEncounterToEnd } from "#test/utils/encounter-test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("Dark Deal - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[defaultBiome, [MysteryEncounterType.DARK_DEAL]]]),
    );
  });

  describe("Option 1 - Accept the deal", () => {
    /**
     * Check the arguments of the {@linkcode EncounterPokemonUtils.getRandomSpeciesByStarterCost} call(s)
     * that returned the current boss's species, so other calls to it can't affect the result.
     * If several calls returned that species, all of them must match.
     * @param excludedSpecies - The species that must have been excluded
     * @param types - The exact types the boss must have been picked from
     */
    function expectBossPickedWith(excludedSpecies: SpeciesId, types: PokemonType[]): void {
      const getRandomSpeciesSpy = vi.mocked(EncounterPokemonUtils.getRandomSpeciesByStarterCost);
      const bossSpeciesId = game.field.getEnemyPokemon().species.speciesId;
      const bossCalls = getRandomSpeciesSpy.mock.calls.filter((_, i) => {
        const result = getRandomSpeciesSpy.mock.results[i];
        return result.type === "return" && result.value === bossSpeciesId;
      });

      expect(bossCalls).not.toHaveLength(0);
      for (const call of bossCalls) {
        expect(call).toEqual([expect.anything(), expect.arrayContaining([excludedSpecies]), types]);
      }
    }

    // https://github.com/pagefaultgames/pokerogue/issues/5179
    it("should never turn the traded Pokemon into its own species", async () => {
      vi.spyOn(EncounterPokemonUtils, "getRandomSpeciesByStarterCost");
      // Both party members are Suicune, so the traded Pokemon is always a Suicune
      await game.runToMysteryEncounter(MysteryEncounterType.DARK_DEAL, [SpeciesId.SUICUNE, SpeciesId.SUICUNE]);

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expectBossPickedWith(SpeciesId.SUICUNE, [PokemonType.WATER]);
    });
  });
});
