import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Contrary", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.BULBASAUR)
      .ability(AbilityId.CONTRARY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should invert all stat changes applied to the user", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.COSMIC_POWER);
    await game.move.forceEnemyMove(MoveId.NOBLE_ROAR);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.CONTRARY);
    expect(player).toHaveStatStage(Stat.ATK, 1);
    expect(player).toHaveStatStage(Stat.SPATK, 1);
    expect(player).toHaveStatStage(Stat.DEF, -1);
    expect(player).toHaveStatStage(Stat.SPDEF, -1);
  });

  // TODO: Stat stage change moves don't count as failed when they should
  it.todo("should invert the failure conditions of normal stat stage change moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    player.setStatStage(Stat.ATK, -6);
    player.setStatStage(Stat.DEF, 6);

    game.move.use(MoveId.IRON_DEFENSE);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.toNextTurn();

    expect(player).toHaveAbilityApplied(AbilityId.CONTRARY);
    expect(player).toHaveStatStage(Stat.ATK, -5);
    expect(player).toHaveStatStage(Stat.DEF, 4);

    player.setStatStage(Stat.ATK, 6);
    player.setStatStage(Stat.DEF, -6);

    game.move.use(MoveId.HARDEN);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.HARDEN, result: MoveResult.FAIL });
    expect(enemy).toHaveUsedMove({ move: MoveId.GROWL, result: MoveResult.FAIL });
    expect(player).toHaveStatStage(Stat.ATK, 6);
    expect(player).toHaveStatStage(Stat.DEF, -6);
  });

  // TODO: Verify interactions with HP cutting moves and add tests for clangorous soul/fillet away if needed
  it.todo("should cause Belly Drum to minimize the user's ATK", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.ATK, 6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.SUCCESS });
    expect(player).toHaveAbilityApplied(AbilityId.CONTRARY);
    expect(player).toHaveStatStage(Stat.ATK, -6);
    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);

    player.hp = player.getMaxHp();
    player.setStatStage(Stat.ATK, -6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.FAIL });
    expect(player).toHaveStatStage(Stat.ATK, -6);
    expect(player).toHaveFullHp();
  });

  it("should cause Clear Body to block stat drops based on their final amount", async () => {
    game.override.enemyAbility(AbilityId.CONTRARY).enemyPassiveAbility(AbilityId.CLEAR_BODY);
    await game.classicMode.startBattle(SpeciesId.SLOWBRO);

    game.move.use(MoveId.SPICY_EXTRACT); // +2 atk, -2 def normally
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveAbilityApplied(AbilityId.CONTRARY);
    expect(enemy).toHaveAbilityApplied(AbilityId.CLEAR_BODY);
    expect(enemy).toHaveStatStage(Stat.ATK, 2);
    expect(enemy).toHaveStatStage(Stat.DEF, 0);
  });
});
