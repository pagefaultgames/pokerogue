import { BattlerIndex } from "#app/battle";
import { PostTurnRestoreBerryAbAttr } from "#app/data/abilities/ability";
import type Pokemon from "#app/field/pokemon";
import { BerryModifier, PreserveBerryModifier } from "#app/modifier/modifier";
import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { BooleanHolder } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Harvest", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const getPlayerBerries = () =>
    game.scene.getModifiers(BerryModifier, true).filter(b => b.pokemonId === game.scene.getPlayerPokemon()?.id);

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
      .moveset([Moves.SPLASH, Moves.NATURAL_GIFT, Moves.FALSE_SWIPE, Moves.GASTRO_ACID])
      .ability(Abilities.HARVEST)
      .startingLevel(100)
      .battleStyle("single")
      .disableCrits()
      .statusActivation(false) // Since we're using nuzzle to proc both enigma and sitrus berries
      .weather(WeatherType.SUNNY) // guaranteed recovery
      .enemyLevel(1)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.NUZZLE, Moves.KNOCK_OFF, Moves.INCINERATE]);
  });

  it("replenishes eaten berries", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.LUM, count: 1 }]);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(getPlayerBerries()).toHaveLength(0);
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toHaveLength(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectBerriesContaining({ name: "BERRY", type: BerryType.LUM, count: 1 });
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
  });

  it("tracks berries eaten while disabled/not present", async () => {
    // Note: this also checks for harvest not being present as neutralizing gas works by making
    // the game consider all other pokemon to *not* have their respective abilities.
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.ENIGMA, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyAbility(Abilities.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([Species.MILOTIC]);

    const milotic = game.scene.getPlayerPokemon()!;
    expect(milotic).toBeDefined();

    // Chug a few berries without harvest (should get tracked)
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toEqual(expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM]));
    expect(getPlayerBerries()).toHaveLength(2);

    // Give ourselves harvest and disable enemy neut gas,
    // but force our roll to fail so we don't accidentally recover anything
    vi.spyOn(PostTurnRestoreBerryAbAttr.prototype, "canApplyPostTurn").mockReturnValueOnce(false);
    game.override.ability(Abilities.HARVEST);
    game.move.select(Moves.GASTRO_ACID);
    await game.forceEnemyMove(Moves.NUZZLE);

    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toEqual(
      expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM, BerryType.ENIGMA, BerryType.LUM]),
    );
    expect(getPlayerBerries()).toHaveLength(0);

    // proc a high roll and we _should_ get a berry back!
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toHaveLength(3);
    expect(getPlayerBerries()).toHaveLength(1);
  });

  it("remembers berries eaten array across waves", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 2 }])
      .ability(Abilities.BALL_FETCH); // don't actually need harvest for this test
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const regieleki = game.scene.getPlayerPokemon()!;
    regieleki.hp = 1;

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
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
      .moveset([Moves.SPLASH, Moves.EARTHQUAKE])
      .enemyMoveset([Moves.SUPER_FANG, Moves.HEAL_PULSE])
      .enemyAbility(Abilities.COMPOUND_EYES);
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const regieleki = game.scene.getPlayerPokemon()!;
    regieleki.hp = regieleki.getMaxHp() / 4 + 1;

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // ate 1 berry and recovered it
    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expect(getPlayerBerries()).toEqual([expect.objectContaining({ berryType: BerryType.PETAYA, stackCount: 1 })]);
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);

    // heal up so harvest doesn't proc and kill enemy
    game.move.select(Moves.EARTHQUAKE);
    await game.forceEnemyMove(Moves.HEAL_PULSE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);

    await game.reload.reloadSession();

    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("cannot restore capped berries", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 2 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([Species.FEEBAS]);

    const feebas = game.scene.getPlayerPokemon()!;
    feebas.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
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
    await game.classicMode.startBattle([Species.FEEBAS]);

    const player = game.scene.getPlayerPokemon()!;
    player.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectBerriesContaining(...initBerries);
  });

  describe("move/ability interactions", () => {
    it("cannot restore incinerated berries", async () => {
      game.override.startingHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 3 }]);
      await game.classicMode.startBattle([Species.FEEBAS]);

      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.INCINERATE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
    });

    it("cannot restore knocked off berries", async () => {
      game.override.startingHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 3 }]);
      await game.classicMode.startBattle([Species.FEEBAS]);

      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.KNOCK_OFF);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
    });

    it("can restore berries eaten by Teatime", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyMoveset(Moves.TEATIME);
      await game.classicMode.startBattle([Species.FEEBAS]);

      // nom nom the berr berr yay yay
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("cannot restore Plucked berries for either side", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.PETAYA, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyAbility(Abilities.HARVEST).enemyMoveset(Moves.PLUCK);
      await game.classicMode.startBattle([Species.FEEBAS]);

      // gobble gobble gobble
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");

      // pluck triggers harvest for neither side
      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expect(game.scene.getEnemyPokemon()?.battleData.berriesEaten).toEqual([]);
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
      await game.classicMode.startBattle([Species.FEEBAS]);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase", false);

      // won't trigger harvest since we didn't lose the berry (it just doesn't ever add it to the array)
      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("can restore stolen berries", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.SITRUS, count: 1 }];
      game.override.enemyHeldItems(initBerries).passiveAbility(Abilities.MAGICIAN).hasPassiveAbility(true);
      await game.classicMode.startBattle([Species.MEOWSCARADA]);

      // pre damage
      const player = game.scene.getPlayerPokemon()!;
      player.hp = 1;

      // steal a sitrus and immediately consume it
      game.move.select(Moves.FALSE_SWIPE);
      await game.forceEnemyMove(Moves.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");
      expect(player.battleData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(player.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    // TODO: Enable once fling actually works...???
    it.todo("can restore berries flung at user", async () => {
      game.override.enemyHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 1 }]).enemyMoveset(Moves.FLING);
      await game.classicMode.startBattle([Species.FEEBAS]);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toBe([]);
      expect(getPlayerBerries()).toEqual([]);
    });

    // TODO: Enable once Nat Gift gets implemented...???
    it.todo("can restore berries consumed via Natural Gift", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries);
      await game.classicMode.startBattle([Species.FEEBAS]);

      game.move.select(Moves.NATURAL_GIFT);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toHaveLength(0);
      expectBerriesContaining(...initBerries);
    });
  });
});
