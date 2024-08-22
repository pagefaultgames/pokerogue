import { getMoveTargets } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { Species } from "#app/enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

  it("2v2 (immune) - target all near others - check modifier", () => checkTargetMultiplier(game, Moves.EARTHQUAKE, false, false, true, Abilities.LEVITATE), TIMEOUT);

  it("2v2 (immune) - target all near others - damage decrase", () => checkDamageDecrease(game, Moves.EARTHQUAKE, false, false, true, Abilities.LEVITATE), TIMEOUT);

  it("2v2 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, false, false, true), TIMEOUT);

  it("2v2 - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, false, true), TIMEOUT);

  it("2v1 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, false, true, false), TIMEOUT);

  it("2v1 - target all near enemies - no damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, true, false), TIMEOUT);

  it("1v2 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, true, false, true), TIMEOUT);

  it("1v2 - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, true, false, true), TIMEOUT);

  it("1v1 - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, true, true, false), TIMEOUT);

  it("2v2 (immune) - target all near enemies - check modifier", () => checkTargetMultiplier(game, Moves.HYPER_VOICE, false, false, true, Abilities.SOUNDPROOF), TIMEOUT);

  it("2v2 (immune) - target all near enemies - damage decrase", () => checkDamageDecrease(game, Moves.HYPER_VOICE, false, false, true, Abilities.SOUNDPROOF), TIMEOUT);

});

async function checkTargetMultiplier(game: GameManager, attackMove: Moves, killAlly: boolean, killSecondEnemy: boolean, shouldMultiplied: boolean, oppAbility?: Abilities) {
  // play an attack and check target count
  game.override.enemyAbility(oppAbility ? oppAbility : Abilities.BALL_FETCH);
  await game.classicMode.startBattle();

  const playerPokemonRepr = game.scene.getPlayerField();

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
  await game.classicMode.runToSummon([Species.EEVEE, Species.EEVEE]);

  if (ability !== undefined) {
    game.scene.getPlayerField()[1].abilityIndex = ability;
    game.scene.getEnemyField()[1].abilityIndex = ability;
  }

  game.move.select(Moves.SPLASH);
  game.move.select(Moves.SPLASH, 1);


  await game.phaseInterceptor.to(TurnEndPhase);

  killAllyAndEnemy(game, killAlly, killSecondEnemy);
  await game.toNextTurn();

  const initialHp = game.scene.getEnemyField()[0].hp;
  game.move.select(attackMove);
  if (!killAlly) {
    game.move.select(Moves.SPLASH, 1);
  }

  await game.phaseInterceptor.to(TurnEndPhase);
  const afterHp = game.scene.getEnemyField()[0].hp;

  killAllyAndEnemy(game, true, true);
  await game.toNextTurn();

  game.scene.getEnemyField()[0].hp = initialHp;

  const initialHp1v1 = game.scene.getEnemyField()[0].hp;
  game.move.select(attackMove);

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
  game.override
    .battleType("double")
    .moveset([Moves.EARTHQUAKE, Moves.HYPER_VOICE, Moves.SURF, Moves.SPLASH])
    .ability(Abilities.BALL_FETCH)
    .passiveAbility(Abilities.UNNERVE)
    .enemyMoveset(SPLASH_ONLY)
    .disableCrits()
    .startingLevel(50)
    .enemyLevel(40)
    .enemySpecies(Species.EEVEE);
  return game;
}

function afterTrial(game: GameManager) {
  game.phaseInterceptor.restoreOg();
}
