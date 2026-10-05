/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { AttackTypeBoosterModifierType } from "#modifiers/modifier-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Attack Type Booster", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("Generation", () => {
    // https://github.com/pagefaultgames/pokerogue/issues/6935
    it("should not be generated when every attacking move in the party deals fixed damage", async () => {
      // These moves use different subclasses of `FixedDamageAttr` (level-based, flat and Counter-style damage)
      game.override.moveset([MoveId.NIGHT_SHADE, MoveId.SEISMIC_TOSS, MoveId.DRAGON_RAGE, MoveId.COUNTER]);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      // With every move skipped there is no type to weight, so no booster should be offered at all
      const generated = modifierTypes.ATTACK_TYPE_BOOSTER().generateType(game.scene.getPlayerParty());

      expect(generated).toBeNull();
    });

    it("should ignore fixed-damage moves when choosing which type to boost", async () => {
      game.override.moveset([MoveId.NIGHT_SHADE, MoveId.SUPER_FANG, MoveId.WATER_GUN]);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);
      // Starting a battle reseeds the RNG, so the seed must be set afterwards to control the picks below
      game.override.seed("attack type booster generation");

      // The booster's type is a weighted random pick from the party's attacking move types.
      // With fixed-damage moves skipped, Water is the only option, so every pick is Water regardless of the seed.
      // If they were counted, Ghost, Normal and Water would each have a 1 in 3 chance per pick.
      // Repeating the pick 10 times means only ~1 in 59,000 seeds would let that regression pass by chance,
      // and fixing the seed keeps the outcome identical from run to run.
      for (let i = 0; i < 10; i++) {
        const generated = modifierTypes
          .ATTACK_TYPE_BOOSTER()
          .generateType(game.scene.getPlayerParty()) as AttackTypeBoosterModifierType | null;
        expect(generated?.moveType).toBe(PokemonType.WATER);
      }
    });
  });
});
