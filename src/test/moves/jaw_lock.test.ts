import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import * as overrides from "#app/overrides";
import {
  DamagePhase,
  MoveEffectPhase,
  TurnEndPhase,
  VictoryPhase
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Jaw Lock", () => {
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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.STURDY);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.JAW_LOCK]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  test("move should add BattlerTag to both Pokemon", async () => {
    await game.startBattle([ Species.BULBASAUR ]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.JAW_LOCK));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeDefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeDefined();
  }, TIMEOUT);

  test("move should not add BattlerTag to either Pokemon if enemy faints in 1 hit", async () => {
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);

    await game.startBattle([ Species.BULBASAUR ]);

    const leadPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.JAW_LOCK));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
  }, TIMEOUT);

  test("BattlerTag should be removed after fainting", async () => {
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    await game.startBattle([ Species.BULBASAUR ]);

    const leadPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.JAW_LOCK));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();

    await game.phaseInterceptor.to(DamagePhase, false);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeDefined();
    expect(enemyPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.JAW_LOCK));

    await game.phaseInterceptor.to(VictoryPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.JAW_LOCK)).toBeUndefined();
  }, TIMEOUT);
});
