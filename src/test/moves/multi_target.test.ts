import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { getMoveTargets } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";

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
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.scene.battleStyle = 1;
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE, Moves.HYPER_VOICE, Moves.SURF, Moves.BREAKING_SWIPE]);
  });


  it("2v2 - target all near others - all alive", () => checkTargetCount(game, Moves.EARTHQUAKE, false, false, 3), TIMEOUT);

  it("2v1 - target all near others - one enemy dead", () => checkTargetCount(game, Moves.EARTHQUAKE, false, true, 2), TIMEOUT);

  it("1v2 - target all near others - ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, false, 2), TIMEOUT);

  it("1v1 - target all near others - one enemy and the ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, true, 1), TIMEOUT);

  it("2v2 - target all near others - enemy has immunity", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);
    checkTargetCount(game, Moves.EARTHQUAKE, false, false, 3);
  }, TIMEOUT);

  it("2v2 - target all near enemies - all alive", () => checkTargetCount(game, Moves.HYPER_VOICE, false, false, 2), TIMEOUT);

  it("2v1 - target all near enemies - one enemy dead", () => checkTargetCount(game, Moves.HYPER_VOICE, false, true, 1), TIMEOUT);

  it("1v2 - target all near enemies - ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, false, 2), TIMEOUT);

  it("1v1 - target all near enemies - one enemy and the ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, true, 1), TIMEOUT);

  it("2v2 - target all near enemies - enemy has immunity",() => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);
    checkTargetCount(game, Moves.HYPER_VOICE, false, false, 2);
  }, TIMEOUT);

});

async function checkTargetCount(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, expectedTargetCount: integer) {
  // play an attack and check target count
  await game.startBattle();

  const playerPokemons = game.scene.getParty();
  const enemyPokemons = game.scene.getEnemyParty();

  if (killAlly) {
    for (let i = 1; i < playerPokemons.length; i++) {
      game.killPokemon(playerPokemons[i]);
    }
    expect(game.scene.getPlayerField().filter(p => p.isActive()).length).toBe(1);
  }
  if (killSecondEnemy) {
    for (let i = 1; i < enemyPokemons.length; i++) {
      game.killPokemon(enemyPokemons[i]);
    }
    expect(game.scene.getEnemyField().filter(p => p.isActive()).length).toBe(1);
  }

  const targetCount = getMoveTargets(playerPokemons[0], attackMove).targets.length;
  expect(targetCount).toBe(expectedTargetCount);
}
