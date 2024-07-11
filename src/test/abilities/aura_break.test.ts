import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { MoveEffectPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { allMoves } from "#app/data/move.js";

describe("Abilities - Aura Break", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const auraBreakMultiplier = 9 / 16;
  const auraMultiplier = 4 / 3;
  /**
   * Apparently, the auraMultiplier is being multiplied first to the move's power then multiplied again to
   * the auraBreakMultiplier. This means we can't net the multiplier like so:
   * power * (auraMultiplier * auraBreakMultiplier). Doing so will make the result off by a decimal value.
   */

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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.MOONBLAST, Moves.DARK_PULSE, Moves.MOONBLAST, Moves.DARK_PULSE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.AURA_BREAK);
  });

  it("reverses the effect of fairy aura", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FAIRY_AURA);
    const moveToCheck = allMoves[Moves.MOONBLAST];
    const basePower = moveToCheck.power;
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.MOONBLAST));

    const movePower = moveToCheck.calculatePower(game.scene.getPlayerPokemon(), game.scene.getEnemyPokemon());
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(movePower).toBe(basePower * auraMultiplier * auraBreakMultiplier);
  });

  it("reverses the effect of dark aura", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DARK_AURA);
    const moveToCheck = allMoves[Moves.DARK_PULSE];
    const basePower = moveToCheck.power;
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DARK_PULSE));

    const movePower = moveToCheck.calculatePower(game.scene.getPlayerPokemon(), game.scene.getEnemyPokemon());
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(movePower).toBe(basePower * auraMultiplier * auraBreakMultiplier);
  });
});
