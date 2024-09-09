import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";

const TIMEOUT = 20 * 1000;

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
    game.override.battleType("double");
    game.override.moveset([Moves.MAKE_IT_RAIN, Moves.SPLASH]);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  it("should only lower SPATK stat stage by 1 once in a double battle", async () => {
    await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.MAKE_IT_RAIN);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  }, TIMEOUT);

  it("should apply effects even if the target faints", async () => {
    game.override.enemyLevel(1); // ensures the enemy will faint
    game.override.battleType("single");

    await game.startBattle([Species.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.MAKE_IT_RAIN);

    await game.phaseInterceptor.to(StatStageChangePhase);

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  }, TIMEOUT);

  it("should reduce Sp. Atk. once after KOing two enemies", async () => {
    game.override.enemyLevel(1); // ensures the enemy will faint

    await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(Moves.MAKE_IT_RAIN);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to(StatStageChangePhase);

    enemyPokemon.forEach(p => expect(p.isFainted()).toBe(true));
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  }, TIMEOUT);

  it("should lower SPATK stat stage by 1 if it only hits the second target", async () => {
    await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.MAKE_IT_RAIN);
    game.move.select(Moves.SPLASH, 1);

    // Make Make It Rain miss the first target
    await game.move.forceMiss(true);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  }, TIMEOUT);
});
