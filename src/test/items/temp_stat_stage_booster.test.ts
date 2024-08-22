import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Moves } from "#app/enums/moves.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Abilities } from "#app/enums/abilities.js";
import Overrides from "#app/overrides";
import { TempStatStageBoosterModifier } from "#app/modifier/modifier.js";
import { Mode } from "#app/ui/ui.js";
import { Button } from "#app/enums/buttons.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import { NewBattlePhase } from "#app/phases/new-battle-phase.js";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler.js";
import { TurnInitPhase } from "#app/phases/turn-init-phase.js";
import { BattleEndPhase } from "#app/phases/battle-end-phase.js";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase.js";


describe("Items - Temporary Stat Stage Boosters", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleType("single");
    game.override.enemySpecies(Species.MEW);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(Abilities.PICKUP);
    game.override.moveset([ Moves.TACKLE, Moves.HONE_CLAWS, Moves.BELLY_DRUM ]);
    game.override.startingModifier([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ATK }]);
  });

  it("should provide a x1.3 stat stage multiplier alone", async() => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    vi.spyOn(partyMember, "getStatStageMultiplier");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(1.3);
  }, 20000);

  it("should only increase existing stat stage multiplier by 0.3", async() => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    vi.spyOn(partyMember, "getStatStageMultiplier");

    game.move.select(Moves.HONE_CLAWS);

    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(1.8);
  }, 20000);

  it("should not increase past x4 maximum stat stage multiplier", async() => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    vi.spyOn(partyMember, "getStatStageMultiplier");

    game.move.select(Moves.BELLY_DRUM);

    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(partyMember.getStatStageMultiplier).toHaveReturnedWith(4);
  }, 20000);

  it("should renew how many battles are left of existing booster when picking up new booster of same type", async() => {
    game.override.startingLevel(200);
    vi.spyOn(Overrides, "ITEM_REWARD_OVERRIDE", "get").mockReturnValue([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ATK }]);
    await game.startBattle([
      Species.PIKACHU
    ]);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(BattleEndPhase);

    const modifier = game.scene.findModifier(m => m instanceof TempStatStageBoosterModifier) as TempStatStageBoosterModifier;
    expect(modifier.getBattlesLeft()).toBe(4);

    // Forced X Attack to spawn in the first slot with override
    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.processInput(Button.ACTION);
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(NewBattlePhase), true);

    await game.phaseInterceptor.to(TurnInitPhase);

    // Making sure only one booster is in the modifier list even after picking up another
    let count = 0;
    for (const m of game.scene.modifiers) {
      if (m instanceof TempStatStageBoosterModifier) {
        count++;
        expect((m as TempStatStageBoosterModifier).getBattlesLeft()).toBe(5);
      }
    }
    expect(count).toBe(1);
  }, 20000);
});
