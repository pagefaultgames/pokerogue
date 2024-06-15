import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { TurnEndPhase, } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { allMoves } from "#app/data/move.js";

describe("Abilities - Wonder Skin", () => {
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
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WONDER_SKIN);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.CHARM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("lowers accuracy of status moves to 50%", async () => {
    await game.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);

    const lastUsedMoveAccuracy = allMoves[attacker.getLastXMoves()[0].move].accuracy;

    expect(lastUsedMoveAccuracy).not.toBe(100);
    expect(lastUsedMoveAccuracy).toBe(50);
  });

  it("does not lower accuracy of non-status moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    await game.phaseInterceptor.to(TurnEndPhase);

    const lastUsedMoveAccuracy = allMoves[attacker.getLastXMoves()[0].move].accuracy;

    expect(lastUsedMoveAccuracy).toBe(100);
    expect(lastUsedMoveAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Mold Breaker", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MOLD_BREAKER);

    await game.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
    await game.phaseInterceptor.to(TurnEndPhase);

    const lastUsedMoveAccuracy = allMoves[attacker.getLastXMoves()[0].move].accuracy;

    expect(lastUsedMoveAccuracy).toBe(100);
    expect(lastUsedMoveAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Teravolt", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TERAVOLT);

    await game.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
    await game.phaseInterceptor.to(TurnEndPhase);

    const lastUsedMoveAccuracy = allMoves[attacker.getLastXMoves()[0].move].accuracy;

    expect(lastUsedMoveAccuracy).toBe(100);
    expect(lastUsedMoveAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Turboblaze", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TURBOBLAZE);

    await game.startBattle([Species.MAGIKARP]);

    const attacker = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
    await game.phaseInterceptor.to(TurnEndPhase);

    const lastUsedMoveAccuracy = allMoves[attacker.getLastXMoves()[0].move].accuracy;

    expect(lastUsedMoveAccuracy).toBe(100);
    expect(lastUsedMoveAccuracy).not.toBe(50);
  });
});
