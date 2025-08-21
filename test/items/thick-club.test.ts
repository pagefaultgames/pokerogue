import { modifierTypes } from "#data/data-lists";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { SpeciesStatBoosterModifier } from "#modifiers/modifier";
import i18next from "#plugins/i18n";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder, randInt } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Thick Club", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleStyle("single");
  });

  it("THICK_CLUB activates in battle correctly", async () => {
    game.override.startingHeldItems([{ name: "RARE_SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.classicMode.startBattle([SpeciesId.CUBONE]);

    const partyMember = game.field.getPlayerPokemon();

    // Checking console log to make sure Thick Club is applied when getEffectiveStat (with the appropriate stat) is called
    partyMember.getEffectiveStat(Stat.DEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"),
      "",
    );

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getEffectiveStat(Stat.SPDEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.ATK);
    expect(consoleSpy).toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.SPD);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.THICK_CLUB.name"),
      "",
    );
  });

  it("THICK_CLUB held by CUBONE", async () => {
    await game.classicMode.startBattle([SpeciesId.CUBONE]);

    const partyMember = game.field.getPlayerPokemon();

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  });

  it("THICK_CLUB held by MAROWAK", async () => {
    await game.classicMode.startBattle([SpeciesId.MAROWAK]);

    const partyMember = game.field.getPlayerPokemon();

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  });

  it("THICK_CLUB held by ALOLA_MAROWAK", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOLA_MAROWAK]);

    const partyMember = game.field.getPlayerPokemon();

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  });

  it("THICK_CLUB held by fused CUBONE line (base)", async () => {
    // Randomly choose from the Cubone line
    const species = [SpeciesId.CUBONE, SpeciesId.MAROWAK, SpeciesId.ALOLA_MAROWAK];
    const randSpecies = randInt(species.length);

    await game.classicMode.startBattle([species[randSpecies], SpeciesId.PIKACHU]);

    const [partyMember, ally] = game.scene.getPlayerParty();

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
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  });

  it("THICK_CLUB held by fused CUBONE line (part)", async () => {
    // Randomly choose from the Cubone line
    const species = [SpeciesId.CUBONE, SpeciesId.MAROWAK, SpeciesId.ALOLA_MAROWAK];
    const randSpecies = randInt(species.length);

    await game.classicMode.startBattle([SpeciesId.PIKACHU, species[randSpecies]]);

    const [partyMember, ally] = game.scene.getPlayerParty();

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
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(2);
  });

  it("THICK_CLUB not held by CUBONE", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const partyMember = game.field.getPlayerPokemon();

    const atkStat = partyMember.getStat(Stat.ATK);

    // Making sure modifier is not applied without holding item
    const atkValue = new NumberHolder(atkStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["THICK_CLUB"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.ATK, atkValue);

    expect(atkValue.value / atkStat).toBe(1);
  });
});
