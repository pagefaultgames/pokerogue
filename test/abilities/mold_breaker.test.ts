import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { globalScene } from "#app/global-scene";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mold Breaker", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

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
      .moveset([Moves.ERUPTION, Moves.EARTHQUAKE, Moves.DRAGON_TAIL])
      .ability(Abilities.MOLD_BREAKER)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyPassiveAbility(Abilities.NO_GUARD)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should ignore ignorable abilities during the move's execution", async () => {
    game.override.startingLevel(100).enemyLevel(2).enemyAbility(Abilities.STURDY);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.ERUPTION);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getEnemyPokemon()?.isFainted()).toBe(true);
  });

  it("should turn off ignore abilities arena variable after the user's move concludes", async () => {
    game.override.startingLevel(100).enemyLevel(2);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    expect(globalScene.arena.ignoreAbilities).toBe(false);
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(globalScene.arena.ignoreAbilities).toBe(true);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(globalScene.arena.ignoreAbilities).toBe(false);
  });

  it("should keep Levitate opponents grounded when using force switch moves", async () => {
    game.override.enemyAbility(Abilities.LEVITATE).enemySpecies(Species.WEEZING).startingWave(8); // first rival battle; guaranteed 2 mon party

    // Setup toxic spikes and stealth rock
    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, -1, Moves.TOXIC_SPIKES, 1, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, -1, Moves.CEASELESS_EDGE, 1, ArenaTagSide.ENEMY);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const [weezing1, weezing2] = game.scene.getEnemyParty();
    // Weezing's levitate prevented removal of Toxic Spikes, ignored Spikes damage
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY)).toBeDefined();
    expect(weezing1.getHpRatio()).toBe(1);

    game.move.select(Moves.DRAGON_TAIL);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Levitate was ignored during the switch, causing Toxic Spikes to be removed and Spikes to deal damage
    expect(weezing1.isOnField()).toBe(false);
    expect(weezing2.isOnField()).toBe(true);
    expect(weezing2.getHpRatio()).toBeCloseTo(0.75);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY)).toBeUndefined();
  });
});
