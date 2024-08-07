import { SPLASH_ONLY } from "../utils/testUtils";
import { BerryPhase } from "#app/phases.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BattleStat } from "#app/data/battle-stat";

const TIMEOUT = 20 * 1000;

describe("Moves - Parting Shot", () => {
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
    game.override.battleType("single");
    game.override.moveset([Moves.PARTING_SHOT, Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(5);
    game.override.enemyLevel(5);

  });

  test(
    "Parting Shot when buffed by prankster should fail against dark types",
    async () => {
      game.override
        .enemySpecies(Species.POOCHYENA)
        .ability(Abilities.PRANKSTER);
      await game.startBattle([Species.MURKROW, Species.MEOWTH]);

      game.doAttack(getMovePosition(game.scene, 0, Moves.PARTING_SHOT));

      await game.phaseInterceptor.to(BerryPhase, false);
      const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
      expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
      expect(battleStatsOpponent[BattleStat.SPATK]).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  test(
    "Parting shot should fail against good as gold ability",
    async () => {
      game.override
        .enemySpecies(Species.GHOLDENGO)
        .enemyAbility(Abilities.GOOD_AS_GOLD);
      await game.startBattle([Species.MURKROW, Species.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.PARTING_SHOT));

      await game.phaseInterceptor.to(BerryPhase, false);
      const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
      expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
      expect(battleStatsOpponent[BattleStat.SPATK]).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );
});
