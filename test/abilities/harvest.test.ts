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

  /** Check whether the player's Modifiers contains the specified berries. */
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
    // the game consider all other pokemon to *not* have any ability.
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.ENIGMA, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyAbility(Abilities.NEUTRALIZING_GAS)
      .weather(WeatherType.NONE); // clear weather so we can control when harvest rolls succeed
    await game.classicMode.startBattle([Species.MILOTIC]);

    const player = game.scene.getPlayerPokemon();

    // Chug a few berries without harvest (should get tracked)
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.toNextTurn();

    expect(player?.battleData.berriesEaten).toEqual(expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM]));
    expect(getPlayerBerries()).toHaveLength(2);

    // Give ourselves harvest and disable enemy neut gas,
    // but force our roll to fail so we don't accidentally recover anything
    game.override.ability(Abilities.HARVEST);
    game.move.select(Moves.GASTRO_ACID);
    await game.forceEnemyMove(Moves.NUZZLE);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    vi.spyOn(Phaser.Math.RND, "realInRange").mockReturnValue(0);

    expect(player?.battleData.berriesEaten).toEqual(
      expect.arrayContaining([BerryType.ENIGMA, BerryType.LUM, BerryType.ENIGMA, BerryType.LUM]),
    );
    expect(getPlayerBerries()).toHaveLength(0);

    // proc a high roll and we _should_ get a berry back!
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    vi.spyOn(Phaser.Math.RND, "realInRange").mockReturnValue(1);
    await game.toNextTurn();

    expect(player?.battleData.berriesEaten).toHaveLength(3);
    expect(getPlayerBerries()).toHaveLength(1);
  });

  // TODO: Figure out why this is borking...???
  it("remembers berries eaten tracker across waves and save/reload", async () => {
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
    expect(getPlayerBerries()).toEqual([expect.objectContaining({ berryType: BerryType.PETAYA, stackCount: 1 })]);
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.SPATK)).toBe(1);

    await game.toNextWave();

    expect(regieleki.battleData.berriesEaten).toEqual([BerryType.PETAYA]);

    await game.reload.reloadSession();

    const regielekiReloaded = game.scene.getPlayerPokemon()!;
    expect(regielekiReloaded.battleData.berriesEaten).toEqual([BerryType.PETAYA]);
  });

  it("cannot restore capped berries, even if an ally has one under cap", async () => {
    const initBerries: ModifierOverride[] = [
      { name: "BERRY", type: BerryType.LUM, count: 2 },
      { name: "BERRY", type: BerryType.STARF, count: 2 },
    ];
    game.override.startingHeldItems(initBerries);
    await game.classicMode.startBattle([Species.FEEBAS, Species.BELLOSSOM]);

    const [feebas, bellossom] = game.scene.getPlayerParty();
    feebas.battleData.berriesEaten = [BerryType.LUM, BerryType.STARF];

    // get rid of bellossom's modifiers and add a sitrus
    await game.scene.removePartyMemberModifiers(1);
    const newMod = game.scene
      .getModifiers(BerryModifier, true)
      .find(b => b.berryType === BerryType.SITRUS)
      ?.clone()!;
    expect(newMod).toBeDefined();
    newMod.pokemonId = bellossom.id;
    game.scene.addModifier(newMod, true);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    // Force RNG roll to hit the first berry we find.
    // This does nothing on a success (since there'd only be a starf left to grab),
    // but ensures we don't accidentally let any false positives through.
    vi.spyOn(Phaser.Math.RND, "integerInRange").mockReturnValue(0);
    await game.phaseInterceptor.to("TurnEndPhase");

    // recovered a starf,
    expectBerriesContaining({ name: "BERRY", type: BerryType.STARF, count: 3 });
    expect(game.scene.getModifiers(BerryModifier, true).filter(b => b.pokemonId === bellossom.id)).toHaveLength(0);
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
