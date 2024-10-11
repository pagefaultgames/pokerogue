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

describe("Items - Quick Powder", () => {
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

  it("QUICK_POWDER activates in battle correctly", async() => {
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{ name: "SPECIES_STAT_BOOSTER", type: "QUICK_POWDER" }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.startBattle([
      Species.DITTO
    ]);

    const partyMember = game.scene.getParty()[0];

    // Checking consoe log to make sure Quick Powder is applied when getBattleStat (with the appropriate stat) is called
    partyMember.getBattleStat(Stat.DEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"), "");

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getBattleStat(Stat.SPDEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.ATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"), "");

    console.log("");

    partyMember.getBattleStat(Stat.SPD);
    expect(consoleSpy).toHaveBeenLastCalledWith("Applied", i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"), "");
  });

  it("QUICK_POWDER held by DITTO", async() => {
    await game.startBattle([
      Species.DITTO
    ]);

    const partyMember = game.scene.getParty()[0];

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new Utils.NumberHolder(spdStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["QUICK_POWDER"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(2);
  }, 20000);

  it("QUICK_POWDER held by fused DITTO (base)", async() => {
    await game.startBattle([
      Species.DITTO,
      Species.MAROWAK
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

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new Utils.NumberHolder(spdStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["QUICK_POWDER"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(2);
  }, 20000);

  it("QUICK_POWDER held by fused DITTO (part)", async() => {
    await game.startBattle([
      Species.MAROWAK,
      Species.DITTO
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

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new Utils.NumberHolder(spdStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["QUICK_POWDER"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(2);
  }, 20000);

  it("QUICK_POWDER not held by DITTO", async() => {
    await game.startBattle([
      Species.MAROWAK
    ]);

    const partyMember = game.scene.getParty()[0];

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new Utils.NumberHolder(spdStat);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.scene.addModifier(modifierTypes.SPECIES_STAT_BOOSTER().generateType(null, ["QUICK_POWDER"]).newModifier(partyMember), true);
    partyMember.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.SPD, spdValue);

    expect(spdValue.value / spdStat).toBe(1);
  }, 20000);
});
