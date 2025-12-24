import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import { applyHeldItems } from "#utils/items";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Quick Powder", () => {
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

  it("QUICK_POWDER activates in battle correctly", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.QUICK_POWDER }]);
    const consoleSpy = vi.spyOn(console, "log");
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const partyMember = game.field.getPlayerPokemon();

    // Checking console log to make sure Quick Powder is applied when getEffectiveStat (with the appropriate stat) is called
    partyMember.getEffectiveStat(Stat.DEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"),
      "",
    );

    // Printing dummy console messages along the way so subsequent checks don't pass because of the first
    console.log("");

    partyMember.getEffectiveStat(Stat.SPDEF);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.ATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.SPATK);
    expect(consoleSpy).not.toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"),
      "",
    );

    console.log("");

    partyMember.getEffectiveStat(Stat.SPD);
    expect(consoleSpy).toHaveBeenLastCalledWith(
      "Applied",
      i18next.t("modifierType:SpeciesBoosterItem.QUICK_POWDER.name"),
      "",
    );
  });

  it("QUICK_POWDER held by DITTO", async () => {
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const partyMember = game.field.getPlayerPokemon();

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new NumberHolder(spdStat);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.heldItemManager.add(HeldItemId.QUICK_POWDER);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(2);
  });

  it("QUICK_POWDER held by fused DITTO (base)", async () => {
    await game.classicMode.startBattle([SpeciesId.DITTO, SpeciesId.MAROWAK]);

    const [partyMember, ally] = game.scene.getPlayerParty();

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
    const spdValue = new NumberHolder(spdStat);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.heldItemManager.add(HeldItemId.QUICK_POWDER);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(2);
  });

  it("QUICK_POWDER held by fused DITTO (part)", async () => {
    await game.classicMode.startBattle([SpeciesId.MAROWAK, SpeciesId.DITTO]);

    const [partyMember, ally] = game.scene.getPlayerParty();

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
    const spdValue = new NumberHolder(spdStat);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.heldItemManager.add(HeldItemId.QUICK_POWDER);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(2);
  });

  it("QUICK_POWDER not held by DITTO", async () => {
    await game.classicMode.startBattle([SpeciesId.MAROWAK]);

    const partyMember = game.field.getPlayerPokemon();

    const spdStat = partyMember.getStat(Stat.SPD);

    // Making sure modifier is not applied without holding item
    const spdValue = new NumberHolder(spdStat);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(1);

    // Giving Eviolite to party member and testing if it applies
    partyMember.heldItemManager.add(HeldItemId.QUICK_POWDER);
    applyHeldItems(HeldItemEffect.STAT_BOOST, { pokemon: partyMember, stat: Stat.SPD, statValue: spdValue });

    expect(spdValue.value / spdStat).toBe(1);
  });
});
