import { BattlerIndex } from "#app/battle";
import { CritBoosterModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import * as Utils from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    game.override.disableCrits();

    game.override.battleType("single");
  }, 20000);

  it("SCOPE_LENS activates in battle correctly", async () => {
    game.override.startingHeldItems([{ name: "SCOPE_LENS" }]);
    game.override.moveset([Moves.POUND]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.GASTLY
    ]);

    game.move.select(Moves.POUND);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(consoleSpy).toHaveBeenCalledWith("Applied", "Scope Lens", "");
  }, 20000);

  it("SCOPE_LENS held by random pokemon", async () => {
    await game.startBattle([
      Species.GASTLY
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

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
