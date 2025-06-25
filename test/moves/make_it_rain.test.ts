import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";

describe("Moves - Make It Rain", () => {
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
      .battleStyle("double")
      .moveset([MoveId.MAKE_IT_RAIN, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should only lower SPATK stat stage by 1 once in a double battle", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.MAKE_IT_RAIN);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });

  it("should apply effects even if the target faints", async () => {
    game.override
      .enemyLevel(1) // ensures the enemy will faint
      .battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.MAKE_IT_RAIN);

    await game.phaseInterceptor.to(StatStageChangePhase);

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });

  it("should reduce Sp. Atk. once after KOing two enemies", async () => {
    game.override.enemyLevel(1); // ensures the enemy will faint

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.MAKE_IT_RAIN);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(StatStageChangePhase);

    enemyPokemon.forEach(p => expect(p.isFainted()).toBe(true));
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });

  it("should lower SPATK stat stage by 1 if it only hits the second target", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.MAKE_IT_RAIN);
    game.move.select(MoveId.SPLASH, 1);

    // Make Make It Rain miss the first target
    await game.move.forceMiss(true);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });
});
