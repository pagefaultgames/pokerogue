import { BattlerIndex } from "#app/battle";
import { StatusEffect } from "#app/data/status-effect";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Species } from "#app/enums/species";
import { MovePhase } from "#app/phases/move-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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
      .battleType("single")
      .ability(Abilities.FLASH_FIRE)
      .enemyAbility(Abilities.BALL_FETCH)
      .startingLevel(20)
      .enemyLevel(20)
      .disableCrits();
  });


  it("immune to Fire-type moves", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset(SPLASH_ONLY);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey.hp).toBe(blissey.getMaxHp());
  }, 20000);

  it("not activate if the Pokémon is protected from the Fire-type move", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset([Moves.PROTECT]);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.PROTECT);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeUndefined();
  }, 20000);

  it("activated by Will-O-Wisp", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.WILL_O_WISP)).moveset(SPLASH_ONLY);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.move.forceHit();
    await game.phaseInterceptor.to(MovePhase, false);
    await game.move.forceHit();

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  }, 20000);

  it("activated after being frozen", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset(SPLASH_ONLY);
    game.override.statusEffect(StatusEffect.FREEZE);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  }, 20000);

  it("not passing with baton pass", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset([Moves.BATON_PASS]);
    await game.startBattle([Species.BLISSEY, Species.CHANSEY]);

    // ensure use baton pass after enemy moved
    game.move.select(Moves.BATON_PASS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const chansey = game.scene.getPlayerPokemon()!;
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.CHANSEY);
    expect(chansey!.getTag(BattlerTagType.FIRE_BOOST)).toBeUndefined();
  }, 20000);

  it("boosts Fire-type move when the ability is activated", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.FIRE_PLEDGE)).moveset([Moves.EMBER, Moves.SPLASH]);
    game.override.enemyAbility(Abilities.FLASH_FIRE).ability(Abilities.NONE);
    await game.startBattle([Species.BLISSEY]);
    const blissey = game.scene.getPlayerPokemon()!;
    const initialHP = 1000;
    blissey.hp = initialHP;

    // first turn
    game.move.select(Moves.EMBER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(TurnEndPhase);
    const originalDmg = initialHP - blissey.hp;

    expect(blissey.hp > 0);
    blissey.hp = initialHP;

    // second turn
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    const flashFireDmg = initialHP - blissey.hp;

    expect(flashFireDmg).toBeGreaterThan(originalDmg);
  }, 20000);
});
