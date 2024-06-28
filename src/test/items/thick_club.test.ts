import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Stat } from "#app/data/pokemon-stat";
import { SpeciesStatBoosterModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import * as Utils from "#app/utils";
import i18next from "#app/plugins/i18n";

describe("Items - Thick Club", () => {
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

  it("THICK_CLUB activates in battle correctly", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{ name: "SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.CUBONE
    ]);

    const partyMember = game.scene.getParty()[0];

    // Checking consoe log to make sure Thick Club is applied when getBattleStat (with the appropriate stat) is called
    partyMember.getBattleStat(Stat.DEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getBattleStat(Stat.SPDEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.ATK);
    expect(consoleSpy).toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPD);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");
  });

  it("THICK_CLUB held by CUBONE", async() => {
    await game.startBattle([
      Species.CUBONE
    ]);

    const partyMember = game.scene.getParty()[0];

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  }, 20000);

  it("THICK_CLUB held by MAROWAK", async() => {
    await game.startBattle([
      Species.MAROWAK
    ]);

    const partyMember = game.scene.getParty()[0];

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  }, 20000);

  it("THICK_CLUB held by ALOLA_MAROWAK", async() => {
    await game.startBattle([
      Species.ALOLA_MAROWAK
    ]);

    const partyMember = game.scene.getParty()[0];

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  }, 20000);

  it("THICK_CLUB held by fused CUBONE line (base)", async() => {
    // Randomly choose from the Cubone line
    const species = [ Species.CUBONE, Species.MAROWAK, Species.ALOLA_MAROWAK ];
    const randSpecies = Utils.randInt(species.length);

    await game.startBattle([
      species[randSpecies],
      Species.PIKACHU
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

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  }, 20000);

  it("THICK_CLUB held by fused CUBONE line (part)", async() => {
    // Randomly choose from the Cubone line
    const species = [ Species.CUBONE, Species.MAROWAK, Species.ALOLA_MAROWAK ];
    const randSpecies = Utils.randInt(species.length);

    await game.startBattle([
      Species.PIKACHU,
      species[randSpecies]
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

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  }, 20000);

  it("THICK_CLUB not held by CUBONE", async() => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const partyMember = game.scene.getParty()[0];

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new Utils.NumberHolder(atkStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["THICK_CLUB"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);
  }, 20000);
});
