import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Phases - Quiet Form Change Phase", () => {
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
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .hasPassiveAbility(true)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should trigger any changed on-summon abilities when switching forms - passives", async () => {
    await game.classicMode.startBattle([SpeciesId.MORPEKO]);

    const morpeko = game.field.getPlayerPokemon();
    expect(morpeko.getFormKey()).toBe("full-belly");

    // give both forms 2 different passive abilities -
    // Hangry form gets Intimidate, full belly gets mold breaker (has msg)
    vi.spyOn(morpeko.species, "getPassiveAbility").mockImplementation((idx = morpeko.species.formIndex) =>
      idx === 1 ? AbilityId.INTIMIDATE : AbilityId.MOLD_BREAKER,
    );

    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(morpeko.getFormKey()).toBe("hangry");
    expect(morpeko.getPassiveAbility().id).toBe(AbilityId.INTIMIDATE);
    expect(morpeko).toHaveAbilityApplied(AbilityId.INTIMIDATE);
    morpeko.waveData.abilitiesApplied.clear();
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, -1);

    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(morpeko.getFormKey()).toBe("full-belly");
    expect(morpeko.getPassiveAbility().id).toBe(AbilityId.MOLD_BREAKER);
    expect(morpeko).toHaveAbilityApplied(AbilityId.MOLD_BREAKER);
  });

  it("should trigger any changed on-summon abilities when switching forms - actives", async () => {
    game.override.enemyAbility(AbilityId.SNOW_WARNING);
    await game.classicMode.startBattle([SpeciesId.TERAPAGOS]);

    const terapagos = game.field.getPlayerPokemon();
    expect(terapagos.getFormKey()).toBe("terastal");

    game.move.use(MoveId.SPLASH, undefined, undefined, true);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    // should have applied teraform zero due to having changed
    expect(terapagos.getFormKey()).toBe("stellar");
    expect(terapagos).toHaveAbilityApplied(AbilityId.TERAFORM_ZERO);

    await game.toEndOfTurn();

    expect(game).toHaveWeather(WeatherType.NONE);
  });
});
