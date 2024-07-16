import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  CommandPhase,
  MoveEndPhase,
  StatChangePhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { BattleStat } from "#app/data/battle-stat.js";

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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.MAKE_IT_RAIN, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
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
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(1); // ensures the enemy will faint
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

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
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(1); // ensures the enemy will faint

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
