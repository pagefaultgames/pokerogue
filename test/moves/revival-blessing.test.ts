import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Revival Blessing", () => {
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
      .moveset([MoveId.SPLASH, MoveId.REVIVAL_BLESSING, MoveId.MEMENTO])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should revive a selected fainted Pokemon when used by the player", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.MEMENTO);
    game.doSelectPartyPokemon(1, "SwitchPhase");
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();

    expect(player.species.speciesId).toBe(SpeciesId.MAGIKARP);
    game.move.select(MoveId.REVIVAL_BLESSING);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1, "RevivalBlessingPhase");

    await game.phaseInterceptor.to("MoveEndPhase", false);

    const revivedPokemon = game.scene.getPlayerParty()[1];
    expect(revivedPokemon.status?.effect).toBeFalsy();
    expect(revivedPokemon.hp).toBe(Math.floor(revivedPokemon.getMaxHp() / 2));
  });

  it("should revive a random fainted enemy when used by an enemy Trainer", async () => {
    game.override.enemyMoveset(MoveId.REVIVAL_BLESSING).startingWave(8);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();

    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    const revivedPokemon = game.scene.getEnemyParty()[1];
    expect(revivedPokemon.status?.effect).toBeFalsy();
    expect(revivedPokemon.hp).toBe(Math.floor(revivedPokemon.getMaxHp() / 2));
  });

  it("should fail when there are no fainted Pokemon to target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.REVIVAL_BLESSING);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    const player = game.field.getPlayerPokemon();
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should revive a player pokemon and immediately send it back out if used in the same turn it fainted in doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset([MoveId.SPLASH, MoveId.FISSURE])
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC, SpeciesId.GYARADOS]);

    const feebas = game.scene.getPlayerField()[0];

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.REVIVAL_BLESSING, 1);
    await game.move.selectEnemyMove(MoveId.FISSURE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas.isFainted()).toBe(true);

    game.doSelectPartyPokemon(0, "RevivalBlessingPhase");
    await game.toNextTurn();

    expect(feebas.isFainted()).toBe(false);
    expect(feebas.hp).toBe(toDmgValue(0.5 * feebas.getMaxHp()));
    expect(game.scene.getPlayerField()[0]).toBe(feebas);
  });

  it("should not summon multiple pokemon to the same slot when reviving the enemy ally in doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset([MoveId.REVIVAL_BLESSING])
      .moveset([MoveId.SPLASH])
      .startingWave(25); // 2nd rival battle - must have 3+ pokemon
    await game.classicMode.startBattle([SpeciesId.ARCEUS, SpeciesId.GIRATINA]);

    const enemyFainting = game.scene.getEnemyField()[0];

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.killPokemon(enemyFainting);

    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();
    // If there are incorrectly two switch phases into this slot, the fainted pokemon will end up in slot 3
    // Make sure it's still in slot 1
    expect(game.field.getEnemyPokemon()).toBe(enemyFainting);
  });
});
