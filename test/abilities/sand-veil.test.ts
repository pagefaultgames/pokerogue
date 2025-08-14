import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import type { StatMultiplierAbAttrParams } from "#types/ability-types";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

describe("Abilities - Sand Veil", () => {
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
      .moveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.MEOWSCARADA)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.TWISTER)
      .startingLevel(100)
      .enemyLevel(100)
      .weather(WeatherType.SANDSTORM)
      .battleStyle("double");
  });

  test("ability should increase the evasiveness of the source", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX, SpeciesId.BLISSEY]);

    const leadPokemon = game.scene.getPlayerField();

    vi.spyOn(leadPokemon[0], "getAbility").mockReturnValue(allAbilities[AbilityId.SAND_VEIL]);

    const sandVeilAttr = allAbilities[AbilityId.SAND_VEIL].getAttrs("StatMultiplierAbAttr")[0];
    vi.spyOn(sandVeilAttr, "apply").mockImplementation(({ stat, statVal }: StatMultiplierAbAttrParams) => {
      if (stat === Stat.EVA && game.scene.arena.weather?.weatherType === WeatherType.SANDSTORM) {
        statVal.value *= -1; // will make all attacks miss
        return true;
      }
      return false;
    });

    expect(leadPokemon[0].hasAbility(AbilityId.SAND_VEIL)).toBe(true);
    expect(leadPokemon[1].hasAbility(AbilityId.SAND_VEIL)).toBe(false);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    await game.phaseInterceptor.to(MoveEndPhase, false);

    expect(leadPokemon[0].isFullHp()).toBe(true);
    expect(leadPokemon[1].hp).toBeLessThan(leadPokemon[1].getMaxHp());
  });
});
