import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { BerryModifier, PreserveBerryModifier } from "#app/modifier/modifier";
import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { BooleanHolder } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .moveset([MoveId.SPLASH, MoveId.NATURAL_GIFT, MoveId.FALSE_SWIPE, MoveId.GASTRO_ACID])
      .ability(AbilityId.HARVEST)
      .startingLevel(100)
      .battleStyle("single")
      .disableCrits()
      .statusActivation(false) // Since we're using nuzzle to proc both enigma and sitrus berries
      .weather(WeatherType.SUNNY) // guaranteed recovery
      .enemyLevel(1)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.NUZZLE]);
  });

  it("should replenish the user's eaten berries at end of turn", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.LUM, count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.NUZZLE);
    await game.phaseInterceptor.to("BerryPhase");
    expectBerriesContaining();
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toHaveLength(1);
    await game.toEndOfTurn();

    expectBerriesContaining({ name: "BERRY", type: BerryType.LUM, count: 1 });
    expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
  });

  it("tracks berries eaten while neutralized/not present", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.ENIGMA, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    // Chug a few berries without harvest (should get tracked)
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.NUZZLE);
    await game.toNextTurn();

    const milotic = game.field.getPlayerPokemon();
    expect(milotic.battleData.berriesEaten).toEqual(expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM]));
    expect(getPlayerBerries()).toHaveLength(2);

    // Give ourselves harvest, blocked by enemy neut gas
    game.field.mockAbility(milotic, AbilityId.HARVEST);
    game.field.mockAbility(game.field.getEnemyPokemon(), AbilityId.NEUTRALIZING_GAS);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.NUZZLE);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toEqual(
      expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM, BerryType.ENIGMA, BerryType.LUM]),
    );
    expectBerriesContaining();

    // Disable neut gas and we _should_ get a berry back!
    game.field.mockAbility(game.field.getEnemyPokemon(), AbilityId.BALL_FETCH);
    game.move.select(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(milotic.battleData.berriesEaten).toHaveLength(3);
    expect(getPlayerBerries()).toHaveLength(1);
  });

  it("remembers berries eaten array across waves", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 2 }])
      .ability(AbilityId.BALL_FETCH); // don't actually need harvest for this test
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const regieleki = game.scene.getPlayerPokemon()!;
    regieleki.hp = 1;

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toEndOfTurn();

    // ate 1 berry without recovering (no harvest)
    expect(regieleki.battleData.berriesEaten).toEqual([BerryType.PETAYA]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(regieleki.getStatStage(Stat.SPATK)).toBe(1);

    await game.toNextWave();

    expect(regieleki.battleData.berriesEaten).toEqual([BerryType.PETAYA]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(regieleki.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should keep harvested berries across reloads", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.PETAYA, count: 1 }])
      .moveset([MoveId.SPLASH, MoveId.EARTHQUAKE])
      .enemyMoveset([MoveId.SUPER_FANG, MoveId.HEAL_PULSE])
      .enemyAbility(AbilityId.COMPOUND_EYES);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const regieleki = game.scene.getPlayerPokemon()!;
    regieleki.hp = regieleki.getMaxHp() / 4 + 1;

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // ate 1 berry and recovered it
    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expect(getPlayerBerries()).toEqual([expect.objectContaining({ berryType: BerryType.PETAYA, stackCount: 1 })]);
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);

    // heal up so harvest doesn't proc and kill enemy
    game.move.select(MoveId.EARTHQUAKE);
    await game.move.selectEnemyMove(MoveId.HEAL_PULSE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);

    await game.reload.reloadSession();

    expect(regieleki.battleData.berriesEaten).toEqual([]);
    expectBerriesContaining({ name: "BERRY", count: 1, type: BerryType.PETAYA });
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should not restore capped berries", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 2 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.scene.getPlayerPokemon()!;
    feebas.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    // Force RNG roll to hit the first berry we find that matches.
    // This does nothing on a success (since there'd only be a starf left to grab),
    // but ensures we don't accidentally let any false positives through.
    vi.spyOn(Phaser.Math.RND, "integerInRange").mockReturnValue(0);
    await game.toEndOfTurn();

    // recovered a starf
    expectBerriesContaining(
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 3 },
    );
  });

  it("should do nothing if all berries are capped", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 3 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.scene.getPlayerPokemon()!;
    player.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expectBerriesContaining(...initBerries);
  });

  describe("Move/Ability interactions", () => {
    it.each<{ name: string; move: MoveId }>([
      { name: "Incinerate", move: MoveId.INCINERATE },
      { name: "Knock Off", move: MoveId.KNOCK_OFF },
    ])("should not restore berries removed by $name", async ({ move }) => {
      game.override.startingHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 3 }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.move.forceEnemyMove(move);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining();
    });

    it("should restore berries eaten by Teatime", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyMoveset(MoveId.TEATIME);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // nom nom the berr berr yay yay
      game.move.select(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("should not restore Plucked berries for either side", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.PETAYA, count: 1 }];
      game.override.startingHeldItems(initBerries).enemyAbility(AbilityId.HARVEST).enemyMoveset(MoveId.PLUCK);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // gobble gobble gobble
      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");

      // pluck triggers harvest for neither side
      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expect(game.scene.getEnemyPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining();
    });

    it("should not restore berries preserved via Berry Pouch", async () => {
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
      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    it("should restore berries stolen from another Pokemon", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.SITRUS, count: 1 }];
      game.override.enemyHeldItems(initBerries).passiveAbility(AbilityId.MAGICIAN).hasPassiveAbility(true);
      await game.classicMode.startBattle([SpeciesId.MEOWSCARADA]);

      // pre damage
      const player = game.scene.getPlayerPokemon()!;
      player.hp = 1;

      // steal a sitrus and immediately consume it
      game.move.select(MoveId.FALSE_SWIPE);
      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.phaseInterceptor.to("BerryPhase");
      expect(player.battleData.berriesEaten).toEqual([BerryType.SITRUS]);

      await game.toEndOfTurn();

      expect(player.battleData.berriesEaten).toEqual([]);
      expectBerriesContaining(...initBerries);
    });

    // TODO: Enable once fling actually works...???
    it.todo("should restore berries flung at user", async () => {
      game.override.enemyHeldItems([{ name: "BERRY", type: BerryType.STARF, count: 1 }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.FLING);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toBe([]);
      expectBerriesContaining();
    });

    // TODO: Enable once Nat Gift gets implemented...???
    it.todo("can restore berries consumed via Natural Gift", async () => {
      const initBerries: ModifierOverride[] = [{ name: "BERRY", type: BerryType.STARF, count: 1 }];
      game.override.startingHeldItems(initBerries);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.NATURAL_GIFT);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()?.battleData.berriesEaten).toHaveLength(0);
      expectBerriesContaining(...initBerries);
    });
  });
});
