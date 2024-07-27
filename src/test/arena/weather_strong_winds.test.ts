import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnStartPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { allMoves } from "#app/data/move.js";

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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(10);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.TAILLOW);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DELTA_STREAM);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.THUNDERBOLT, Moves.ICE_BEAM, Moves.ROCK_SLIDE]);
  });

  it("electric type move is not very effective on Rayquaza", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RAYQUAZA);

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
