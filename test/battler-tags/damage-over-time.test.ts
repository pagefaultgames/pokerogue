import type { DamageOverTimeTag, SaltCuredTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

describe("Battler Tags - Damage Over Time", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let feebas: PlayerPokemon;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .passiveAbility(AbilityId.NO_GUARD)
      .statusEffect(StatusEffect.SLEEP)
      .enemyLevel(100)
      .startingLevel(100)
      .criticalHits(false);

    await game.classicMode.startBattle([SpeciesId.SHUPPET]);

    feebas = game.field.getPlayerPokemon();
  });

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });

  afterEach(() => {
    feebas.resetSummonData();
    game.field.getEnemyPokemon().resetSummonData();
    game.scene.phaseManager.clearAllPhases();
  });

  describe.each([
    { tagType: BattlerTagType.NIGHTMARE, name: "Nightmare" },
    { tagType: BattlerTagType.SALT_CURED, name: "Salt Cure" },
    { tagType: BattlerTagType.CURSED, name: "Nightmare" },
  ])("$name", ({ tagType }) => {
    it("should deal persistent max HP-based damage each turn and queue animations", () => {
      feebas.addTag(tagType);
      expect(feebas).toHaveBattlerTag(tagType);

      const dotTag = feebas.getTag(tagType) as DamageOverTimeTag;
      const dmgPercent = dotTag["getDamageHpRatio"](feebas);
      const anim = dotTag["animation"];

      feebas.lapseTag(tagType, BattlerTagLapseType.TURN_END);

      expect(feebas.getHpRatio()).toBe(1 - dmgPercent);
      expect(
        game.scene.phaseManager.hasPhaseOfType("CommonAnimPhase", c => c.getPokemon() === feebas && c["anim"] === anim),
      ).toBe(true);
    });
  });

  describe("Salt Cure", () => {
    let saltTag: SaltCuredTag;

    beforeAll(() => {
      feebas.addTag(BattlerTagType.SALT_CURED);
      expect(feebas).toHaveBattlerTag(BattlerTagType.SALT_CURED);

      saltTag = feebas.getTag(BattlerTagType.SALT_CURED) as SaltCuredTag;
    });

    it.each([
      { name: "dual Water/Steel", types: [PokemonType.WATER, PokemonType.STEEL], dmgPercent: 0.25 },
      { name: "Steel", types: [PokemonType.STEEL], dmgPercent: 0.25 },
      { name: "Water", types: [PokemonType.WATER], dmgPercent: 0.25 },
      { name: "neither Water nor Steel", types: [PokemonType.GRASS], dmgPercent: 0.125 },
    ])("should deal $dmgPercent% to a $name-type Pokemon", ({ dmgPercent, types }) => {
      feebas.summonData.types = types;

      const percent = saltTag.getDamageHpRatio(feebas);
      expect(percent).toBe(dmgPercent);
    });
  });
});
