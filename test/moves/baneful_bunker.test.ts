import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { BattlerIndex } from "#enums/battler-index";
import { StatusEffect } from "#app/enums/status-effect";

describe("Moves - Baneful Bunker", () => {
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
      .moveset(MoveId.SLASH)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.BANEFUL_BUNKER)
      .startingLevel(100)
      .enemyLevel(100);
  });
  test("should protect the user and poison attackers that make contact", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(leadPokemon.status?.effect === StatusEffect.POISON).toBeTruthy();
  });
  test("should protect the user and poison attackers that make contact, regardless of accuracy checks", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(leadPokemon.status?.effect === StatusEffect.POISON).toBeTruthy();
  });

  test("should not poison attackers that don't make contact", async () => {
    game.override.moveset(MoveId.FLASH_CANNON);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.FLASH_CANNON);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(leadPokemon.status?.effect === StatusEffect.POISON).toBeFalsy();
  });
});
