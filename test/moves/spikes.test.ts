import { ArenaTrapTag } from "#data/arena-tag";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Spikes", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.SPIKES, MoveId.SPLASH, MoveId.ROAR]);
  });

  it("should not damage the team that set them", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    game.move.select(MoveId.SPIKES);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(player.hp).toBe(player.getMaxHp());
  });

  it("should damage opposing pokemon that are forced to switch in", async () => {
    game.override.startingWave(5);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    game.move.select(MoveId.SPIKES);
    await game.toNextTurn();

    game.move.select(MoveId.ROAR);
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should damage opposing pokemon that choose to switch in", async () => {
    game.override.startingWave(5);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    game.move.select(MoveId.SPIKES);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  // TODO: re-enable after re-fixing hazards moves
  it.todo("should work when all targets fainted", async () => {
    game.override.enemySpecies(SpeciesId.DIGLETT).battleStyle("double").startingLevel(1000);
    await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.SHUCKLE]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.HYPER_VOICE, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPIKES, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(enemy1.isFainted()).toBe(true);
    expect(enemy2.isFainted()).toBe(true);
    expect(game.scene.arena.getTagOnSide(ArenaTrapTag, ArenaTagSide.ENEMY)).toBeDefined();
  });
});
