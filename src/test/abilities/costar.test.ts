import { Stat } from "#enums/stat";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { CommandPhase } from "#app/phases/command-phase";
import { MessagePhase } from "#app/phases/message-phase";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

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
    "ability copies positive stat stages",
    async () => {
      game.override.enemyAbility(Abilities.BALL_FETCH);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

      game.move.select(Moves.NASTY_PLOT);
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH, 1);
      await game.toNextTurn();

      expect(leftPokemon.getStatStage(Stat.SPATK)).toBe(2);
      expect(rightPokemon.getStatStage(Stat.SPATK)).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(CommandPhase);
      game.doSwitchPokemon(2);
      await game.phaseInterceptor.to(MessagePhase);

      [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon.getStatStage(Stat.SPATK)).toBe(2);
      expect(rightPokemon.getStatStage(Stat.SPATK)).toBe(2);
    },
    TIMEOUT,
  );

  test(
    "ability copies negative stat stages",
    async () => {
      game.override.enemyAbility(Abilities.INTIMIDATE);

      await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.FLAMIGO]);

      let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

      expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);
      expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(CommandPhase);
      game.doSwitchPokemon(2);
      await game.phaseInterceptor.to(MessagePhase);

      [leftPokemon, rightPokemon] = game.scene.getPlayerField();
      expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);
      expect(rightPokemon.getStatStage(Stat.ATK)).toBe(-2);
    },
    TIMEOUT,
  );
});
