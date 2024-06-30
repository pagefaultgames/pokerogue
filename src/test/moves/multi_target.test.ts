import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { getMoveTargets } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { Stat } from "#app/data/pokemon-stat.js";
import { TurnEndPhase } from "#app/phases.js";
import { Species } from "#app/enums/species.js";
import * as Utils from "#app/utils";

const TIMEOUT = 20 * 1000;

describe("Moves - Multi target", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let battleSeed: string;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    battleSeed = Utils.randomString(16, true);
  });

  afterEach(() => {
    afterTrial(game);
  });

  beforeEach(() => {
    game = beforeTrial(phaserGame);
  });

  it("2v2 - target all near others - all alive", () => checkTargetCount(game, Moves.EARTHQUAKE, false, false, 3), TIMEOUT);

  it("2v1 - target all near others - one enemy dead", () => checkTargetCount(game, Moves.EARTHQUAKE, false, true, 2), TIMEOUT);

  it("1v2 - target all near others - ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, false, 2), TIMEOUT);

  it("1v1 - target all near others - one enemy and the ally dead", () => checkTargetCount(game, Moves.EARTHQUAKE, true, true, 1), TIMEOUT);

  it(
    "1v1 & 2v2 = target all near others - checking damage decreasemnt",
    async () => {
      await game.runToSummon([Species.EEVEE, Species.EEVEE]);

      game.scene.currentBattle.battleSeed = battleSeed;

      const playerPokemons = game.scene.getField();
      const enemyPokemons = game.scene.getEnemyField();

      // Settings
      playerPokemons[0].stats[Stat.ATK] = 100;
      playerPokemons[0].stats[Stat.SPATK] = 100;

      enemyPokemons[0].stats[Stat.DEF] = 100;
      enemyPokemons[0].stats[Stat.SPDEF] = 100;

      const initialOppHp = game.scene.getEnemyField()[0].hp;
      expect(playerPokemons[0].getMoveset().findIndex((move) => move.moveId === Moves.EARTHQUAKE)).not.toBeUndefined();
      expect(playerPokemons[1].getMoveset().findIndex((move) => move.moveId === Moves.SPLASH)).not.toBeUndefined();
      game.doAttack(getMovePosition(game.scene, 0, Moves.EARTHQUAKE));
      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);
      const afterOppHp = game.scene.getEnemyField()[0].hp;
      expect(afterOppHp).lessThan(initialOppHp);

      afterTrial(game);

      game = beforeTrial(phaserGame, true);
      await game.runToSummon([Species.EEVEE]);

      game.scene.currentBattle.battleSeed = battleSeed;

      // Settings
      playerPokemons[0].stats[Stat.ATK] = 100;
      playerPokemons[0].stats[Stat.SPATK] = 100;

      enemyPokemons[0].stats[Stat.DEF] = 100;
      enemyPokemons[0].stats[Stat.SPDEF] = 100;

      const initialOppHp1v1 = game.scene.getEnemyField()[0].hp;
      expect(playerPokemons[0].getMoveset().findIndex((move) => move.moveId === Moves.EARTHQUAKE)).not.toBeUndefined();
      game.doAttack(getMovePosition(game.scene, 0, Moves.EARTHQUAKE));

      await game.phaseInterceptor.to(TurnEndPhase);
      const afterOppHp1v1 = game.scene.getEnemyField()[0].hp;
      expect(afterOppHp1v1).lessThan(initialOppHp1v1);

      checkDamage(initialOppHp1v1 - afterOppHp1v1, initialOppHp - afterOppHp);
    }, TIMEOUT
  );

  it("2v2 - target all near others - enemy has immunity", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);
    checkTargetCount(game, Moves.EARTHQUAKE, false, false, 3);
  }, TIMEOUT);

  it("2v2 - target all near enemies - all alive", () => checkTargetCount(game, Moves.HYPER_VOICE, false, false, 2), TIMEOUT);

  it("2v1 - target all near enemies - one enemy dead", () => checkTargetCount(game, Moves.HYPER_VOICE, false, true, 1), TIMEOUT);

  it("1v2 - target all near enemies - ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, false, 2), TIMEOUT);

  it("1v1 - target all near enemies - one enemy and the ally dead", () => checkTargetCount(game, Moves.HYPER_VOICE, true, true, 1), TIMEOUT);

  it("2v2 - target all near enemies - enemy has immunity", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SOUNDPROOF);
    checkTargetCount(game, Moves.HYPER_VOICE, false, false, 2);
  }, TIMEOUT);

});

async function checkTargetCount(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, expectedTargetCount: integer) {
  // play an attack and check target count
  await game.startBattle();

  const playerPokemonRepr = game.scene.getPlayerField();
  expect(playerPokemonRepr).not.toBeUndefined();

  killAllyAndEnemy(game, killAlly, killSecondEnemy);

  const targetCount = getMoveTargets(playerPokemonRepr[0], attackMove).targets.length;

  expect(targetCount).toBe(expectedTargetCount);
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
  vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(200);
  return game;
}

function afterTrial(game: GameManager) {
  game.phaseInterceptor.restoreOg();
}

function checkDamage(damage1v1: number, damageToBeChecked: number) {
  expect(0.75 * damage1v1 - damageToBeChecked).greaterThan(-1);
  expect(0.75 * damage1v1 - damageToBeChecked).lessThan(1);
}
