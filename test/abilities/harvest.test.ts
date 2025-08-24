import { PostTurnRestoreBerryAbAttr } from "#abilities/ability";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import { BerryModifier, PreserveBerryModifier } from "#modifiers/modifier";
import type { ModifierOverride } from "#modifiers/modifier-type";
import { GameManager } from "#test/test-utils/game-manager";
import type { BooleanHolder } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Harvest", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const getPlayerBerries = () =>
    game.scene.getModifiers(BerryModifier, true).filter(b => b.pokemonId === game.field.getPlayerPokemon().id);

  /** Check whether the player's Modifiers contains the specified berries and nothing else. */
  function expectBerriesContaining(...berries: ModifierOverride[]): void {
    const actualBerries: ModifierOverride[] = getPlayerBerries().map(
      // only grab berry type and quantity since that's literally all we care about
      b => ({ name: "BERRY", type: b.berryType, count: b.getStackCount() }),
    );
    expect(actualBerries).toEqual(berries);
  }

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SPLASH, MoveId.NATURAL_GIFT, MoveId.FALSE_SWIPE, MoveId.GASTRO_ACID])
      .ability(AbilityId.HARVEST)
      .startingLevel(100)
      .battleStyle("single")
      .criticalHits(false)
      .statusActivation(false) // Since we're using nuzzle to proc both enigma and sitrus berries
      .weather(WeatherType.SUNNY) // guaranteed recovery
      .enemyLevel(1)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.NUZZLE, MoveId.KNOCK_OFF, MoveId.INCINERATE]);
  });

  it("replenishes eaten berries", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.LUM, count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.NUZZLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(getPlayerBerries()).toHaveLength(0);
    expect(game.field.getPlayerPokemon().battleData.berriesEaten).toHaveLength(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectBerriesContaining({ name: "BERRY", type: BerryType.LUM, count: 1 });
    expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
  });

  it("tracks berries eaten while disabled/not present", async () => {
    // Note: this also checks for harvest not being present as neutralizing gas works by making
    // the game consider all other pokemon to *not* have their respective abilities.
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.ENIGMA, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyAbility(AbilityId.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    const milotic = game.field.getPlayerPokemon();
    expect(milotic).toBeDefined();

    // Chug a few berries without harvest (should get tracked)
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.NUZZLE);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toEqual(expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM]));
    expect(getPlayerBerries()).toHaveLength(2);

    // Give ourselves harvest and disable enemy neut gas,
    // but force our roll to fail so we don't accidentally recover anything
    vi.spyOn(PostTurnRestoreBerryAbAttr.prototype, "canApply").mockReturnValueOnce(false);
    game.override.ability(AbilityId.HARVEST);
    game.move.select(MoveId.GASTRO_ACID);
    await game.move.selectEnemyMove(MoveId.NUZZLE);

    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toEqual(
      expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM, BerryType.ENIGMA, BerryType.LUM]),
    );
    expect(getPlayerBerries()).toHaveLength(0);

    // proc a high roll and we _should_ get a berry back!
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toHaveLength(3);
    expect(getPlayerBerries()).toHaveLength(1);
  });

  it("remembers berries eaten array across waves", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 2 }])
      .ability(AbilityId.BALL_FETCH); // don't actually need harvest for this test
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const regieleki = game.field.getPlayerPokemon();
    regieleki.hp = 1;

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("TurnEndPhase");

    // ate 1 berry without recovering (no harvest)
    expect(regieleki.battleData.berriesEaten).toEqual([BerryType.PETAYA]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(regieleki.getStatStage(Stat.SPATK)).toBe(1);

    await game.toNextWave();

    expect(regieleki.battleData.berriesEaten).toEqual([BerryType.PETAYA]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(regieleki.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("keeps harvested berries across reloads", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 1 }])
      .moveset([MoveId.SPLASH, MoveId.EARTHQUAKE])
      .enemyMoveset([MoveId.SUPER_FANG, MoveId.HEAL_PULSE])
      .enemyAbility(AbilityId.COMPOUND_EYES);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const regieleki = game.field.getPlayerPokemon();
    regieleki.hp = regieleki.getMaxHp() / 4 + 1;

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // ate 1 berry and recovered it
    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expect(getPlayerBerries()).toEqual([expect.objectContaining({ berryType: BerryType.PETAYA, stackCount: 1 })]);
    expect(game.field.getPlayerPokemon().getStatStage(Stat.SPATK)).toBe(1);

    // heal up so harvest doesn't proc and kill enemy
    game.move.select(MoveId.EARTHQUAKE);
    await game.move.selectEnemyMove(MoveId.HEAL_PULSE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.field.getPlayerPokemon().getStatStage(Stat.SPATK)).toBe(1);

    await game.reload.reloadSession();

    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.field.getPlayerPokemon().getStatStage(Stat.SPATK)).toBe(1);
  });

  it("cannot restore capped berries", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 2 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    // Force RNG roll to hit the first berry we find that matches.
    // This does nothing on a success (since there'd only be a starf left to grab),
    // but ensures we don't accidentally let any false positives through.
    vi.spyOn(Phaser.Math.RND, "integerInRange").mockReturnValue(0);
    await game.phaseInterceptor.to("TurnEndPhase");

    // recovered a starf
    expectBerriesContaining(
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 3 },
    );
  });

  it("does nothing if all berries are capped", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 3 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    player.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectBerriesContaining(...initBerries);
  });

  describe("move/ability interactions", () => {
    it("cannot restore incinerated berries", async () => {
      game.override.startingHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 3 }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.INCINERATE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
    });

    it("cannot restore knocked off berries", async () => {
      game.override.startingHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 3 }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.KNOCK_OFF);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
    });

    it("can restore berries eaten by Teatime", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyMoveset(MoveId.TEATIME);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // nom nom the berr berr yay yay
      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("cannot restore Plucked berries for either side", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.PETAYA, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyAbility(AbilityId.HARVEST).enemyMoveset(MoveId.PLUCK);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // gobble gobble gobble
      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");

      // pluck triggers harvest for neither side
      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
      expect(game.field.getEnemyPokemon().battleData.berriesEaten).toEqual([]);
      expect(getPlayerBerries()).toEqual([]);
    });

    it("cannot restore berries preserved via Berry Pouch", async () => {
      // mock berry pouch to have a 100% success rate
      vi.spyOn(PreserveBerryModifier.prototype, "apply").mockImplementation(
        (_pokemon: Pokemon, doPreserve: BooleanHolder): boolean => {
          doPreserve.value = false;
          return true;
        },
      );

      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.PETAYA, count: 1 }];
      game.override.startingHeldItems(initBerries).startingModifier([{ name: "BERRY_POUCH", count: 1 }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase", false);

      // won't trigger harvest since we didn't lose the berry (it just doesn't ever add it to the array)
      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("can restore stolen berries", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.SITRUS, count: 1 }];
      game.override.enemyHeldItems(initBerries).passiveAbility(AbilityId.MAGICIAN).hasPassiveAbility(true);
      await game.classicMode.startBattle([SpeciesId.MEOWSCARADA]);

      // pre damage
      const player = game.field.getPlayerPokemon();
      player.hp = 1;

      // steal a sitrus and immediately consume it
      game.move.select(MoveId.FALSE_SWIPE);
      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");
      expect(player.battleData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(player.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    // TODO: Enable once fling actually works...???
    it.todo("can restore berries flung at user", async () => {
      game.override.enemyHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 1 }]).enemyMoveset(MoveId.FLING);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toBe([]);
      expect(getPlayerBerries()).toEqual([]);
    });

    // TODO: Enable once Nat Gift gets implemented...???
    it.todo("can restore berries consumed via Natural Gift", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.NATURAL_GIFT);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.field.getPlayerPokemon().battleData.berriesEaten).toHaveLength(0);
      expectBerriesContaining(...initBerries);
    });
  });
});
