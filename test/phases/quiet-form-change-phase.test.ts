import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Phases - Quiet Form Change Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .hasPassiveAbility(true)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should trigger any on-summon abilities when switching forms", async () => {
    await game.classicMode.startBattle(SpeciesId.MORPEKO);

    const morpeko = game.field.getPlayerPokemon();
    expect(morpeko.getFormKey()).toBe("full-belly");

    // give each form a different passive, both of which activate on switch-in
    vi.spyOn(morpeko.species, "getPassiveAbility").mockImplementation((idx = morpeko.species.formIndex) =>
      idx === 1 ? AbilityId.INTIMIDATE : AbilityId.INTREPID_SWORD,
    );

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.phaseInterceptor.log).toContain("QuietFormChangePhase");
    expect(morpeko.getFormKey()).toBe("hangry");
    expect(morpeko.getPassiveAbility().id).toBe(AbilityId.INTIMIDATE);
    expect(morpeko).toHaveAbilityApplied(AbilityId.INTIMIDATE);
    expect(morpeko).not.toHaveAbilityApplied(AbilityId.INTREPID_SWORD);
    morpeko.waveData.abilitiesApplied.clear();
    game.phaseInterceptor.clearLogs();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.phaseInterceptor.log).toContain("QuietFormChangePhase");
    expect(morpeko.getFormKey()).toBe("full-belly");
    expect(morpeko.getPassiveAbility().id).toBe(AbilityId.INTREPID_SWORD);
    expect(morpeko).toHaveAbilityApplied(AbilityId.INTREPID_SWORD);
    expect(morpeko).not.toHaveAbilityApplied(AbilityId.INTIMIDATE);
  });
});
