import { Stat } from "#enums/stat";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import * as Utils from "#app/utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatBoosterModifier } from "#app/modifier/modifier";

describe("Items - Eviolite", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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

    game.override.battleType("single").startingHeldItems([{ name: "EVIOLITE" }]);
  });

  it(
    "should provide 50% boost to DEF and SPDEF for unevolved, unfused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.PICHU]);

      const partyMember = game.scene.getPlayerPokemon()!;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.5));
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.5));
    },
    TIMEOUT,
  );

  it(
    "should not provide a boost for fully evolved, unfused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.RAICHU]);

      const partyMember = game.scene.getParty()[0];

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
    },
    TIMEOUT,
  );

  it(
    "should provide 50% boost to DEF and SPDEF for completely unevolved, fused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.PICHU, Species.CLEFFA]);

      const [partyMember, ally] = game.scene.getParty();

      // Fuse party members (taken from PlayerPokemon.fuse(...) function)
      partyMember.fusionSpecies = ally.species;
      partyMember.fusionFormIndex = ally.formIndex;
      partyMember.fusionAbilityIndex = ally.abilityIndex;
      partyMember.fusionShiny = ally.shiny;
      partyMember.fusionVariant = ally.variant;
      partyMember.fusionGender = ally.gender;
      partyMember.fusionLuck = ally.luck;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.5));
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.5));
    },
    TIMEOUT,
  );

  it(
    "should provide 25% boost to DEF and SPDEF for partially unevolved (base), fused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.PICHU, Species.CLEFABLE]);

      const [partyMember, ally] = game.scene.getParty();

      // Fuse party members (taken from PlayerPokemon.fuse(...) function)
      partyMember.fusionSpecies = ally.species;
      partyMember.fusionFormIndex = ally.formIndex;
      partyMember.fusionAbilityIndex = ally.abilityIndex;
      partyMember.fusionShiny = ally.shiny;
      partyMember.fusionVariant = ally.variant;
      partyMember.fusionGender = ally.gender;
      partyMember.fusionLuck = ally.luck;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.25));
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.25));
    },
    TIMEOUT,
  );

  it(
    "should provide 25% boost to DEF and SPDEF for partially unevolved (fusion), fused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.RAICHU, Species.CLEFFA]);

      const [partyMember, ally] = game.scene.getParty();

      // Fuse party members (taken from PlayerPokemon.fuse(...) function)
      partyMember.fusionSpecies = ally.species;
      partyMember.fusionFormIndex = ally.formIndex;
      partyMember.fusionAbilityIndex = ally.abilityIndex;
      partyMember.fusionShiny = ally.shiny;
      partyMember.fusionVariant = ally.variant;
      partyMember.fusionGender = ally.gender;
      partyMember.fusionLuck = ally.luck;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(Math.floor(defStat * 1.25));
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(spDefStat * 1.25));
    },
    TIMEOUT,
  );

  it(
    "should not provide a boost for fully evolved, fused pokemon",
    async () => {
      await game.classicMode.startBattle([Species.RAICHU, Species.CLEFABLE]);

      const [partyMember, ally] = game.scene.getParty();

      // Fuse party members (taken from PlayerPokemon.fuse(...) function)
      partyMember.fusionSpecies = ally.species;
      partyMember.fusionFormIndex = ally.formIndex;
      partyMember.fusionAbilityIndex = ally.abilityIndex;
      partyMember.fusionShiny = ally.shiny;
      partyMember.fusionVariant = ally.variant;
      partyMember.fusionGender = ally.gender;
      partyMember.fusionLuck = ally.luck;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
    },
    TIMEOUT,
  );

  it(
    "should not provide a boost for Gigantamax Pokémon",
    async () => {
      game.override.starterForms({
        [Species.PIKACHU]: 8,
        [Species.EEVEE]: 2,
        [Species.DURALUDON]: 1,
        [Species.MEOWTH]: 1,
      });

      const gMaxablePokemon = [Species.PIKACHU, Species.EEVEE, Species.DURALUDON, Species.MEOWTH];

      await game.classicMode.startBattle([Utils.randItem(gMaxablePokemon)]);

      const partyMember = game.scene.getPlayerPokemon()!;

      vi.spyOn(partyMember, "getEffectiveStat").mockImplementation((stat, _opponent?, _move?, _isCritical?) => {
        const statValue = new Utils.NumberHolder(partyMember.getStat(stat, false));
        game.scene.applyModifiers(StatBoosterModifier, partyMember.isPlayer(), partyMember, stat, statValue);

        // Ignore other calculations for simplicity

        return Math.floor(statValue.value);
      });

      const defStat = partyMember.getStat(Stat.DEF, false);
      const spDefStat = partyMember.getStat(Stat.SPDEF, false);

      expect(partyMember.getEffectiveStat(Stat.DEF)).toBe(defStat);
      expect(partyMember.getEffectiveStat(Stat.SPDEF)).toBe(spDefStat);
    },
    TIMEOUT,
  );
});
