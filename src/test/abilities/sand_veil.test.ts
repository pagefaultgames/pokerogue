import { StatMultiplierAbAttr, allAbilities } from "#app/data/ability";
import { Stat } from "#enums/stat";
import { WeatherType } from "#app/data/weather";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

const TIMEOUT = 20 * 1000;

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
    game.override.moveset([Moves.SPLASH]);
    game.override.enemySpecies(Species.MEOWSCARADA);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset([Moves.TWISTER, Moves.TWISTER, Moves.TWISTER, Moves.TWISTER]);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override
      .weather(WeatherType.SANDSTORM)
      .battleType("double");
  });

  test(
    "ability should increase the evasiveness of the source",
    async () => {
      await game.startBattle([Species.SNORLAX, Species.BLISSEY]);

      const leadPokemon = game.scene.getPlayerField();

      vi.spyOn(leadPokemon[0], "getAbility").mockReturnValue(allAbilities[Abilities.SAND_VEIL]);

      const sandVeilAttr = allAbilities[Abilities.SAND_VEIL].getAttrs(StatMultiplierAbAttr)[0];
      vi.spyOn(sandVeilAttr, "applyStatStage").mockImplementation(
        (_pokemon, _passive, _simulated, stat, statValue, _args) => {
          if (stat === Stat.EVA && game.scene.arena.weather?.weatherType === WeatherType.SANDSTORM) {
            statValue.value *= -1; // will make all attacks miss
            return true;
          }
          return false;
        }
      );

      expect(leadPokemon[0].hasAbility(Abilities.SAND_VEIL)).toBe(true);
      expect(leadPokemon[1].hasAbility(Abilities.SAND_VEIL)).toBe(false);

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon[0].isFullHp()).toBe(true);
      expect(leadPokemon[1].hp).toBeLessThan(leadPokemon[1].getMaxHp());
    }, TIMEOUT
  );
});
