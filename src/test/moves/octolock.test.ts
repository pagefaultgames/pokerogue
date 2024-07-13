import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { CommandPhase, MoveEndPhase, TurnInitPhase } from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {BattleStat} from "#app/data/battle-stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TrappedTag } from "#app/data/battler-tags.js";

describe("Moves - Octolock", () => {
  describe("integration tests", () => {
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

      vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);

      vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.OCTOLOCK, Moves.SPLASH]);
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    });

    it("Reduces DEf and SPDEF by 1 each turn", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.doAttack(getMovePosition(game.scene, 0, Moves.OCTOLOCK));
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-1);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-1);

      // take a second turn to make sure stat changes occur again
      await game.phaseInterceptor.to(CommandPhase);
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnInitPhase);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-2);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-2);
    });

    it("Traps the target pokemon", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // before Octolock - enemy should not be trapped
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeUndefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.OCTOLOCK));

      // after Octolock - enemy should be trapped
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeDefined();
    });
  });
});
