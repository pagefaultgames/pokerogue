import { BattleStat } from "#app/data/battle-stat.js";
import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { CommandPhase, MessagePhase } from "#app/phases.js";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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
    game.override.battleType("double");
    game.override.ability(Abilities.COSTAR);
    game.override.moveset([Moves.SPLASH, Moves.NASTY_PLOT]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });


  test(
    "ability copies positive stat changes",
    async () => {
      game.override.enemyAbility(Abilities.BALL_FETCH);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

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
      game.override.enemyAbility(Abilities.INTIMIDATE);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

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
