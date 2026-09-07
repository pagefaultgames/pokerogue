import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { FormChangeItemModifierType } from "#modifiers/modifier-type";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import { EvolutionPhase } from "#phases/evolution-phase";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(game.phaseInterceptor.phaseLog.includes("FormChangePhase")).toBe(true);
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY, PokemonType.STEEL]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 150, 115, 80, 115, 148]);
  });

  it("should end Terastallization when the Pokemon undergoes a Primal Reversion", async () => {
    await game.classicMode.startBattle(SpeciesId.KYOGRE);

    const kyogre = game.field.getPlayerPokemon();

    // Terastallize the Pokemon (set the underlying field so it can be reset)
    kyogre.isTerastallized = true;
    kyogre.teraType = PokemonType.WATER;

    // Give Kyogre a Blue Orb to trigger Primal Reversion
    const blueOrb = new FormChangeItemModifierType(FormChangeItem.BLUE_ORB).newModifier(kyogre);
    game.scene.addModifier(blueOrb);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // The form change should have occurred and ended Terastallization
    expect(kyogre.getFormKey()).toBe(SpeciesFormKey.PRIMAL);
    expect(kyogre.isTerastallized).toBe(false);
  });

  it("should end Terastallization when the Pokemon Mega Evolves", async () => {
    await game.classicMode.startBattle(SpeciesId.GENGAR);

    const gengar = game.field.getPlayerPokemon();

    // Terastallize the Pokemon (set the underlying field so it can be reset)
    gengar.isTerastallized = true;
    gengar.teraType = PokemonType.GHOST;

    // Give Gengar a Gengarite to trigger Mega Evolution
    const gengarite = new FormChangeItemModifierType(FormChangeItem.GENGARITE).newModifier(gengar);
    game.scene.addModifier(gengarite);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // The form change should have occurred and ended Terastallization
    expect(gengar.getFormKey()).toBe(SpeciesFormKey.MEGA);
    expect(gengar.isTerastallized).toBe(false);
  });

  it("should end Terastallization before the form change animation is shown", async () => {
    await game.classicMode.startBattle(SpeciesId.GENGAR);

    const gengar = game.field.getPlayerPokemon();

    // Terastallize the Pokemon (set the underlying field so it can be reset)
    gengar.isTerastallized = true;
    gengar.teraType = PokemonType.GHOST;

    // The animation's sprites bake in the Pokemon's tera state when they are configured,
    // so Terastallization has to have ended by the time the first one is set up.
    let terastallizedAtSpriteSetup: boolean | null = null;
    const configureSprite = EvolutionPhase.prototype["configureSprite"];
    vi.spyOn(EvolutionPhase.prototype as any, "configureSprite").mockImplementation(function (
      this: EvolutionPhase,
      ...args: unknown[]
    ) {
      terastallizedAtSpriteSetup ??= gengar.isTerastallized;
      return configureSprite.apply(this, args as Parameters<typeof configureSprite>);
    });

    // Give Gengar a Gengarite to trigger Mega Evolution
    const gengarite = new FormChangeItemModifierType(FormChangeItem.GENGARITE).newModifier(gengar);
    game.scene.addModifier(gengarite);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(gengar.getFormKey()).toBe(SpeciesFormKey.MEGA);
    expect(terastallizedAtSpriteSetup).toBe(false);
  });

  it("should not end Terastallization on a routine (non-Mega/Max) form change", async () => {
    // Aegislash needs its Stance Change ability, and an attacking move to swap into Blade form
    game.override.ability(AbilityId.STANCE_CHANGE).moveset([MoveId.TACKLE]).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.AEGISLASH);

    const aegislash = game.field.getPlayerPokemon();
    expect(aegislash.getFormKey()).toBe("shield");

    // Terastallize the Pokemon (set the underlying field so it could be reset)
    aegislash.isTerastallized = true;
    aegislash.teraType = PokemonType.STEEL;

    // Attacking triggers a routine stance change into Blade form
    game.move.select(MoveId.TACKLE);
    await game.toNextTurn();

    // The stance change should occur, but Terastallization must be unaffected
    expect(aegislash.getFormKey()).toBe("blade");
    expect(aegislash.isTerastallized).toBe(true);
  });
});
