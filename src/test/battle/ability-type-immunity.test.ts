import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase,
  EnemyCommandPhase, TurnEndPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {Moves} from "#app/data/enums/moves";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import {Stat} from "#app/data/pokemon-stat";
import { Abilities } from "#app/data/enums/abilities.js";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";
import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag.js";
import { BattleStat } from "#app/data/battle-stat.js";

// See also: ArenaTypeAbAttr
describe("Test type immunity granted by abilities", () => {
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

  it("causes attacks to fail", async() => {
    // Check that EARTHQUAKE is blocked by LEVITATE

    const moveToUse = Moves.LEAFAGE;
    const enemyAbility = Abilities.SAP_SIPPER;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DUSKULL);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(enemyAbility);

    await game.startBattle([
      Species.BIDOOF,
      Species.BIDOOF
    ]);

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
  });

  it("causes non-field status moves to fail", async() => {
    // Check that SPORE is blocked by SAP SIPPER.

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPORE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SAP_SIPPER);

    await game.startBattle();

    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 1;
    game.scene.getParty()[0].stats[Stat.SPD] = 2;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.SPORE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    expect(game.scene.getEnemyParty()[0].summonData.battleStats[BattleStat.ATK]).toBe(1);
    expect(game.scene.getEnemyParty()[0].status).toBeUndefined();
  }, 20000);

  it("does not cause field moves to fail", async() => {
    // Field moves should NOT be affected by immunity abilities
    // Check that SPIKES (ground-type) is not blocked by LEVITATE (immunity to ground-type)

    const moveToUse = Moves.SPIKES;

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);

    await game.startBattle();

    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 1;
    game.scene.getParty()[0].stats[Stat.SPD] = 2;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    const spikesTag = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY);
    expect(spikesTag).not.toBeUndefined();
    expect((spikesTag as ArenaTrapTag).layers).toBe(1);
  }, 20000);
});
