import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase, EnemyCommandPhase,
  TurnStartPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Moves} from "#app/data/enums/moves";
import {Command} from "#app/ui/command-ui-handler";
import {Stat} from "#app/data/pokemon-stat";
import TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import {Button} from "#app/enums/buttons";


describe("Battle order", () => {
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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
  });

  it("opponent faster than player 150 vs 50", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;
    game.scene.getParty()[0].stats[Stat.SPD] = 50;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.whenAboutToRun(TurnStartPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(2);
    expect(order[1]).toBe(0);
  }, 20000);

  it("double - opponents faster than player 150 vs 50", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;
    game.scene.getParty()[0].stats[Stat.SPD] = 50;
    game.scene.getParty()[1].stats[Stat.SPD] = 50;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    game.onNextPrompt("SelectTargetPhase", Mode.TARGET_SELECT, () => {
      const handler = game.scene.ui.getHandler() as TargetSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    game.onNextPrompt("SelectTargetPhase", Mode.TARGET_SELECT, () => {
      const handler = game.scene.ui.getHandler() as TargetSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.runFrom(CommandPhase).to(EnemyCommandPhase);
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.whenAboutToRun(TurnStartPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(2);
    expect(order[1]).toBe(3);
    expect(order[2]).toBe(0);
    expect(order[3]).toBe(1);
  }, 20000);

  it("Player faster than opponent 50 vs 150", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 50;
    game.scene.getParty()[0].stats[Stat.SPD] = 150;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.whenAboutToRun(TurnStartPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  }, 20000);

  it("speed tie 150", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;
    game.scene.getParty()[0].stats[Stat.SPD] = 150;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.whenAboutToRun(TurnStartPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  }, 20000);

  it("speed tie 50", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 50;
    game.scene.getParty()[0].stats[Stat.SPD] = 50;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.whenAboutToRun(TurnStartPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  }, 20000);
});
