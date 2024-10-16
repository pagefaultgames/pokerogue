import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Stat, BATTLE_STATS } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { MoveEndPhase } from "#app/phases/move-end-phase";

describe("Moves - Guard Swap", () => {
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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.INDEEDEE)
      .enemyLevel(200)
      .moveset([ Moves.GUARD_SWAP ])
      .ability(Abilities.NONE);
  });

  it("should swap the user's DEF and SPDEF stat stages with the target's", async () => {
    await game.classicMode.startBattle([
      Species.INDEEDEE
    ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy.summonData, "statStages", "get").mockReturnValue(new Array(BATTLE_STATS.length).fill(1));

    game.move.select(Moves.GUARD_SWAP);

    await game.phaseInterceptor.to(MoveEndPhase);

    for (const s of BATTLE_STATS) {
      expect(player.getStatStage(s)).toBe(0);
      expect(enemy.getStatStage(s)).toBe(1);
    }

    await game.phaseInterceptor.to(TurnEndPhase);

    for (const s of BATTLE_STATS) {
      if (s === Stat.DEF || s === Stat.SPDEF) {
        expect(player.getStatStage(s)).toBe(1);
        expect(enemy.getStatStage(s)).toBe(0);
      } else {
        expect(player.getStatStage(s)).toBe(0);
        expect(enemy.getStatStage(s)).toBe(1);
      }
    }
  });
});
