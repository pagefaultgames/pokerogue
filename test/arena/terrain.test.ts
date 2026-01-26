import { allMoves } from "#app/data/data-lists";
import { getTerrainName, TerrainType } from "#app/data/terrain";
import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MovePriorityInBracket } from "#enums/move-priority-in-bracket";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Terrain -", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .startingLevel(100)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY)
      .passiveAbility(AbilityId.NO_GUARD);
  });

  // TODO: Terrain boosts currently apply directly to damage dealt, not base power -
  // enable once they are refactored for mainline parity
  describe.todo.each<{ name: string; type: PokemonType; terrain: TerrainType; move: MoveId }>([
    { name: "Electric", type: PokemonType.ELECTRIC, terrain: TerrainType.ELECTRIC, move: MoveId.THUNDERBOLT },
    { name: "Psychic", type: PokemonType.PSYCHIC, terrain: TerrainType.PSYCHIC, move: MoveId.PSYCHIC },
    { name: "Grassy", type: PokemonType.GRASS, terrain: TerrainType.GRASSY, move: MoveId.ENERGY_BALL },
    { name: "Misty", type: PokemonType.FAIRY, terrain: TerrainType.MISTY, move: MoveId.DRAGON_BREATH },
  ])("Common Tests - $name Terrain", ({ type, terrain, move }) => {
    beforeEach(() => {
      game.override.startingTerrain(terrain).enemyPassiveAbility(AbilityId.LEVITATE);
    });

    const typeStr = toTitleCase(PokemonType[type]);

    it.skipIf(terrain === TerrainType.MISTY)(
      `should boost power of grounded ${typeStr}-type moves by 1.3x, even against ungrounded targets`,
      async () => {
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

        game.move.use(move);
        await game.move.forceEnemyMove(move);
        await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
        await game.toEndOfTurn();

        // Player grounded attack got boosted while enemy ungrounded attack didn't
        expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 1.3);
        expect(powerSpy).toHaveNthReturnedWith(1, allMoves[move].power);
      },
    );

    it.runIf(terrain === TerrainType.MISTY)(
      "should cut power of grounded Dragon-type moves in half, even from ungrounded users",
      async () => {
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");
        game.move.use(move);
        await game.move.forceEnemyMove(move);
        await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
        await game.toEndOfTurn();

        // Enemy dragon breath got nerfed against grounded player; player dragon breath did not
        expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);
        expect(powerSpy).toHaveNthReturnedWith(1, allMoves[move].power * 0.5);
      },
    );

    // TODO: Move to a dedicated terrain pulse test file
    it(`should change Terrain Pulse into a ${typeStr}-type move and double its base power`, async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const powerSpy = vi.spyOn(allMoves[MoveId.TERRAIN_PULSE], "calculateBattlePower");
      const playerTypeSpy = vi.spyOn(game.field.getPlayerPokemon(), "getMoveType");
      const enemyTypeSpy = vi.spyOn(game.field.getEnemyPokemon(), "getMoveType");

      game.move.use(MoveId.TERRAIN_PULSE);
      await game.move.forceEnemyMove(MoveId.TERRAIN_PULSE);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      // player grounded terrain pulse was boosted & type converted; enemy ungrounded one wasn't
      expect(powerSpy).toHaveLastReturnedWith(
        allMoves[MoveId.TERRAIN_PULSE].power * 2 * (terrain === TerrainType.MISTY ? 1 : 1.3),
      );
      expect(playerTypeSpy).toHaveLastReturnedWith(type);
      expect(powerSpy).toHaveNthReturnedWith(1, allMoves[MoveId.TERRAIN_PULSE].power);
      expect(enemyTypeSpy).toHaveNthReturnedWith(1, allMoves[MoveId.TERRAIN_PULSE].type);
    });
  });

  describe("Grassy Terrain", () => {
    beforeEach(() => {
      game.override.startingTerrain(TerrainType.GRASSY);
    });

    it("should heal all grounded, non semi-invulnerable Pokemon for 1/16th max HP at end of turn", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      // blissey is grounded, shuckle isn't
      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      game.field.mockAbility(shuckle, AbilityId.LEVITATE);
      blissey.hp /= 2;
      shuckle.hp /= 2;

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
      expect(blissey.getHpRatio()).toBeCloseTo(0.5625, 1);
      expect(shuckle.getHpRatio()).toBeCloseTo(0.5, 1);

      game.phaseInterceptor.clearLogs();

      game.move.use(MoveId.DIG);
      await game.toNextTurn();

      // shuckle is airborne and blissey is semi-invulnerable, so nobody gets healed
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(blissey.getHpRatio()).toBeCloseTo(0.5625, 1);
      expect(shuckle.getHpRatio()).toBeCloseTo(0.5, 1);
    });

    // TODO: Move to Earthquake & co.'s test files if/when they get one
    // (maybe merge with Rising Voltage)
    it.each<{ name: string; move: MoveId; basePower?: number }>([
      { name: "Bulldoze", move: MoveId.BULLDOZE },
      { name: "Earthquake", move: MoveId.EARTHQUAKE },
      // TODO: Enable once magnitude is reworked to be able to return a specific power rating on demand
      // { name: "Magnitude", move: MoveId.MAGNITUDE, basePower: 150 }, // magnitude 10
    ])("should halve $name's base power against grounded, on-field targets", async ({
      move,
      basePower = allMoves[move].power,
    }) => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // force high rolls for guaranteed magnitude 10s
      vi.spyOn(Phaser.Math.RND, "integerInRange").mockImplementation((_min, max) => max);

      const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

      // Turn 1: attack with grassy terrain active; 0.5x
      game.move.use(move);
      await game.toNextTurn();

      expect(powerSpy).toHaveLastReturnedWith(basePower / 2);
      powerSpy.mockClear();

      // Turn 2: Make shuckle semi-invulnerable & hit through No Guard; 1x
      game.move.use(move);
      await game.move.forceEnemyMove(MoveId.DIG);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(powerSpy).toHaveLastReturnedWith(basePower);
    });
  });

  describe("Electric Terrain", () => {
    beforeEach(() => {
      game.override.startingTerrain(TerrainType.ELECTRIC);
    });

    it("should prevent all grounded Pokemon from being put to sleep", async () => {
      await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

      game.move.use(MoveId.SPORE);
      await game.move.forceEnemyMove(MoveId.SPORE);
      await game.toEndOfTurn();

      const pidgeot = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(pidgeot).toHaveStatusEffect(StatusEffect.SLEEP);
      expect(shuckle).toHaveStatusEffect(StatusEffect.NONE);
      // TODO: These don't work due to how move failures are propagated
      // expect(pidgeot).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.FAIL });
      // expect(shuckle).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.SUCCESS });

      expect(game).toHaveShownMessage(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.ELECTRIC),
        }),
      );
    });

    it("should prevent attack moves from applying sleep without showing text/failing move", async () => {
      vi.spyOn(allMoves[MoveId.RELIC_SONG], "chance", "get").mockReturnValue(100);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      const statusSpy = vi.spyOn(shuckle, "canSetStatus");

      game.move.use(MoveId.RELIC_SONG);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(shuckle).toHaveStatusEffect(StatusEffect.NONE);
      expect(statusSpy).toHaveLastReturnedWith(false);
      expect(blissey).toHaveUsedMove({ move: MoveId.RELIC_SONG, result: MoveResult.SUCCESS });

      expect(game).not.toHaveShownMessage(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.ELECTRIC),
        }),
      );
    });
  });

  describe("Misty Terrain", () => {
    beforeEach(() => {
      game.override.startingTerrain(TerrainType.MISTY).enemyPassiveAbility(AbilityId.LEVITATE);
    });

    it("should prevent all grounded Pokemon from gaining non-volatile statuses", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.TOXIC);
      await game.move.forceEnemyMove(MoveId.TOXIC);
      await game.toNextTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      // blissey is grounded & protected, shuckle isn't
      expect(blissey).toHaveStatusEffect(StatusEffect.NONE);
      expect(shuckle).toHaveStatusEffect(StatusEffect.TOXIC);
      // TODO: These don't work due to how move failures are propagated
      // expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      // expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

      expect(game).toHaveShownMessage(
        i18next.t("terrain:mistyBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(blissey),
        }),
      );
    });

    it("should block confusion and display message", async () => {
      game.override.confusionActivation(false); // prevent self hits from cancelling move
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.CONFUSE_RAY);
      await game.move.forceEnemyMove(MoveId.CONFUSE_RAY);
      await game.toNextTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      // blissey is grounded & protected, shuckle isn't
      expect(blissey).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
      expect(shuckle).toHaveBattlerTag(BattlerTagType.CONFUSED);
      expect(game).toHaveShownMessage(
        i18next.t("terrain:mistyBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(blissey),
        }),
      );
    });

    it.each<{ status: string; move: MoveId }>([
      { status: "Sleep", move: MoveId.RELIC_SONG },
      { status: "Burn", move: MoveId.SACRED_FIRE },
      { status: "Freeze", move: MoveId.ICE_BEAM },
      { status: "Paralysis", move: MoveId.NUZZLE },
      { status: "Poison", move: MoveId.SLUDGE_BOMB },
      { status: "Toxic Poison", move: MoveId.MALIGNANT_CHAIN },
      { status: "Confusion", move: MoveId.MAGICAL_TORQUE },
    ])("should prevent attack moves from applying $status without showing text/failing move", async ({ move }) => {
      vi.spyOn(allMoves[move], "chance", "get").mockReturnValue(100);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(move);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      // Blissey was grounded and protected from effect, but still took damage
      expect(blissey).not.toHaveFullHp();
      expect(blissey).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
      expect(blissey).toHaveStatusEffect(StatusEffect.NONE);
      expect(shuckle).toHaveUsedMove({ move, result: MoveResult.SUCCESS });

      expect(game).not.toHaveShownMessage(
        i18next.t("terrain:mistyBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(blissey),
        }),
      );
    });
  });

  describe("Psychic Terrain", () => {
    beforeEach(() => {
      game.override.startingTerrain(TerrainType.PSYCHIC);
    });

    it("should block all opponent-targeted priority moves", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.QUICK_ATTACK);
      await game.move.forceEnemyMove(MoveId.WIDE_GUARD);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
      expect(shuckle).toHaveUsedMove({ move: MoveId.WIDE_GUARD, result: MoveResult.SUCCESS });
      expect(game).toHaveShownMessage(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.PSYCHIC),
        }),
      );
    });

    it("should affect moves that only become priority due to abilities", async () => {
      game.override.ability(AbilityId.PRANKSTER).enemyAbility(AbilityId.PRANKSTER);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.FEATHER_DANCE);
      await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey).toHaveUsedMove({ move: MoveId.FEATHER_DANCE, result: MoveResult.FAIL });
      expect(shuckle).toHaveUsedMove({ move: MoveId.SWORDS_DANCE, result: MoveResult.SUCCESS });
      expect(game).toHaveShownMessage(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.PSYCHIC),
        }),
      );
    });

    it.each<{ category: string; move: MoveId; effect: () => void }>([
      {
        category: "Field-targeted",
        move: MoveId.RAIN_DANCE,
        effect: () => {
          expect(game).toHaveWeather(WeatherType.RAIN);
        },
      },
      {
        category: "Enemy-targeting spread",
        move: MoveId.DARK_VOID,
        effect: () => {
          expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.SLEEP);
        },
      },
    ])("should not block $category moves that become priority", async ({ move, effect }) => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(move);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      expect(blissey).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
      effect();
    });

    it("should not block non-priority moves boosted by Quick Claw/Quick Draw", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();
      feebas.addTag(BattlerTagType.BYPASS_SPEED);
      expect(allMoves[MoveId.POUND].getPriority(feebas)).toBe(0);
      expect(allMoves[MoveId.POUND].getPriorityModifier(feebas)).toBe(MovePriorityInBracket.FIRST);

      game.move.use(MoveId.POUND);
      await game.toEndOfTurn();

      const shuckle = game.field.getEnemyPokemon();
      expect(shuckle).not.toHaveFullHp();
    });

    it("should block priority moves boosted by Quick Claw/Quick Draw", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();
      feebas.addTag(BattlerTagType.BYPASS_SPEED);
      expect(allMoves[MoveId.QUICK_ATTACK].getPriority(feebas)).toBe(1);
      expect(allMoves[MoveId.QUICK_ATTACK].getPriorityModifier(feebas)).toBe(MovePriorityInBracket.FIRST);

      game.move.use(MoveId.QUICK_ATTACK);
      await game.toEndOfTurn();

      const shuckle = game.field.getEnemyPokemon();
      expect(shuckle).toHaveFullHp();
    });
  });
});
