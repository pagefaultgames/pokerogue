import { modifierTypes } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { AbilityId } from "#enums/ability-id";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH])
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

  it("reverts G-Max Partner Pikachu back to Partner form on deactivation", async () => {
    game.override.starterForms({
      [SpeciesId.PIKACHU]: 1,
    });

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const pikachu = game.field.getPlayerPokemon();
    expect(pikachu.getFormKey()).toBe("partner");

    const maxMushroomsType = generateModifierType(modifierTypes.FORM_CHANGE_ITEM, [FormChangeItem.MAX_MUSHROOMS])!;
    const maxMushrooms = maxMushroomsType.newModifier(pikachu) as PokemonFormChangeItemModifier;
    await game.scene.addModifier(maxMushrooms);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(pikachu.getFormKey()).toBe(SpeciesFormKey.GIGANTAMAX);
    expect(maxMushrooms.preFormKey).toBe("partner");

    maxMushrooms.active = false;
    game.scene.triggerPokemonFormChange(pikachu, SpeciesFormChangeItemTrigger);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(pikachu.getFormKey()).toBe("partner");
  });
});
