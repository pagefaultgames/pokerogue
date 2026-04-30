import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import type { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import { GameManager } from "#test/framework/game-manager";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Form Change Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SPLASH, MoveId.MULTI_ATTACK])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Zacian should successfully change into Crowned form", async () => {
    await game.classicMode.startBattle(SpeciesId.ZACIAN);

    // Before the form change: Should be Hero form
    const zacian = game.field.getPlayerPokemon();
    expect(zacian.getFormKey()).toBe("hero-of-many-battles");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 120, 115, 80, 115, 138]);

    // Give Zacian a Rusted Sword
    const rustedSwordType = generateModifierType(modifierTypes.RARE_FORM_CHANGE_ITEM)!;
    const rustedSword = rustedSwordType.newModifier(zacian);
    await game.scene.addModifier(rustedSword);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // After the form change: Should be Crowned form
    expect(game.phaseInterceptor.log.includes("FormChangePhase")).toBe(true);
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY, PokemonType.STEEL]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 150, 115, 80, 115, 148]);
  });

  it("Silvally should play animation when memory activates", async () => {
    await game.classicMode.startBattle(SpeciesId.SILVALLY);

    let silvally: Pokemon | undefined;

    // Before the form change: Should be normal type
    silvally = game.field.getPlayerPokemon();
    expect(silvally.getTypes()).toStrictEqual([PokemonType.NORMAL]);
    expect(silvally.getHeldItems()).toStrictEqual([]);

    // Give Silvally a Memory to activate
    const electricMemoryType = generateModifierType(modifierTypes.RARE_FORM_CHANGE_ITEM, [
      FormChangeItem.ELECTRIC_MEMORY,
    ])!;
    const electricMemory = electricMemoryType.newModifier(silvally);
    await game.scene.addModifier(electricMemory);

    // Defeat the Magikarp so we get to modifier select phase
    game.move.select(MoveId.MULTI_ATTACK);
    await game.phaseInterceptor.to("SelectModifierPhase");

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;

        handler.processInput(Button.DOWN);
        handler.processInput(Button.RIGHT);
        handler.processInput(Button.ACTION);
      });
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Activate the memory?
        handler.processInput(Button.ACTION);
        handler.setCursor(0);
        handler.processInput(Button.ACTION);

        silvally = game.field.getPlayerPokemon();

        handler.processInput(Button.CANCEL);

        resolve();
      });
    });

    expect(silvally).toBeDefined();

    // Make sure Silvally is holding the damn disk
    const heldItem = silvally.getHeldItems()[0] as PokemonFormChangeItemModifier;
    expect(heldItem.formChangeItem).toEqual(FormChangeItem.ELECTRIC_MEMORY);

    // Did he change type?
    expect(silvally.getTypes()).toStrictEqual([PokemonType.ELECTRIC]);

    // Did animation play?
    expect(game.phaseInterceptor.log.includes("QuietFormChangePhase")).toBe(true);
  });
});
