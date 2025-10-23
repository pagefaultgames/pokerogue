import { getPokemonNameWithAffix } from "#app/messages";
import type { SaltCuredTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import type { DamagingBattlerTagType } from "#types/battler-tags";
import i18next from "i18next";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Battler Tags - Damage Over Time", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let feebas: PlayerPokemon;
  let karp: EnemyPokemon;

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
    karp = game.field.getEnemyPokemon();
  });

  beforeEach(() => {
    // spy on the message queue function to just show the message instantly
    // TODO: Consider making a `textInterceptor` mock
    vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation(message => {
      game.textInterceptor.showText(message);
    });
  });

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });

  afterEach(() => {
    feebas.hp = feebas.getMaxHp();
    feebas.resetSummonData();
    game.field.getEnemyPokemon().resetSummonData();
    game.scene.phaseManager.clearAllPhases();
  });

  describe.each<{ tagType: DamagingBattlerTagType; name: string }>([
    { tagType: BattlerTagType.NIGHTMARE, name: "Nightmare" },
    { tagType: BattlerTagType.SALT_CURED, name: "Salt Cure" },
    { tagType: BattlerTagType.CURSED, name: "Curse" },
    { tagType: BattlerTagType.FIRE_SPIN, name: "Fire Spin" },
    { tagType: BattlerTagType.WHIRLPOOL, name: "Whirlpool" },
    { tagType: BattlerTagType.MAGMA_STORM, name: "Magma Storm" },
    { tagType: BattlerTagType.THUNDER_CAGE, name: "Thunder Cage" },
    { tagType: BattlerTagType.CLAMP, name: "Clamp" },
    { tagType: BattlerTagType.BIND, name: "Bind" },
    { tagType: BattlerTagType.WRAP, name: "Wrap" },
  ])("$name", ({ tagType }) => {
    it("should deal persistent max HP-based damage each turn and queue animations", async () => {
      feebas.addTag(tagType, 0, undefined, karp.id);
      expect(feebas).toHaveBattlerTag(tagType);

      const dotTag = feebas.getTag(tagType);
      const dmgPercent = dotTag["getDamageHpRatio"](feebas);
      const anim = dotTag["animation"];

      feebas.lapseTag(tagType, BattlerTagLapseType.TURN_END);

      expect(feebas.getHpRatio(true)).toBeCloseTo(1 - dmgPercent);
      expect(
        game.scene.phaseManager.hasPhaseOfType("CommonAnimPhase", c => c.getPokemon() === feebas && c["anim"] === anim),
      ).toBe(true);
      expect(game).toHaveShownMessage(
        i18next.t(this.triggerMessageKey, {
          pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
          sourcePokemonName: getPokemonNameWithAffix(karp),
        }),
      );
    });
  });

  describe("Salt Cure", () => {
    let saltTag: SaltCuredTag;

    beforeEach(() => {
      feebas.addTag(BattlerTagType.SALT_CURED, 0, undefined, game.field.getEnemyPokemon().id);
      expect(feebas).toHaveBattlerTag(BattlerTagType.SALT_CURED);

      saltTag = feebas.getTag(BattlerTagType.SALT_CURED) as SaltCuredTag;
    });

    it.each([
      { name: "dual Water/Steel", types: [PokemonType.WATER, PokemonType.STEEL], dmgPercent: 25 },
      { name: "Steel", types: [PokemonType.STEEL], dmgPercent: 25 },
      { name: "Water", types: [PokemonType.WATER], dmgPercent: 25 },
      { name: "neither Water nor Steel", types: [PokemonType.GRASS], dmgPercent: 12.5 },
    ])("should deal $dmgPercent% of max HP to a $name-type Pokemon", ({ dmgPercent, types }) => {
      feebas.summonData.types = types;

      const percent = saltTag.getDamageHpRatio(feebas);
      expect(percent).toBe(dmgPercent / 100);
    });
  });
});
