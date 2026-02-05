import { modifierTypes } from "#data/data-lists";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { SpeciesStatBoosterModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Metal Powder", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleStyle("single");
  });

  it("METAL_POWDER held by DITTO", async () => {
    await game.classicMode.startBattle(SpeciesId.DITTO);

    const partyMember = game.field.getPlayerPokemon();

    const defStat = partyMember.getStat(Stat.DEF);

    // Making sure modifier is not applied without holding item
    const defValue = new NumberHolder(defStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["METAL_POWDER"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(2);
  });

  it("METAL_POWDER held by fused DITTO (base)", async () => {
    await game.classicMode.startBattle(SpeciesId.DITTO, SpeciesId.MAROWAK);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);

    // Making sure modifier is not applied without holding item
    const defValue = new NumberHolder(defStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["METAL_POWDER"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(2);
  });

  it("METAL_POWDER held by fused DITTO (part)", async () => {
    await game.classicMode.startBattle(SpeciesId.MAROWAK, SpeciesId.DITTO);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const defStat = partyMember.getStat(Stat.DEF);

    // Making sure modifier is not applied without holding item
    const defValue = new NumberHolder(defStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["METAL_POWDER"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(2);
  });

  it("METAL_POWDER not held by DITTO", async () => {
    await game.classicMode.startBattle(SpeciesId.MAROWAK);

    const partyMember = game.field.getPlayerPokemon();

    const defStat = partyMember.getStat(Stat.DEF);

    // Making sure modifier is not applied without holding item
    const defValue = new NumberHolder(defStat);
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    await game.scene.addModifier(
      modifierTypes.RARE_SPECIES_STAT_BOOSTER().generateType([], ["METAL_POWDER"])!.newModifier(partyMember),
      true,
    );
    game.scene.applyModifiers(SpeciesStatBoosterModifier, true, partyMember, Stat.DEF, defValue);

    expect(defValue.value / defStat).toBe(1);
  });
});
