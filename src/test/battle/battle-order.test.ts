import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {
  CommandPhase, EnemyCommandPhase, SelectTargetPhase,
  TurnStartPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import {Stat} from "#app/data/pokemon-stat";
import TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import {Button} from "#enums/buttons";


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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MEWTWO);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
  });

  it("opponent faster than player 50 vs 150", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 50;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(2);
    expect(order[1]).toBe(0);
  }, 20000);

  it("Player faster than opponent 150 vs 50", async() => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 50;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.run(EnemyCommandPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  }, 20000);

  it("double - both opponents faster than player 50/50 vs 150/150", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 50;
    game.scene.getParty()[1].stats[Stat.SPD] = 50;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

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
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(0)).toBeGreaterThan(order.indexOf(2));
    expect(order.indexOf(0)).toBeGreaterThan(order.indexOf(3));
    expect(order.indexOf(1)).toBeGreaterThan(order.indexOf(2));
    expect(order.indexOf(1)).toBeGreaterThan(order.indexOf(3));
  }, 20000);

  it("double - speed tie except 1 - 100/100 vs 100/150", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    game.scene.getParty()[1].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

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
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(1));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(2));
  }, 20000);

  it("double - speed tie 100/150 vs 100/150", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    game.scene.getParty()[1].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

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
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(2));
  }, 20000);
});
