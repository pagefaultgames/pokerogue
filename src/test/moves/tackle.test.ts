import { Stat } from "#app/data/pokemon-stat";
import {
  CommandPhase,
  EnemyCommandPhase, TurnEndPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Moves - Tackle", () => {
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
    const moveToUse = Moves.TACKLE;
    game.override.battleType("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.startingLevel(1);
    game.override.startingWave(97);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.GROWTH,Moves.GROWTH,Moves.GROWTH,Moves.GROWTH]);
    game.override.disableCrits();
  });

  it("TACKLE against ghost", async() => {
    const moveToUse = Moves.TACKLE;
    game.override.enemySpecies(Species.GENGAR);
    await game.startBattle([
      Species.MIGHTYENA,
    ]);
    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;
    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBe(0);
  }, 20000);

  it("TACKLE against not resistant", async() => {
    const moveToUse = Moves.TACKLE;
    await game.startBattle([
      Species.MIGHTYENA,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.DEF] = 50;
    game.scene.getParty()[0].stats[Stat.ATK] = 50;


    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBeGreaterThan(0);
    expect(hpLost).toBe(4);
  }, 20000);
});
