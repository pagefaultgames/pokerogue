import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#app/data/enums/species";
import { CommandPhase, MoveEffectPhase, MovePhase, MoveEndPhase, SelectTargetPhase, TurnEndPhase } from "#app/phases";
import { Mode } from "#app/ui/ui";
import { Moves } from "#app/data/enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Stat } from "#app/data/pokemon-stat";
import TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import { Button } from "#app/enums/buttons";
import { applyMoveAttrs, VariablePowerAttr } from "#app/data/move";
import * as Utils from "#app/utils";

describe("Moves - Fusion Flare and Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const selectMovesDoubleBattle = (game: GameManager, moveOne: Moves, moveTwo: Moves) => {
    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveOne);
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
      const movePosition = getMovePosition(game.scene, 0, moveTwo);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    game.onNextPrompt("SelectTargetPhase", Mode.TARGET_SELECT, () => {
      const handler = game.scene.ui.getHandler() as TargetSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
  };

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
    const movesToUse = [Moves.FUSION_FLARE, Moves.FUSION_BOLT];
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(movesToUse);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.REST, Moves.REST, Moves.REST, Moves.REST]);

    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("FUSION_FLARE right before FUSION_BOLT", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    // Force user party to act before enemy party
    game.scene.getParty()[0].stats[Stat.SPD] = 10;
    game.scene.getParty()[1].stats[Stat.SPD] = 5;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    game.scene.getEnemyParty()[1].stats[Stat.SPD] = 1;

    selectMovesDoubleBattle(game, Moves.FUSION_FLARE, Moves.FUSION_BOLT);

    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    let phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    let move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    let power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_BOLT);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);
  }, 20000);

  it("FUSION_BOLT right before FUSION_FLARE", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    // Force user party to act before enemy party
    game.scene.getParty()[0].stats[Stat.SPD] = 10;
    game.scene.getParty()[1].stats[Stat.SPD] = 5;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    game.scene.getEnemyParty()[1].stats[Stat.SPD] = 1;

    selectMovesDoubleBattle(game, Moves.FUSION_BOLT, Moves.FUSION_FLARE);

    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    let phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    let move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_BOLT);

    let power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);
  }, 20000);

  it("FUSION_FLARE before FUSION_BOLT with failed move in between", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    // Force first enemy to act (and fail) in between party
    game.scene.getParty()[0].stats[Stat.SPD] = 10;
    game.scene.getEnemyParty()[1].stats[Stat.SPD] = 5;
    game.scene.getParty()[1].stats[Stat.SPD] = 3;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    selectMovesDoubleBattle(game, Moves.FUSION_FLARE, Moves.FUSION_BOLT);

    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    let phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    let move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    let power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEndPhase);

    // Skip enemy move; because this enemy is not hit (full HP), Rest should fail
    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEndPhase);

    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_BOLT);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(TurnEndPhase);
  }, 20000);

  it("FUSION_FLARE before FUSION_BOLT with successful move in between", async() => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    // Force first enemy to act in between party
    game.scene.getParty()[0].stats[Stat.SPD] = 10;
    game.scene.getEnemyParty()[1].stats[Stat.SPD] = 5;
    game.scene.getParty()[1].stats[Stat.SPD] = 3;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    selectMovesDoubleBattle(game, Moves.FUSION_FLARE, Moves.FUSION_BOLT);

    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    let phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    let move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    let power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEndPhase);

    // Skip enemy move
    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEndPhase);

    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_BOLT);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);
  }, 20000);

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn", async() => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FUSION_FLARE, Moves.FUSION_FLARE, Moves.FUSION_FLARE, Moves.FUSION_FLARE]);
    const moveToUse = Moves.FUSION_BOLT;
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    // Force first enemy to act in between party
    game.scene.getParty()[0].stats[Stat.SPD] = 10;
    game.scene.getEnemyParty()[1].stats[Stat.SPD] = 5;
    game.scene.getParty()[1].stats[Stat.SPD] = 3;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    // Ensure survival of team by reducing enemy attack stat and boosting party defense stat
    game.scene.getEnemyParty()[0].stats[Stat.SPATK] = 1;
    game.scene.getEnemyParty()[1].stats[Stat.SPATK] = 1;
    game.scene.getParty()[0].stats[Stat.SPDEF] = 250;
    game.scene.getParty()[1].stats[Stat.SPDEF] = 250;

    selectMovesDoubleBattle(game, moveToUse, moveToUse);

    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    let phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    let move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);

    let power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Bolt
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);

    await game.phaseInterceptor.runFrom(MoveEffectPhase).to(MoveEffectPhase, false);

    // Check power of Fusion Flare
    phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    move = phase.move.getMove();
    expect(move.id).toBe(Moves.FUSION_FLARE);

    power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);
  }, 20000);
});
