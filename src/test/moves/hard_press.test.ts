import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEffectPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { applyMoveAttrs, VariablePowerAttr } from "#app/data/move";
import * as Utils from "#app/utils";
import { Stat } from "#enums/stat";

/**
   * Checks the base power of the {@linkcode intendedMove} before and after any
   * {@linkcode VariablePowerAttr}s have been applied.
   * @param phase current {@linkcode MoveEffectPhase}
   * @param intendedMove Expected move during this {@linkcode phase}
   * @param before Expected base power before any base power changes
   * @param after Expected base power after any base power changes
   */
const checkBasePowerChanges = (phase: MoveEffectPhase, intendedMove: Moves, before: number, after: number) => {
  // Double check if the intended move was used and verify its initial base power
  const move = phase.move.getMove();
  expect(move.id).toBe(intendedMove);
  expect(move.power).toBe(before);

  /** Mocking application of {@linkcode VariablePowerAttr} */
  const power = new Utils.IntegerHolder(move.power);
  applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
  expect(power.value).toBe(after);
};

describe("Moves - Hard Press", () => {
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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HARD_PRESS ]);
  });

  it("HARD_PRESS varies based on target health ratio (100%)", async () => {
    await game.startBattle([ Species.GRAVELER ]);
    const moveToUse = Moves.HARD_PRESS;

    // Force party to go first
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    checkBasePowerChanges(game.scene.getCurrentPhase() as MoveEffectPhase, moveToUse, -1, 100);
  });

  it("HARD_PRESS varies based on target health ratio (50%)", async () => {
    await game.startBattle([ Species.GRAVELER ]);
    const moveToUse = Moves.HARD_PRESS;
    const enemy = game.scene.getEnemyParty()[0];

    // Force party to go first
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    enemy.stats[Stat.SPD] = 1;

    // Halve the enemy's HP
    enemy.hp /= 2;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    checkBasePowerChanges(game.scene.getCurrentPhase() as MoveEffectPhase, moveToUse, -1, 50);
  });

  it("HARD_PRESS varies based on target health ratio (1%)", async () => {
    await game.startBattle([ Species.GRAVELER ]);
    const moveToUse = Moves.HARD_PRESS;
    const enemy = game.scene.getEnemyParty()[0];

    // Force party to go first
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    enemy.stats[Stat.SPD] = 1;

    // Force enemy to have 1% of full health
    enemy.stats[Stat.HP] = 100;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    checkBasePowerChanges(game.scene.getCurrentPhase() as MoveEffectPhase, moveToUse, -1, 1);
  });

  it("HARD_PRESS varies based on target health ratio, (<1%)", async () => {
    await game.startBattle([ Species.GRAVELER ]);
    const moveToUse = Moves.HARD_PRESS;
    const enemy = game.scene.getEnemyParty()[0];

    // Force party to go first
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    enemy.stats[Stat.SPD] = 1;

    // Force enemy to have less than 1% of full health
    enemy.stats[Stat.HP] = 1000;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    checkBasePowerChanges(game.scene.getCurrentPhase() as MoveEffectPhase, moveToUse, -1, 1);
  });

  it("HARD_PRESS varies based on target health ratio, random", async () => {
    await game.startBattle([ Species.GRAVELER ]);
    const moveToUse = Moves.HARD_PRESS;
    const enemy = game.scene.getEnemyParty()[0];

    // Force party to go first
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    enemy.stats[Stat.SPD] = 1;

    // Force a random n / 100 ratio with the enemy's HP
    enemy.stats[Stat.HP] = 100;
    enemy.hp = Utils.randInt(99, 1);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Because the ratio is n / 100 and the max base power of the move is 100, the resultant base power should just be n
    checkBasePowerChanges(game.scene.getCurrentPhase() as MoveEffectPhase, moveToUse, -1, enemy.hp);
  });
});
