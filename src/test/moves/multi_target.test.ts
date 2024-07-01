import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { getMoveTargets } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { Species } from "#app/enums/species.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Multi target", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    afterTrial(game);
  });

  beforeEach(() => {
    game = beforeTrial(phaserGame);
  });

  it("2v2 - target all near others - all alive", () => checkTargetCount(game, Moves.EARTHQUAKE, false, false, true), TIMEOUT);

  it("2v1 - target all near others - one enemy dead", () => checkTargetCount(game, Moves.EARTHQUAKE, false, true, true), TIMEOUT);

  it("1v2 - target all near others - ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, false, true), TIMEOUT);

  it("1v1 - target all near others - one enemy and the ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, true, false), TIMEOUT);

  it("2v2 - target all near others - enemy has immunity", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);
    checkTargetCount(game, Moves.EARTHQUAKE, false, false, true);
  }, TIMEOUT);

  it("2v2 - target all near enemies - all alive", () => checkTargetCount(game, Moves.HYPER_VOICE, false, false, true), TIMEOUT);

  it("2v1 - target all near enemies - one enemy dead", () => checkTargetCount(game, Moves.HYPER_VOICE, false, true, false), TIMEOUT);

  it("1v2 - target all near enemies - ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, false, true), TIMEOUT);

  it("1v1 - target all near enemies - one enemy and the ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, true, false), TIMEOUT);

  it("2v2 - target all near enemies - enemy has immunity", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SOUNDPROOF);
    checkTargetCount(game, Moves.HYPER_VOICE, false, false, true);
  }, TIMEOUT);

});

async function checkTargetCount(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, shouldMultiplied: boolean) {
  // play an attack and check target count
  await game.startBattle();

  const playerPokemonRepr = game.scene.getPlayerField();
  expect(playerPokemonRepr).not.toBeUndefined();

  killAllyAndEnemy(game, killAlly, killSecondEnemy);

  const targetCount = getMoveTargets(playerPokemonRepr[0], attackMove).targets.length;
  const targetMultiplier = targetCount > 1 ? 0.75 : 1;

  if (shouldMultiplied) {
    expect(targetMultiplier).toBe(0.75);
  } else {
    expect(targetMultiplier).toBe(1);
  }
}

// To simulate the situation where all of the enemies or the player's Pokemons dies except for one.
function killAllyAndEnemy(game: GameManager, killAlly: boolean, killSecondEnemy: boolean) {
  if (killAlly) {
    leaveOnePlayerPokemon(game);
    expect(game.scene.getPlayerField().filter(p => p.isActive()).length).toBe(1);
  }
  if (killSecondEnemy) {
    leaveOneEnemyPokemon(game);
    expect(game.scene.getEnemyField().filter(p => p.isActive()).length).toBe(1);
  }
}

function leaveOnePlayerPokemon(game: GameManager) {
  const playerPokemons = game.scene.getParty();
  for (let i = 1; i < playerPokemons.length; i++) {
    game.killPokemon(playerPokemons[i]);
  }
}

function leaveOneEnemyPokemon(game: GameManager) {
  const enemyPokemons = game.scene.getEnemyParty();
  for (let i = 1; i < enemyPokemons.length; i++) {
    game.killPokemon(enemyPokemons[i]);
  }
}

function beforeTrial(phaserGame: Phaser.Game, single: boolean = false) {
  const game = new GameManager(phaserGame);
  vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.EEVEE);
  if (single) {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
  } else {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
  }
  vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE, Moves.HYPER_VOICE, Moves.SURF, Moves.SPLASH]);
  vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(150);
  vi.spyOn(overrides, "SEED_OVERRIDE", "get").mockReturnValue("ABCDEFGHI");
  return game;
}

function afterTrial(game: GameManager) {
  game.phaseInterceptor.restoreOg();
}
