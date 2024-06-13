import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase,
  EnemyCommandPhase, MoveEndPhase, TurnEndPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import { Abilities, BattlerTagType, Moves, Species } from "#enums";
import { BattleStat } from "#app/data/battle-stat.js";
import { TerrainType } from "#app/data/terrain.js";

// See also: TypeImmunityAbAttr
describe("Abilities - Sap Sipper", () => {
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
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("raise attack 1 level and block effects when activated against a grass attack", async() => {
    const moveToUse = Moves.LEAFAGE;
    const enemyAbility = Abilities.SAP_SIPPER;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DUSKULL);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    const startingOppHp = game.scene.currentBattle.enemyParty[0].hp;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    expect(startingOppHp - game.scene.getEnemyParty()[0].hp).toBe(0);
    expect(game.scene.getEnemyParty()[0].summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("raise attack 1 level and block effects when activated against a grass status move", async() => {
    const moveToUse = Moves.SPORE;
    const enemyAbility = Abilities.SAP_SIPPER;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    expect(game.scene.getEnemyParty()[0].status).toBeUndefined();
    expect(game.scene.getEnemyParty()[0].summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("do not activate against status moves that target the field", async() => {
    const moveToUse = Moves.GRASSY_TERRAIN;
    const enemyAbility = Abilities.SAP_SIPPER;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle();

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    expect(game.scene.arena.terrain).toBeDefined();
    expect(game.scene.arena.terrain.terrainType).toBe(TerrainType.GRASSY);
    expect(game.scene.getEnemyParty()[0].summonData.battleStats[BattleStat.ATK]).toBe(0);
  });

  it("do not activate against status moves that target the user", async() => {
    const moveToUse = Moves.SPIKY_SHIELD;
    const ability = Abilities.SAP_SIPPER;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(game.scene.getParty()[0].getTag(BattlerTagType.SPIKY_SHIELD)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getParty()[0].summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });
});
