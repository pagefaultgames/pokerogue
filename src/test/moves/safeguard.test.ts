import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase,
  SelectTargetPhase,
  TurnEndPhase,
} from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle.js";
import { Stat } from "#app/data/pokemon-stat";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";

const TIMEOUT = 20 * 1000;

const SAFEGUARD = Moves.SAFEGUARD;

describe("Moves - Safeguard", () => {
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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.AMOONGUSS);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DEOXYS);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPORE, Moves.SPORE, Moves.SPORE, Moves.SPORE]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SAFEGUARD, Moves.SAFEGUARD, Moves.SAFEGUARD, Moves.SAFEGUARD]);
  });
  it("protects from nuzzle status",
    async () => {

      vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SENTRET);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.NUZZLE,
        Moves.NUZZLE,
        Moves.NUZZLE,
        Moves.NUZZLE]);
      await game.startBattle([Species.DEOXYS]);
      const enemyPokemon = game.scene.getEnemyField();
      const playerPokemon = game.scene.getPlayerField();

      game.doAttack(getMovePosition(game.scene, 0, SAFEGUARD));

      expect(enemyPokemon[0].status).toBe(undefined);
      expect(playerPokemon[0].status).toBe(undefined);
    }, TIMEOUT
  );
  it("protects from spore",
    async () => {

      await game.startBattle([Species.DEOXYS]);
      const enemyPokemon = game.scene.getEnemyField();
      const playerPokemon = game.scene.getPlayerField();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SAFEGUARD));

      expect(enemyPokemon[0].status).toBe(undefined);
      expect(playerPokemon[0].status).toBe(undefined);
    }, TIMEOUT
  );
  it("protects ally from status",
    async () => {
      vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
      vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

      vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DEOXYS);
      vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.AMOONGUSS);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SAFEGUARD, Moves.SAFEGUARD, Moves.SAFEGUARD, Moves.SAFEGUARD]);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPORE, Moves.NUZZLE, Moves.SPORE, Moves.SPORE]);

      await game.startBattle([Species.AMOONGUSS, Species.FURRET]);
      game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 1;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPORE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.NUZZLE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyField();
      const playerPokemon = game.scene.getPlayerField();

      expect(enemyPokemon[0].status).toBe(undefined);
      expect(enemyPokemon[1].status).toBe(undefined);
      expect(playerPokemon[0].status).toBe(undefined);
      expect(playerPokemon[1].status).toBe(undefined);
    }, TIMEOUT
  );
  it("applys arena tag for 5 turns",
    async () => {

      await game.startBattle([Species.DEOXYS]);

      for (let i=0;i<5;i++) {
        game.doAttack(getMovePosition(game.scene, 0, Moves.SAFEGUARD));
        await game.phaseInterceptor.to(CommandPhase);
      }

      expect(game.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, ArenaTagSide.PLAYER)).toBeUndefined();
    }, TIMEOUT
  );
});
