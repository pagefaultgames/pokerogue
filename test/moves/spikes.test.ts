import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ArenaTrapTag } from "#app/data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";

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

    const player = game.scene.getPlayerParty()[0];
    expect(player.hp).toBe(player.getMaxHp());
  });

  it("should damage opposing pokemon that are forced to switch in", async () => {
    game.override.startingWave(5);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    game.move.select(MoveId.SPIKES);
    await game.toNextTurn();

    game.move.select(MoveId.ROAR);
    await game.toNextTurn();

    const enemy = game.scene.getEnemyParty()[0];
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

    const enemy = game.scene.getEnemyParty()[0];
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should work when all targets fainted", async () => {
    game.override.enemySpecies(SpeciesId.DIGLETT).battleStyle("double").startingLevel(50);
    await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.ROWLET]);

    game.move.select(MoveId.EARTHQUAKE);
    game.move.select(MoveId.SPIKES, 1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTrapTag, ArenaTagSide.ENEMY)).toBeDefined();
  });
});
