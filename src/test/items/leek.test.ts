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

describe("Items - Leek", () => {
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
  });

  it("LEEK activates in battle correctly", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{ name: "LEEK" }]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.POUND ]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.FARFETCHD
    ]);

    game.doAttack(0);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(consoleSpy).toHaveBeenCalledWith("Applied", "Leek", "");
  }, 20000);

  it("LEEK held by FARFETCHD", async() => {
    await game.startBattle([
      Species.FARFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by GALAR_FARFETCHD", async() => {
    await game.startBattle([
      Species.GALAR_FARFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by SIRFETCHD", async() => {
    await game.startBattle([
      Species.SIRFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by fused FARFETCHD line (base)", async() => {
    // Randomly choose from the Farfetch'd line
    const species = [ Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD ];

    await game.startBattle([
      species[Utils.randInt(species.length)],
      Species.PIKACHU,
    ]);

    const party = game.scene.getParty();
    const partyMember = party[0];
    const ally = party[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by fused FARFETCHD line (part)", async() => {
    // Randomly choose from the Farfetch'd line
    const species = [ Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD ];

    await game.startBattle([
      Species.PIKACHU,
      species[Utils.randInt(species.length)]
    ]);

    const party = game.scene.getParty();
    const partyMember = party[0];
    const ally = party[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK not held by FARFETCHD line", async() => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);
  }, 20000);
});
