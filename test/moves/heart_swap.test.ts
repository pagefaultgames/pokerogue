import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { BATTLE_STATS } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveEndPhase } from "#app/phases/move-end-phase";

describe("Moves - Heart Swap", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.INDEEDEE)
      .enemyLevel(200)
      .moveset([MoveId.HEART_SWAP])
      .ability(AbilityId.NONE);
  });

  it("should swap all of the user's stat stages with the target's", async () => {
    await game.classicMode.startBattle([SpeciesId.MANAPHY]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy.summonData, "statStages", "get").mockReturnValue(new Array(BATTLE_STATS.length).fill(1));

    game.move.select(MoveId.HEART_SWAP);

    await game.phaseInterceptor.to(MoveEndPhase);

    for (const s of BATTLE_STATS) {
      expect(player.getStatStage(s)).toBe(0);
      expect(enemy.getStatStage(s)).toBe(1);
    }

    await game.phaseInterceptor.to(TurnEndPhase);

    for (const s of BATTLE_STATS) {
      expect(enemy.getStatStage(s)).toBe(0);
      expect(player.getStatStage(s)).toBe(1);
    }
  });
});
