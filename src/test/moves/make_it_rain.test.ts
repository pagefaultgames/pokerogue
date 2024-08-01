import { BattleStat } from "#app/data/battle-stat.js";
import {
  CommandPhase,
  MoveEndPhase,
  StatChangePhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

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

  it("should only reduce Sp. Atk. once in a double battle", async () => {
    await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    expect(playerPokemon.length).toBe(2);
    playerPokemon.forEach(p => expect(p).toBeDefined());

    const enemyPokemon = game.scene.getEnemyField();
    expect(enemyPokemon.length).toBe(2);
    enemyPokemon.forEach(p => expect(p).toBeDefined());

    game.doAttack(getMovePosition(game.scene, 0, Moves.MAKE_IT_RAIN));

    await game.phaseInterceptor.to(CommandPhase);
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon[0].summonData.battleStats[BattleStat.SPATK]).toBe(-1);
  }, TIMEOUT);

  it("should apply effects even if the target faints", async () => {
    game.override.enemyLevel(1); // ensures the enemy will faint
    game.override.battleType("single");

    await game.startBattle([Species.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon();
    expect(playerPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.MAKE_IT_RAIN));

    await game.phaseInterceptor.to(StatChangePhase);

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(-1);
  }, TIMEOUT);

  it("should reduce Sp. Atk. once after KOing two enemies", async () => {
    game.override.enemyLevel(1); // ensures the enemy will faint

    await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    playerPokemon.forEach(p => expect(p).toBeDefined());

    const enemyPokemon = game.scene.getEnemyField();
    enemyPokemon.forEach(p => expect(p).toBeDefined());

    game.doAttack(getMovePosition(game.scene, 0, Moves.MAKE_IT_RAIN));

    await game.phaseInterceptor.to(CommandPhase);
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(StatChangePhase);

    enemyPokemon.forEach(p => expect(p.isFainted()).toBe(true));
    expect(playerPokemon[0].summonData.battleStats[BattleStat.SPATK]).toBe(-1);
  }, TIMEOUT);
});
