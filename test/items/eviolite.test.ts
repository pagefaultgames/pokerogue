import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatBoosterModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder, randItem } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Eviolite", () => {
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

    game.override.battleStyle("single").startingHeldItems([{ name: "EVIOLITE" }]);
  });

  it("should provide 50% boost to DEF and SPDEF for unevolved, unfused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PICHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.5));
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.5));
  });

  it("should not provide a boost for fully evolved, unfused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.RAICHU]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
  });

  it("should provide 50% boost to DEF and SPDEF for completely unevolved, fused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PICHU, SpeciesId.CLEFFA]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.5));
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.5));
  });

  it("should provide 25% boost to DEF and SPDEF for partially unevolved (base), fused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PICHU, SpeciesId.CLEFABLE]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.25));
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.25));
  });

  it("should provide 25% boost to DEF and SPDEF for partially unevolved (fusion), fused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.CLEFFA]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.25));
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.25));
  });

  it("should not provide a boost for fully evolved, fused pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.CLEFABLE]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
  });

  it("should not provide a boost for Gigantamax Pokémon", async () => {
    game.override.starterForms({
      [SpeciesId.PIKACHU]: 8,
      [SpeciesId.EEVEE]: 2,
      [SpeciesId.DURALUDON]: 1,
      [SpeciesId.MEOWTH]: 1,
    });

    const gMaxablePokemon = [SpeciesId.PIKACHU, SpeciesId.EEVEE, SpeciesId.DURALUDON, SpeciesId.MEOWTH];

    await game.classicMode.startBattle([randItem(gMaxablePokemon)]);

    const partyMember = game.field.getPlayerPokemon();

    vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
      const statValue = new NumberHolder(partyMember.getStat(stat, false));
      game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

      // Ignore other calculations for simplicity

      return Math.floor(statValue.value);
    });

    const defStat = partyMember.getStat(Stat.DEF, false);
    const spDefStat = partyMember.getStat(Stat.SPDEF, false);

    expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
    expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
  });
});
