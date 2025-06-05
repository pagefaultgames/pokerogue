import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Perish Song", () => {
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
    game.override.battleStyle("single");
    game.override.disableCrits();

    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    game.override.starterSpecies(SpeciesId.CURSOLA);
    game.override.ability(AbilityId.PERISH_BODY);
    game.override.moveset([MoveId.SPLASH]);
  });

  it("should trigger when hit with damaging move", async () => {
    game.override.enemyMoveset([MoveId.AQUA_JET]);
    await game.classicMode.startBattle();
    const cursola = game.scene.getPlayerPokemon();
    const magikarp = game.scene.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(cursola?.summonData.tags[0].turnCount).toBe(3);
    expect(magikarp?.summonData.tags[0].turnCount).toBe(3);
  });

  it("should trigger even when fainting", async () => {
    game.override.enemyMoveset([MoveId.AQUA_JET]).enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle([SpeciesId.CURSOLA, SpeciesId.FEEBAS]);
    const magikarp = game.scene.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(magikarp?.summonData.tags[0].turnCount).toBe(3);
  });

  it("should not activate if attacker already has perish song", async () => {
    game.override.enemyMoveset([MoveId.PERISH_SONG, MoveId.AQUA_JET, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.CURSOLA]);
    const feebas = game.scene.getPlayerPokemon();
    const magikarp = game.scene.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.PERISH_SONG);
    await game.toNextTurn();

    expect(feebas?.summonData.tags[0].turnCount).toBe(3);
    expect(magikarp?.summonData.tags[0].turnCount).toBe(3);

    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const cursola = game.scene.getPlayerPokemon();
    expect(cursola?.summonData.tags.length).toBe(0);
    expect(magikarp?.summonData.tags[0].turnCount).toBe(2);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.AQUA_JET);
    await game.toNextTurn();

    expect(cursola?.summonData.tags.length).toBe(0);
    expect(magikarp?.summonData.tags[0].turnCount).toBe(1);
  });

  it("should activate if cursola already has perish song, but not reset its counter", async () => {
    game.override.enemyMoveset([MoveId.PERISH_SONG, MoveId.AQUA_JET, MoveId.SPLASH]);
    game.override.moveset([MoveId.WHIRLWIND, MoveId.SPLASH]);
    game.override.startingWave(5);
    await game.classicMode.startBattle([SpeciesId.CURSOLA]);
    const cursola = game.scene.getPlayerPokemon();

    game.move.select(MoveId.WHIRLWIND);
    await game.move.selectEnemyMove(MoveId.PERISH_SONG);
    await game.toNextTurn();

    const magikarp = game.scene.getEnemyPokemon();
    expect(cursola?.summonData.tags[0].turnCount).toBe(3);
    expect(magikarp?.summonData.tags.length).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.AQUA_JET);
    await game.toNextTurn();

    expect(cursola?.summonData.tags[0].turnCount).toBe(2);
    expect(magikarp?.summonData.tags.length).toBe(1);
    expect(magikarp?.summonData.tags[0].turnCount).toBe(3);
  });
});
