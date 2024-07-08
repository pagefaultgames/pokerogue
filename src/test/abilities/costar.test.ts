import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import Phaser from "phaser";
import * as Overrides from "#app/overrides";
import { BattleStat } from "#app/data/battle-stat.js";
import { CommandPhase, MessagePhase } from "#app/phases.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";

const TIMEOUT = 20 * 1000;

describe("Abilities - COSTAR", () => {
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
    vi.spyOn(Overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.COSTAR);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NASTY_PLOT]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });


  test(
    "ability copies positive stat changes",
    async () => {
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon).toBeDefined();
      expect(rightPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.NASTY_PLOT));
      await game.phaseInterceptor.to(CommandPhase);
      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
      await game.toNextTurn();

      expect(leftPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(+2);
      expect(rightPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(0);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(CommandPhase);
      game.doSwitchPokemon(2);
      await game.phaseInterceptor.to(MessagePhase);

      [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(+2);
      expect(rightPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(+2);
    },
    TIMEOUT,
  );

  test(
    "ability copies negative stat changes",
    async () => {
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTIMIDATE);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon).toBeDefined();
      expect(rightPokemon).toBeDefined();

      expect(leftPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-2);
      expect(leftPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-2);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(CommandPhase);
      game.doSwitchPokemon(2);
      await game.phaseInterceptor.to(MessagePhase);

      [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-2);
      expect(rightPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-2);
    },
    TIMEOUT,
  );
});
