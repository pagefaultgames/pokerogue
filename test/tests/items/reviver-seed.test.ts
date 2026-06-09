import { allHeldItems } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { HitResult } from "#enums/hit-result";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Reviver Seed", () => {
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
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(100)
      .startingLevel(1)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingHeldItems([{ entry: HeldItemId.REVIVER_SEED }])
      .enemyHeldItems([{ entry: HeldItemId.REVIVER_SEED }])
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("Unit Tests", () => {
    it("should apply when knocked out from direct damage", async () => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.hp = 1;

      player.damageAndUpdate(1, { result: HitResult.EFFECTIVE });

      expect(player).toHaveAppliedItem(HeldItemId.REVIVER_SEED, HeldItemEffect.INSTANT_REVIVE);
    });

    it("should queue a heal phase to revive the holder when activated", async () => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.hp = 0;

      applySingleHeldItem(HeldItemId.REVIVER_SEED, HeldItemEffect.INSTANT_REVIVE, { pokemon: player });

      const p = game.scene.phaseManager["phaseQueue"].findAll("PokemonHealPhase");
      expect(p).toHaveLength(1);
      expect(p[0].getPokemon()).toBe(player);
    });
  });

  describe("Integration Tests", () => {
    it.each([
      { moveType: "Special Moves", move: MoveId.WATER_GUN },
      { moveType: "Physical Moves", move: MoveId.TACKLE },
      { moveType: "Fixed Damage Moves", move: MoveId.SEISMIC_TOSS },
      { moveType: "Final Gambit", move: MoveId.FINAL_GAMBIT },
      { moveType: "Counter Moves", move: MoveId.COUNTER },
      { moveType: "OHKO Moves", move: MoveId.SHEER_COLD },
    ])("should activate when hit by $moveType", async ({ move }) => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.hp = 1;

      const spy = vi.spyOn(allHeldItems[HeldItemId.REVIVER_SEED].getAttrs(HeldItemEffect.INSTANT_REVIVE)[0], "apply");

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(move);
      await game.toEndOfTurn();

      expect(spy).toHaveBeenCalledExactlyOnceWith({ pokemon: player });
      expect(player).not.toHaveFainted();
    });

    it("should activate the holder's reviver seed from confusion self-hit", async () => {
      game.override.confusionActivation(true);
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.hp = 1;
      player.addTag(BattlerTagType.CONFUSED, 3);

      const spy = vi.spyOn(allHeldItems[HeldItemId.REVIVER_SEED].getAttrs(HeldItemEffect.INSTANT_REVIVE)[0], "apply");

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(spy).toHaveBeenCalledExactlyOnceWith({ pokemon: player });
      expect(player).not.toHaveFainted();
    });

    it.each([
      { moveType: "Damaging Move Chip Damage", move: MoveId.SALT_CURE },
      { moveType: "Chip Damage", move: MoveId.LEECH_SEED },
      { moveType: "Trapping Chip Damage", move: MoveId.WHIRLPOOL },
      { moveType: "Status Effect Damage", move: MoveId.WILL_O_WISP },
      { moveType: "Weather", move: MoveId.SANDSTORM },
    ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const enemy = game.field.getEnemyPokemon();
      enemy.hp = 1;

      const spy = vi.spyOn(allHeldItems[HeldItemId.REVIVER_SEED].getAttrs(HeldItemEffect.INSTANT_REVIVE)[0], "apply");

      game.move.use(move);
      await game.toEndOfTurn();

      expect(spy).not.toHaveBeenCalled();
      expect(enemy).toHaveFainted();
    });

    it.each([
      { moveType: "Recoil Damage", move: MoveId.DOUBLE_EDGE },
      { moveType: "Self-KO Moves", move: MoveId.EXPLOSION },
      { moveType: "Curse Self-Damage", move: MoveId.CURSE },
      { moveType: "Liquid Ooze", move: MoveId.GIGA_DRAIN },
    ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
      game.override.enemyAbility(AbilityId.LIQUID_OOZE);
      await game.classicMode.startBattle(SpeciesId.GASTLY, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.hp = 1;

      const reviverSeed = allHeldItems[HeldItemId.REVIVER_SEED];
      const spy = vi.spyOn(reviverSeed.getAttrs(HeldItemEffect.INSTANT_REVIVE)[0], "apply");

      game.move.use(move);
      await game.toEndOfTurn();

      expect(spy).not.toHaveBeenCalled();
      expect(player).toHaveFainted();
    });

    it("should not activate the holder's reviver seed from Destiny Bond fainting", async () => {
      game.override.startingHeldItems([]); // reset held items to nothing so user doesn't revive and not trigger Destiny Bond
      await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();
      player.hp = 1;

      const spy = vi.spyOn(allHeldItems[HeldItemId.REVIVER_SEED].getAttrs(HeldItemEffect.INSTANT_REVIVE)[0], "apply");

      game.move.use(MoveId.DESTINY_BOND);
      await game.move.forceEnemyMove(MoveId.TACKLE);
      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(spy).not.toHaveBeenCalled();
      expect(player).toHaveFainted();
      expect(enemy).toHaveFainted();
    });
  });
});
