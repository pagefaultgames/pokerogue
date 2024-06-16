import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import * as overrides from "#app/overrides";
import { TurnEndPhase } from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Damp", () => {
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
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("prevents self-destruction effect on explosive attacks", async() => {
    const moveToUse = Moves.EXPLOSION;
    const enemyAbility = Abilities.DAMP;

    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BIDOOF);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("FaintPhase");
  }, TIMEOUT);

  // Invalid if aftermath.test.ts has a failure.
  it("silently prevents Aftermath from triggering", async() => {
    const moveToUse = Moves.TACKLE;
    const playerAbility = Abilities.DAMP;
    const enemyAbility = Abilities.AFTERMATH;

    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(playerAbility);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BIDOOF);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    game.scene.getEnemyParty()[0].hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(game.scene.getParty()[0].getHpRatio()).toBe(1);
  }, TIMEOUT);

  // Ensures fix of #1476.
  it("does not show ability popup during AI calculations", async() => {
    const moveToUse = Moves.EXPLOSION;
    const enemyAbility = Abilities.DAMP;

    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BIDOOF);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, TIMEOUT);

  // TODO Test some of the other AbAttrs that use `args`
  // BattlerTagImmunityAbAttr, StatusEffectImmunityAbAttr
});
