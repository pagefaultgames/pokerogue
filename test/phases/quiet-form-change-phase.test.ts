import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.field.mockAbility(
      morpeko,
      p => (p.getFormKey() === "hangry" ? AbilityId.INTIMIDATE : AbilityId.INTREPID_SWORD),
      true,
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

  it("should not trigger infinite loops with custom passives on castform", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.CASTFORM);

    const castform = game.scene.getPlayerParty()[1];
    expect(castform.getFormKey()).toBe("");

    // Create a loop of back and forth sun/rain
    game.field.mockAbility(
      castform,
      p => {
        switch (p.getFormKey()) {
          case "sunny":
            return AbilityId.DRIZZLE;
          case "rainy":
            return AbilityId.DROUGHT;
          default:
            return AbilityId.DRIZZLE;
        }
      },
      true,
    );

    game.doSwitchPokemon(1);
    await game.toEndOfTurn();

    // normal -> water -> fire -> water -> STOP
    expect(game.phaseInterceptor.log).toContain("QuietFormChangePhase");
    expect(castform.getFormKey()).toBe("rainy");
    expect(game).toHaveWeather(WeatherType.RAIN);
    expect(castform).toHaveAbilityApplied(AbilityId.DRIZZLE);
    expect(castform).toHaveAbilityApplied(AbilityId.DROUGHT);
    expect(castform).not.toHaveAbilityApplied(AbilityId.SNOW_WARNING);
    expect(castform).not.toHaveAbilityApplied(AbilityId.CLOUD_NINE);
  });
});
