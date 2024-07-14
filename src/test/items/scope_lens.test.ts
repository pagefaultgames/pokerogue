import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { CritBoosterModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import * as Utils from "#app/utils";
import { MoveEffectPhase, TurnStartPhase } from "#app/phases";
import { BattlerIndex } from "#app/battle";

describe("Items - Scope Lens", () => {
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

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
  }, 20000);

  it("SCOPE_LENS activates in battle correctly", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{ name: "SCOPE_LENS" }]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.POUND ]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.GASTLY
    ]);

    game.doAttack(0);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(consoleSpy).toHaveBeenCalledWith("Applied", "Scope Lens", "");
  }, 20000);

  it("SCOPE_LENS held by random pokemon", async() => {
    await game.startBattle([
      Species.GASTLY
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Scope Lens to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SCOPE_LENS().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(1);
  }, 20000);
});
