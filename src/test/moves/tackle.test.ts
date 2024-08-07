import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {
  CommandPhase,
  EnemyCommandPhase, TurnEndPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import {Stat} from "#app/data/pokemon-stat";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";


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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GROWTH,Moves.GROWTH,Moves.GROWTH,Moves.GROWTH]);
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("TACKLE against ghost", async() => {
    const moveToUse = Moves.TACKLE;
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.GENGAR);
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
