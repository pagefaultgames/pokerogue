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

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    game.override.disableCrits();

    game.override.battleType("single");
  });

  it("LEEK activates in battle correctly", async () => {
    game.override.startingHeldItems([{ name: "LEEK" }]);
    game.override.moveset([Moves.POUND]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.FARFETCHD
    ]);

    game.move.select(Moves.POUND);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(consoleSpy).toHaveBeenCalledWith("Applied", "Leek", "");
  }, 20000);

  it("LEEK held by FARFETCHD", async () => {
    await game.startBattle([
      Species.FARFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by GALAR_FARFETCHD", async () => {
    await game.startBattle([
      Species.GALAR_FARFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by SIRFETCHD", async () => {
    await game.startBattle([
      Species.SIRFETCHD
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

    // Making sure modifier is not applied without holding item
    const critLevel = new Utils.IntegerHolder(0);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(0);

    // Giving Leek to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.LEEK().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(CritBoosterModifier, true, partyMember, critLevel);

    expect(critLevel.value).toBe(2);
  }, 20000);

  it("LEEK held by fused FARFETCHD line (base)", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD];

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

  it("LEEK held by fused FARFETCHD line (part)", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD];

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

  it("LEEK not held by FARFETCHD line", async () => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getPlayerPokemon()!;

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
