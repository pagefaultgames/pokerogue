import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase,
  DamagePhase,
  EnemyCommandPhase,
  FaintPhase,
  MessagePhase,
  PostSummonPhase,
  SwitchPhase,
  SwitchSummonPhase,
  TurnEndPhase, TurnInitPhase,
  TurnStartPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {Stat} from "#app/data/pokemon-stat";
import {Moves} from "#app/data/enums/moves";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import {QuietFormChangePhase} from "#app/form-change-phase";


describe("Abilities - Zen mode", () => {
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
    const moveToUse = Moves.SPLASH;
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ZEN_MODE);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it("ZEN MODE - not enough damage to change form", async() => {
    const moveToUse = Moves.AERIAL_ACE;
    await game.startBattle([
      Species.DARMANITAN,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 1;
    game.scene.getParty()[0].stats[Stat.HP] = 100;
    game.scene.getParty()[0].hp = 100;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase, false);
    // await game.phaseInterceptor.runFrom(DamagePhase).to(DamagePhase, false);
    const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
    damagePhase.updateAmount(40);
    await game.phaseInterceptor.runFrom(DamagePhase).to(TurnEndPhase, false);
    expect(game.scene.getParty()[0].hp).toBeLessThan(100);
    expect(game.scene.getParty()[0].formIndex).toBe(0);
  }, 20000);

  it("ZEN MODE - enough damage to change form", async() => {
    const moveToUse = Moves.AERIAL_ACE;
    await game.startBattle([
      Species.DARMANITAN,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 1;
    game.scene.getParty()[0].stats[Stat.HP] = 1000;
    game.scene.getParty()[0].hp = 100;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(QuietFormChangePhase);
    await game.phaseInterceptor.to(TurnInitPhase, false);
    expect(game.scene.getParty()[0].hp).not.toBe(100);
    expect(game.scene.getParty()[0].formIndex).not.toBe(0);
  }, 20000);

  it("ZEN MODE - kill pokemon while on zen mode", async() => {
    const moveToUse = Moves.AERIAL_ACE;
    await game.startBattle([
      Species.DARMANITAN,
      Species.CHARIZARD,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 1;
    game.scene.getParty()[0].stats[Stat.HP] = 1000;
    game.scene.getParty()[0].hp = 100;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase, false);
    // await game.phaseInterceptor.runFrom(DamagePhase).to(DamagePhase, false);
    const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
    damagePhase.updateAmount(80);
    await game.phaseInterceptor.runFrom(DamagePhase).to(QuietFormChangePhase);
    expect(game.scene.getParty()[0].hp).not.toBe(100);
    expect(game.scene.getParty()[0].formIndex).not.toBe(0);
    game.scene.getParty()[0].hp = 0;
    game.scene.pushPhase(new FaintPhase(game.scene, game.scene.getParty()[0].getBattlerIndex(), true));
    await game.phaseInterceptor.to(FaintPhase);
    expect(game.scene.getParty()[0].isFainted()).toBe(true);
    await game.phaseInterceptor.run(MessagePhase);
    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.run(TurnStartPhase);
    game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
      game.scene.unshiftPhase(new SwitchSummonPhase(game.scene, 0, 1, false, false));
      game.scene.ui.setMode(Mode.MESSAGE);
    });
    game.onNextPrompt("SwitchPhase", Mode.MESSAGE, () => {
      game.endPhase();
    });
    await game.phaseInterceptor.run(SwitchPhase);
    await game.phaseInterceptor.to(PostSummonPhase);
    await game.phaseInterceptor.to(TurnEndPhase, false);
    expect(game.scene.getParty()[1].formIndex).toBe(1);
  }, 20000);
});
