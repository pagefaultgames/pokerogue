import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { BATTLE_STATS, Stat } from "#enums/stat";
import { UiMode } from "#enums/ui-mode";
import { TempStatStageBoosterModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import type { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Temporary Stat Stage Boosters", () => {
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

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.TACKLE, MoveId.SPLASH, MoveId.HONE_CLAWS, MoveId.BELLY_DRUM])
      .startingModifier([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ATK }]);
  });

  it("should provide a x1.3 stat stage multiplier", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getStatStageMultiplier");

    game.move.select(MoveId.TACKLE);

    await game.toEndOfTurn();

    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(1.3);
  });

  it("should increase existing ACC stat stage by 1 for X_ACCURACY only", async () => {
    game.override.startingModifier([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ACC }]).ability(AbilityId.SIMPLE);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getAccuracyMultiplier");

    // Raise ACC by +2 stat stages
    game.move.select(MoveId.HONE_CLAWS);

    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    // ACC at +3 stat stages yields a x2 multiplier
    expect(partyMember.getAccuracyMultiplier).toHaveReturnedWith(2);
  });

  it("should increase existing stat stage multiplier by 3/10 for the rest of the boosters", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getStatStageMultiplier");

    // Raise ATK by +1 stat stage
    game.move.select(MoveId.HONE_CLAWS);

    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    // ATK at +1 stat stage yields a x1.5 multiplier, add 0.3 from X_ATTACK
    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(1.8);
  });

  it("should not increase past maximum stat stage multiplier", async () => {
    game.override.startingModifier([
      { name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ACC },
      { name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ATK },
    ]);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getStatStageMultiplier");
    vi.spyOn(partyMember, "getAccuracyMultiplier");

    // Set all stat stages to 6
    vi.spyOn(partyMember.summonData, "statStages", "get").mockReturnValue(new Array(BATTLE_STATS.length).fill(6));

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(partyMember.getAccuracyMultiplier).toHaveReturnedWith(3);
    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(4);
  });

  it("should renew how many battles are left of existing booster when picking up new booster of same type", async () => {
    game.override.startingLevel(200).itemRewards([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ATK }]);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.SPLASH);

    await game.doKillOpponents();

    await game.phaseInterceptor.to("BattleEndPhase");

    const modifier = game.scene.findModifier(
      m => m instanceof TempStatStageBoosterModifier,
    ) as TempStatStageBoosterModifier;
    expect(modifier.getBattleCount()).toBe(4);

    // Forced X_ATTACK to spawn in the first slot with override
    game.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
        // Traverse to first modifier slot
        handler.setCursor(0);
        handler.setRowCursor(ShopCursorTarget.REWARDS);
        handler.processInput(Button.ACTION);
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("NewBattlePhase"),
      true,
    );

    await game.phaseInterceptor.to("TurnInitPhase");

    // Making sure only one booster is in the modifier list even after picking up another
    let count = 0;
    for (const m of game.scene.modifiers) {
      if (m instanceof TempStatStageBoosterModifier) {
        count++;
        const modifierInstance = m as TempStatStageBoosterModifier;
        expect(modifierInstance.getBattleCount()).toBe(modifierInstance.getMaxBattles());
      }
    }
    expect(count).toBe(1);
  });
});
