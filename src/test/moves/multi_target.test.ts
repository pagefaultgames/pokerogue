import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { getMoveTargets } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { Species } from "#app/enums/species.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { TurnEndPhase } from "#app/phases.js";

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

  it("2v2 - target all near others - check modifier", () => checkTargetMultiplier(game, Moves.EARTHQUAKE, false, false, true), TIMEOUT);

  it("2v2 - target all near others - damage decrase", () => checkDamageDecrease(game, Moves.EARTHQUAKE, false, false, true), TIMEOUT);

  it("2v1 - target all near others - check modifier", () => checkTargetMultiplier(game, Moves.EARTHQUAKE, false, true, true), TIMEOUT);

  it("2v1 - target all near others - damage decrase", () => checkDamageDecrease(game, Moves.EARTHQUAKE, false, true, true), TIMEOUT);

  it("1v2 - target all near others - check modifier", () => checkTargetMultiplier(game, Moves.EARTHQUAKE, true, false, true), TIMEOUT);

  it("1v2 - target all near others - damage decrase", () => checkDamageDecrease(game, Moves.EARTHQUAKE, true, false, true), TIMEOUT);

  it("1v1 - target all near others - check modifier", () => checkTargetMultiplier(game, Moves.EARTHQUAKE, true, true, false), TIMEOUT);

  it("2v2 (immune) - target all near others - check modifier", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);
    checkTargetMultiplier(game, Moves.EARTHQUAKE, false, false, true);
  }, TIMEOUT);

  it("2v2 (immune) - target all near others - damage decrase", () => checkDamageDecrease(game, Moves.EARTHQUAKE, false, false, true, Abilities.LEVITATE), TIMEOUT);

  it("2v2 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, false, false, true), TIMEOUT);

  it("2v2 - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, false, true), TIMEOUT);

  it("2v1 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, false, true, false), TIMEOUT);

  it("2v1 - target all near enemies - no damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, true, false), TIMEOUT);

  it("1v2 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, true, false, true), TIMEOUT);

  it("1v2 - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, true, false, true), TIMEOUT);

  it("1v1 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, true, true, false), TIMEOUT);

  it("2v2 (immune) - target all near enemies - check modifier", () => {
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SOUNDPROOF);
    checkTargetMultiplier(game, Moves.HYPER_VOICE, false, false, true);
  }, TIMEOUT);

  it("2v2 (immune) - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, false, true, Abilities.SOUNDPROOF), TIMEOUT);

});

async function checkTargetMultiplier(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, shouldMultiplied: boolean) {
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

async function checkDamageDecrease(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, shouldDecreased: boolean, ability?: Abilities) {
  // Tested combination on first turn, 1v1 on second turn
  await game.runToSummon([Species.EEVEE, Species.EEVEE]);

  if (ability !== undefined) {
    game.scene.getPlayerField()[1].abilityIndex = ability;
    game.scene.getEnemyField()[1].abilityIndex = ability;
  }

  game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
  game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));


  await game.phaseInterceptor.to(TurnEndPhase);

  killAllyAndEnemy(game, killAlly, killSecondEnemy);
  await game.toNextTurn();

  const initialHp = game.scene.getEnemyField()[0].hp;
  game.doAttack(getMovePosition(game.scene, 0, attackMove));
  if (!killAlly) {
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
  }

  await game.phaseInterceptor.to(TurnEndPhase);
  const afterHp = game.scene.getEnemyField()[0].hp;

  killAllyAndEnemy(game, true, true);
  await game.toNextTurn();

  game.scene.getEnemyField()[0].hp = initialHp;

  const initialHp1v1 = game.scene.getEnemyField()[0].hp;
  game.doAttack(getMovePosition(game.scene, 0, attackMove));

  await game.phaseInterceptor.to(TurnEndPhase);
  const afterHp1v1 = game.scene.getEnemyField()[0].hp;

  if (shouldDecreased) {
    expect(initialHp - afterHp).toBeLessThan(0.75 * (initialHp1v1 - afterHp1v1) + 2);
    expect(initialHp - afterHp).toBeGreaterThan(0.75 * (initialHp1v1 - afterHp1v1) - 2);
  } else {
    expect(initialHp - afterHp).toBeLessThan(initialHp1v1 - afterHp1v1 + 2);
    expect(initialHp - afterHp).toBeGreaterThan(initialHp1v1 - afterHp1v1 - 2);
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
    playerPokemons[i].hp = 0;
  }
  expect(playerPokemons.filter(pokemon => pokemon.hp > 0).length).toBe(1);
}

function leaveOneEnemyPokemon(game: GameManager) {
  const enemyPokemons = game.scene.getEnemyParty();
  for (let i = 1; i < enemyPokemons.length; i++) {
    enemyPokemons[i].hp = 0;
  }
}

function beforeTrial(phaserGame: Phaser.Game, single: boolean = false) {
  const game = new GameManager(phaserGame);
  vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
  vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
  vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE, Moves.HYPER_VOICE, Moves.SURF, Moves.SPLASH]);
  vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(50);
  vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(40);
  vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.EEVEE);
  return game;
}

function afterTrial(game: GameManager) {
  game.phaseInterceptor.restoreOg();
}
