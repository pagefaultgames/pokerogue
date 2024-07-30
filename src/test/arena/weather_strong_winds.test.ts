import { allMoves } from "#app/data/move.js";
import {
  TurnStartPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Weather - Strong Winds", () => {
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
    game.override.battleType("single");
    game.override.startingLevel(10);
    game.override.enemySpecies(Species.TAILLOW);
    game.override.enemyAbility(Abilities.DELTA_STREAM);
    game.override.moveset([Moves.THUNDERBOLT, Moves.ICE_BEAM, Moves.ROCK_SLIDE]);
  });

  it("electric type move is not very effective on Rayquaza", async () => {
    game.override.enemySpecies(Species.RAYQUAZA);

    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDERBOLT));

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[Moves.THUNDERBOLT].type, pikachu)).toBe(0.5);
  });

  it("electric type move is neutral for flying type pokemon", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDERBOLT));

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[Moves.THUNDERBOLT].type, pikachu)).toBe(1);
  });

  it("ice type move is neutral for flying type pokemon", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.ICE_BEAM));

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[Moves.ICE_BEAM].type, pikachu)).toBe(1);
  });

  it("rock type move is neutral for flying type pokemon", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.ROCK_SLIDE));

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[Moves.ROCK_SLIDE].type, pikachu)).toBe(1);
  });
});
