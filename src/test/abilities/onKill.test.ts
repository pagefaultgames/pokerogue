import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/essentials/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase,
  DamagePhase,
  EnemyCommandPhase,
  FaintPhase,
  MessagePhase,
  MoveEffectPhase,
  MovePhase,
  ShowAbilityPhase,
  StatChangePhase,
  TurnStartPhase,
  VictoryPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {Stat} from "#app/data/pokemon-stat";
import {Moves} from "#app/data/enums/moves";
import {getMovePosition} from "#app/test/essentials/utils";
import {Command} from "#app/ui/command-ui-handler";
import {BattleStat} from "#app/data/battle-stat";


describe("Abilities Test - onKill", () => {
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
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([]);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    game = new GameManager(phaserGame);
  });

  it("MOXIE", async() => {
    const moveToUse = Moves.AERIAL_ACE;
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MOXIE);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MOXIE);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
    await game.startBattle([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[Stat.ATK]).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.mustRun(EnemyCommandPhase).catch((error) => expect(error).toBe(EnemyCommandPhase));
    await game.phaseInterceptor.mustRun(TurnStartPhase).catch((error) => expect(error).toBe(TurnStartPhase));

    await game.phaseInterceptor.mustRun(MovePhase).catch((error) => expect(error).toBe(MovePhase));
    await game.phaseInterceptor.mustRun(MessagePhase).catch((error) => expect(error).toBe(MessagePhase));
    await game.phaseInterceptor.mustRun(MoveEffectPhase).catch((error) => expect(error).toBe(MoveEffectPhase));
    await game.phaseInterceptor.mustRun(DamagePhase).catch((error) => expect(error).toBe(DamagePhase));

    await game.phaseInterceptor.mustRun(FaintPhase).catch((error) => expect(error).toBe(FaintPhase));
    await game.phaseInterceptor.mustRun(MessagePhase).catch((error) => expect(error).toBe(MessagePhase));
    await game.phaseInterceptor.mustRun(ShowAbilityPhase).catch((error) => expect(error).toBe(ShowAbilityPhase));
    await game.phaseInterceptor.mustRun(StatChangePhase).catch((error) => expect(error).toBe(StatChangePhase));
    await game.phaseInterceptor.mustRun(MessagePhase).catch((error) => expect(error).toBe(MessagePhase));
    await game.phaseInterceptor.mustRun(VictoryPhase).catch((error) => expect(error).toBe(VictoryPhase));
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(1);
  }, 120000);
});
