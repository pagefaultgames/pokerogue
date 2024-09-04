import { Stat } from "#enums/stat";
import { SpeciesStatBoosterModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import i18next from "#app/plugins/i18n";
import * as Utils from "#app/utils";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

    game.override.battleType("single");
  });

  it("THICK_CLUB activates in battle correctly", async() => {
    game.override.startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.CUBONE
    ]);

    const partyMember = game.scene.getParty()[0];

    // Checking console log to make sure Thick Club is applied when getEffectiveStat (with the appropriate stat) is called
    partyMember.getEffectiveStat(Stat.DEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getEffectiveStat(Stat.SPDEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getEffectiveStat(Stat.ATK);
    expect(consoleSpy).toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getEffectiveStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"), "");

    console.log("");

    partyMember.getEffectiveStat(Stat.SPD);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
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
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);
  }, 20000);
});
