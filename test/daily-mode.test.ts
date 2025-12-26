import { pokerogueApi } from "#api/pokerogue-api";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { MapModifier } from "#modifiers/modifier";
import { getPartyLuckValue } from "#modifiers/modifier-type";
import { GameManager } from "#test/test-utils/game-manager";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Daily Mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.disableShinies = false;
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should initialize properly", async () => {
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
    await game.dailyMode.startBattle();

    const party = game.scene.getPlayerParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
    expect(game.scene.getModifiers(MapModifier).length).toBe(1);
  });

  describe("Custom Seeds", () => {
    describe("Starters", () => {
      it("should support custom species IDs", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
          '{"starters":[{"speciesId":1},{"speciesId":113},{"speciesId":1024}]}',
        );
        await game.dailyMode.startBattle();

        const party = game.scene.getPlayerParty().map(p => p.species.speciesId);
        expect(party, stringifyEnumArray(SpeciesId, party)).toEqual([
          SpeciesId.BULBASAUR,
          SpeciesId.CHANSEY,
          SpeciesId.TERAPAGOS,
        ]);
      });

      it("should support custom forms and variants", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
          '{"starters":[{"speciesId":6,"formIndex":1,"variant":2},{"speciesId":113,"variant":0},{"speciesId":1024,"formIndex":2}]}',
        );
        await game.dailyMode.startBattle();

        const party = game.scene.getPlayerParty().map(p => ({
          speciesId: p.species.speciesId,
          variant: p.getVariant(),
          form: p.formIndex,
          shiny: p.isShiny(),
        }));
        expect(party).toEqual<typeof party>([
          { speciesId: SpeciesId.CHARIZARD, variant: 2, form: 1, shiny: true },
          { speciesId: SpeciesId.CHANSEY, variant: 0, form: 0, shiny: true },
          { speciesId: SpeciesId.TERAPAGOS, variant: expect.anything(), form: 2, shiny: false },
        ]);
      });

      it("should support custom natures", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
          '{"starters":[{"speciesId":1,"nature":0},{"speciesId":113,"nature":1},{"speciesId":1024,"nature":2}]}',
        );
        await game.dailyMode.startBattle();

        const natures = game.scene.getPlayerParty().map(p => p.getNature());
        expect(natures, stringifyEnumArray(Nature, natures)).toEqual([Nature.HARDY, Nature.LONELY, Nature.BRAVE]);
      });

      describe("Moves", () => {
        it("should support custom moves", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
            '{"starters":[{"speciesId":150,"moveset":[1,2,3,4]},{"speciesId":150,"moveset":[332,6]},{"speciesId":150,"moveset":[130,919]}]}',
          );
          await game.dailyMode.startBattle();

          const [moves1, moves2, moves3] = game.scene.getPlayerParty().map(p => p.moveset.map(pm => pm.moveId));
          expect(moves1, stringifyEnumArray(MoveId, moves1)).toEqual([
            MoveId.POUND,
            MoveId.KARATE_CHOP,
            MoveId.DOUBLE_SLAP,
            MoveId.COMET_PUNCH,
          ]);
          expect(moves2, stringifyEnumArray(MoveId, moves2)).toEqual([
            MoveId.AERIAL_ACE,
            MoveId.PAY_DAY,
            expect.any(Number), // make sure it doesn't replace normal moveset gen
            expect.any(Number),
          ]);
          expect(moves3, stringifyEnumArray(MoveId, moves3)).toEqual([
            MoveId.SKULL_BASH,
            MoveId.MALIGNANT_CHAIN,
            expect.any(Number),
            expect.any(Number),
          ]);
        });

        it("should allow omitting movesets for some starters", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
            '{"starters":[{"speciesId":349,"moveset":[1,2,3,4]},{"speciesId":150},{"speciesId":150}]}',
          );
          await game.dailyMode.startBattle();

          const [moves1, moves2, moves3] = game.scene.getPlayerParty().map(p => p.moveset.map(pm => pm.moveId));
          expect(moves1, stringifyEnumArray(MoveId, moves1)).toEqual([
            MoveId.POUND,
            MoveId.KARATE_CHOP,
            MoveId.DOUBLE_SLAP,
            MoveId.COMET_PUNCH,
          ]);
          expect(moves2, "was not a random moveset").toHaveLength(4);
          expect(moves3, "was not a random moveset").toHaveLength(4);
        });

        it("should skip invalid move IDs", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
            '{"starters":[{"speciesId":349,"moveset":[9999]},{"speciesId":150, "moveset":[]},{"speciesId":150}]}',
          );
          await game.dailyMode.startBattle();

          const moves = game.field.getPlayerPokemon().moveset.map(pm => pm.moveId);
          expect(moves, "invalid move was in moveset").not.toContain(9999);
        });
      });
    });

    describe("Boss", () => {
      beforeEach(() => {
        game.override.startingWave(50);
      });
      it("should support custom species IDs", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150}}');
        await game.dailyMode.startBattle();

        const boss = game.field.getEnemyPokemon();
        expect(boss.species.speciesId).toBe(SpeciesId.MEWTWO);
      });

      it("should support custom forms and variants", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue(
          '{"boss":{"speciesId":150,"formIndex":1,"variant":2}}',
        );
        await game.dailyMode.startBattle();

        const boss = game.field.getEnemyPokemon();
        expect(boss.species.speciesId).toBe(SpeciesId.MEWTWO);
        expect(boss.formIndex).toBe(1);
        expect(boss.getVariant()).toBe(2);
      });

      describe("Moves", () => {
        it("should support custom moves", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"moveset":[1,2,3,4]}}');
          await game.dailyMode.startBattle();

          const moves = game.field.getEnemyPokemon().moveset.map(pm => pm.moveId);
          expect(moves, stringifyEnumArray(MoveId, moves)).toEqual([
            MoveId.POUND,
            MoveId.KARATE_CHOP,
            MoveId.DOUBLE_SLAP,
            MoveId.COMET_PUNCH,
          ]);
        });

        it("should allow omitting some moves", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"moveset":[1,2]}}');
          await game.dailyMode.startBattle();
          const moves = game.field.getEnemyPokemon().moveset.map(pm => pm.moveId);
          expect(moves, "not enough moves").toHaveLength(4);
          expect(moves, stringifyEnumArray(MoveId, moves)).toEqual([
            MoveId.POUND,
            MoveId.KARATE_CHOP,
            expect.any(Number),
            expect.any(Number),
          ]);
        });

        it("should skip invalid move IDs", async () => {
          vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"moveset":[9999]}}');
          await game.dailyMode.startBattle();

          const moves = game.field.getPlayerPokemon().moveset.map(pm => pm.moveId);
          expect(moves, "invalid move was in moveset").not.toContain(9999);
        });
      });

      it("should support custom ability", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"ability":1}}');
        await game.dailyMode.startBattle();

        const ability = game.field.getEnemyPokemon().getAbility();
        expect(ability.id).toBe(AbilityId.STENCH);
      });

      it("should support custom passive", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"passive":1}}');
        await game.dailyMode.startBattle();

        const ability = game.field.getEnemyPokemon().getPassiveAbility();
        expect(ability.id).toBe(AbilityId.STENCH);
      });

      it("should not allow invalid ability IDs", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"ability":9999}}');
        await game.dailyMode.startBattle();

        const ability = game.field.getEnemyPokemon().getAbility();
        expect(ability.id).not.toBe(9999);
      });

      it("should not allow invalid passive IDs", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"passive":9999}}');
        await game.dailyMode.startBattle();

        const ability = game.field.getEnemyPokemon().getPassiveAbility();
        expect(ability.id).not.toBe(9999);
      });

      it("should support custom nature", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"nature":0}}');
        await game.dailyMode.startBattle();

        const nature = game.field.getEnemyPokemon().getNature();
        expect(nature).toBe(Nature.HARDY);
      });

      it("should not allow invalid nature IDs", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"boss":{"speciesId":150,"nature":9999}}');
        await game.dailyMode.startBattle();

        const nature = game.field.getEnemyPokemon().getNature();
        expect(nature).not.toBe(9999);
      });
    });

    describe("Misc", () => {
      it("should support custom biome", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"biome":40}');
        await game.dailyMode.startBattle();

        expect(game.scene.arena.biomeType).toBe(BiomeId.ISLAND);
      });

      it("should support custom starting money", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"startingMoney":1234567890}');
        await game.dailyMode.startBattle();

        expect(game.scene.money).toBe(1234567890);
      });

      it("should support custom luck", async () => {
        vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue('{"luck":14}');
        await game.dailyMode.startBattle();

        expect(getPartyLuckValue(game.field.getPlayerParty())).toBe(14);
      });
    });
  });
});

describe("Shop modifications", async () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });
  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .startingWave(9)
      .startingBiome(BiomeId.ICE_CAVE)
      .battleStyle("single")
      .startingLevel(100) // Avoid levelling up
      .disableTrainerWaves()
      .moveset([MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    game.modifiers.addCheck("EVIOLITE").addCheck("MINI_BLACK_HOLE");
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    game.modifiers.clearChecks();
  });

  it("should not have Eviolite and Mini Black Hole available in Classic if not unlocked", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", false).testCheck("MINI_BLACK_HOLE", false);
    });
  });

  it("should have Eviolite and Mini Black Hole available in Daily", async () => {
    await game.dailyMode.startBattle();
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", true).testCheck("MINI_BLACK_HOLE", true);
    });
  });
});
