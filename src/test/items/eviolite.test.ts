import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Stat } from "#app/data/pokemon-stat";
import { EvolutionStatBoosterModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import * as Utils from "#app/utils";
import i18next from "#app/plugins/i18n";
import { Species } from "#enums/species";

describe("Items - Eviolite", () => {
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

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
  });

  it("EVIOLITE activates in battle correctly", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{ name: "EVIOLITE" }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.PICHU
    ]);

    const partyMember = game.scene.getParty()[0];

    // Checking consoe log to make sure Eviolite is applied when getBattleStat (with the appropriate stat) is called
    partyMember.getBattleStat(Stat.DEF);
    expect(consoleSpy).toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:ModifierType.EVIOLITE.name"), "");

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getBattleStat(Stat.SPDEF);
    expect(consoleSpy).toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:ModifierType.EVIOLITE.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.ATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:ModifierType.EVIOLITE.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:ModifierType.EVIOLITE.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPD);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:ModifierType.EVIOLITE.name"), "");
  });

  it("EVIOLITE held by unevolved, unfused pokemon", async() => {
    await game.startBattle([
      Species.PICHU
    ]);

    const partyMember = game.scene.getParty()[0];

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1.5);
    expect(spDefValue.value / spDefStat).toBe(1.5);
  }, 20000);

  it("EVIOLITE held by fully evolved, unfused pokemon", async() => {
    await game.startBattle([
      Species.RAICHU,
    ]);

    const partyMember = game.scene.getParty()[0];

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);
  }, 20000);

  it("EVIOLITE held by completely unevolved, fused pokemon", async() => {
    await game.startBattle([
      Species.PICHU,
      Species.CLEFFA
    ]);

    const partyMember = game.scene.getParty()[0];
    const ally = game.scene.getParty()[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1.5);
    expect(spDefValue.value / spDefStat).toBe(1.5);
  }, 20000);

  it("EVIOLITE held by partially unevolved (base), fused pokemon", async() => {
    await game.startBattle([
      Species.PICHU,
      Species.CLEFABLE
    ]);

    const partyMember = game.scene.getParty()[0];
    const ally = game.scene.getParty()[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1.25);
    expect(spDefValue.value / spDefStat).toBe(1.25);
  }, 20000);

  it("EVIOLITE held by partially unevolved (fusion), fused pokemon", async() => {
    await game.startBattle([
      Species.RAICHU,
      Species.CLEFFA
    ]);

    const partyMember = game.scene.getParty()[0];
    const ally = game.scene.getParty()[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1.25);
    expect(spDefValue.value / spDefStat).toBe(1.25);
  }, 20000);

  it("EVIOLITE held by completely evolved, fused pokemon", async() => {
    await game.startBattle([
      Species.RAICHU,
      Species.CLEFABLE
    ]);

    const partyMember = game.scene.getParty()[0];
    const ally = game.scene.getParty()[1];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);
    const spDefStat = partyMember.getStat(Stat.SPDEF);

    // Making sure modifier is not applied without holding item
    const defValue = new Utils.NumberHolder(defStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    const spDefValue = new Utils.NumberHolder(spDefStat);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.EVIOLITE().newModifier(partyMember), true);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.DEF, defValue);
    partyMember.scene.applyModifiers(EvolutionStatBoosterModifier, true, partyMember, Stat.SPDEF, spDefValue);

    expect(defValue.value / defStat).toBe(1);
    expect(spDefValue.value / spDefStat).toBe(1);
  }, 20000);
});
