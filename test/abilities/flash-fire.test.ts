import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { MovePhase } from "#phases/move-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Flash Fire", () => {
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
      .battleStyle("single")
      .ability(AbilityId.FLASH_FIRE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(20)
      .enemyLevel(20)
      .criticalHits(false);
  });

  it("immune to Fire-type moves", async () => {
    game.override.enemyMoveset([MoveId.EMBER]).moveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    const blissey = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey.hp).toBe(blissey.getMaxHp());
  });

  it("not activate if the Pokémon is protected from the Fire-type move", async () => {
    game.override.enemyMoveset([MoveId.EMBER]).moveset([MoveId.PROTECT]);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    const blissey = game.field.getPlayerPokemon();

    game.move.select(MoveId.PROTECT);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeUndefined();
  });

  it("activated by Will-O-Wisp", async () => {
    game.override.enemyMoveset([MoveId.WILL_O_WISP]).moveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    const blissey = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.forceHit();
    await game.phaseInterceptor.to(MovePhase, false);
    await game.move.forceHit();

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  });

  it("activated after being frozen", async () => {
    game.override.enemyMoveset([MoveId.EMBER]).moveset(MoveId.SPLASH).statusEffect(StatusEffect.FREEZE);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    const blissey = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  });

  it("not passing with baton pass", async () => {
    game.override.enemyMoveset([MoveId.EMBER]).moveset([MoveId.BATON_PASS]);
    await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.CHANSEY]);

    // ensure use baton pass after enemy moved
    game.move.select(MoveId.BATON_PASS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const chansey = game.field.getPlayerPokemon();
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.CHANSEY);
    expect(chansey!.getTag(BattlerTagType.FIRE_BOOST)).toBeUndefined();
  });

  it("boosts Fire-type move when the ability is activated", async () => {
    game.override
      .enemyMoveset([MoveId.FIRE_PLEDGE])
      .moveset([MoveId.EMBER, MoveId.SPLASH])
      .enemyAbility(AbilityId.FLASH_FIRE)
      .ability(AbilityId.NONE);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);
    const blissey = game.field.getPlayerPokemon();
    const initialHP = 1000;
    blissey.hp = initialHP;

    // first turn
    game.move.select(MoveId.EMBER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(TurnEndPhase);
    const originalDmg = initialHP - blissey.hp;

    expect(blissey.hp > 0);
    blissey.hp = initialHP;

    // second turn
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    const flashFireDmg = initialHP - blissey.hp;

    expect(flashFireDmg).toBeGreaterThan(originalDmg);
  });

  it("still activates regardless of accuracy check", async () => {
    game.override
      .moveset(MoveId.FIRE_PLEDGE)
      .enemyMoveset(MoveId.EMBER)
      .enemyAbility(AbilityId.NONE)
      .ability(AbilityId.FLASH_FIRE)
      .enemySpecies(SpeciesId.BLISSEY);
    await game.classicMode.startBattle([SpeciesId.RATTATA]);

    const blissey = game.field.getEnemyPokemon();
    const initialHP = 1000;
    blissey.hp = initialHP;

    // first turn
    game.move.select(MoveId.FIRE_PLEDGE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.move.forceMiss();
    await game.phaseInterceptor.to(TurnEndPhase);
    const originalDmg = initialHP - blissey.hp;

    expect(blissey.hp > 0);
    blissey.hp = initialHP;

    // second turn
    game.move.select(MoveId.FIRE_PLEDGE);
    await game.phaseInterceptor.to(TurnEndPhase);
    const flashFireDmg = initialHP - blissey.hp;

    expect(flashFireDmg).toBeGreaterThan(originalDmg);
  });
});
