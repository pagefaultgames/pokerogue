import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#app/enums/species.js";
import { Moves } from "#app/enums/moves.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Abilities } from "#app/enums/abilities.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Roost", () => {
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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.STARAPTOR);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.STOMPING_TANTRUM ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ROOST,Moves.ROOST,Moves.ROOST,Moves.ROOST]);
  });

  test(
    "move should ground the user until the end of turn",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.STOMPING_TANTRUM));

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(enemyPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      expect(enemyPokemon.getTag(BattlerTagType.ROOSTED)).toBeUndefined();
    }, TIMEOUT
  );
});
