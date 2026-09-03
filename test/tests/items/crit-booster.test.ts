import { allHeldItems } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { ValueHolder } from "#utils/value-holder";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Crit Boosters", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("Scope Lens", () => {
    it("should raise the critical hit stage by 1", async () => {
      game.override.startingHeldItems([{ entry: HeldItemId.SCOPE_LENS }]);
      await game.classicMode.startBattle(SpeciesId.MAGIKARP);

      const player = game.field.getPlayerPokemon();
      const critStage = new ValueHolder(0);

      applySingleHeldItem(HeldItemId.SCOPE_LENS, HeldItemEffect.CRIT_BOOST, { pokemon: player, critStage });

      expect(critStage.value).toBe(1);
    });
  });

  describe("Leek", () => {
    it.each([
      SpeciesId.FARFETCHD,
      SpeciesId.GALAR_FARFETCHD,
      SpeciesId.SIRFETCHD,
    ])("should raise the critical hit stage by 2 for %s", async species => {
      game.override.startingHeldItems([{ entry: HeldItemId.LEEK }]);
      await game.classicMode.startBattle(species);

      const player = game.field.getPlayerPokemon();
      const critStage = new ValueHolder(0);

      const leek = allHeldItems[HeldItemId.LEEK];
      expect(leek.getAttrs(HeldItemEffect.CRIT_BOOST)[0].shouldApply({ pokemon: player, critStage })).toBe(true);

      applySingleHeldItem(HeldItemId.LEEK, HeldItemEffect.CRIT_BOOST, { pokemon: player, critStage });
      expect(critStage.value).toBe(2);
    });

    it("should not apply for other species", async () => {
      game.override.startingHeldItems([{ entry: HeldItemId.LEEK }]);
      await game.classicMode.startBattle(SpeciesId.MAGIKARP);

      const player = game.field.getPlayerPokemon();
      const critStage = new ValueHolder(0);
      const leek = allHeldItems[HeldItemId.LEEK];

      expect(leek.getAttrs(HeldItemEffect.CRIT_BOOST)[0].shouldApply({ pokemon: player, critStage })).toBe(false);
    });
  });
});
