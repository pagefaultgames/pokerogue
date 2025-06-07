import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { getTerrainName, TerrainType } from "#app/data/terrain";
import { MoveResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { capitalizeFirstLetter, randSeedInt, toDmgValue } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Terrain -", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  describe.each<{ terrain: string; type: PokemonType; ability: AbilityId; move: MoveId }>([
    { terrain: "Electric", type: PokemonType.ELECTRIC, ability: AbilityId.ELECTRIC_SURGE, move: MoveId.THUNDERBOLT },
    { terrain: "Psychic", type: PokemonType.PSYCHIC, ability: AbilityId.PSYCHIC_SURGE, move: MoveId.PSYCHIC },
    { terrain: "Grassy", type: PokemonType.GRASS, ability: AbilityId.GRASSY_SURGE, move: MoveId.GIGA_DRAIN },
  ])("Move Power Boosts - $terrain Terrain", ({ type, ability, move }) => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .disableCrits()
        .enemySpecies(SpeciesId.SNOM)
        .enemyAbility(AbilityId.STURDY)
        .ability(AbilityId.NO_GUARD)
        .passiveAbility(ability)
        .enemyPassiveAbility(AbilityId.LEVITATE);
    });

    const typeStr = capitalizeFirstLetter(PokemonType[type].toLowerCase());

    it(`should boost grounded uses of ${typeStr}-type moves by 1.3x, even against ungrounded targets`, async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");
      game.move.use(move);
      await game.move.forceEnemyMove(move);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      // Player grounded attack got boost while enemy ungrounded attack didn't
      expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);
      expect(powerSpy).toHaveNthReturnedWith(2, allMoves[move].power * 1.3);
    });

    it(`should change Terrain Pulse into a ${typeStr}-type move and double its base power`, async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      const powerSpy = vi.spyOn(allMoves[MoveId.TERRAIN_PULSE], "calculateBattlePower");
      const typeSpy = vi.spyOn(blissey, "getMoveType");

      game.move.use(move);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2.6); // 2 * 1.3
      expect(typeSpy).toHaveLastReturnedWith(type);
    });
  });

  describe("Grassy Terrain", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .disableCrits()
        .enemyLevel(100)
        .enemySpecies(SpeciesId.SHUCKLE)
        .enemyAbility(AbilityId.STURDY)
        .enemyMoveset(MoveId.GRASSY_TERRAIN)
        .ability(AbilityId.NO_GUARD);
    });

    it("should heal all grounded, non-semi-invulnerable pokemon for 1/16th max HP at end of turn", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = toDmgValue(blissey.getMaxHp() / 2);
      expect(blissey.getHpRatio()).toBeCloseTo(0.5, 1);

      const shuckle = game.field.getEnemyPokemon();
      game.field.mockAbility(shuckle, AbilityId.LEVITATE);
      shuckle.hp = toDmgValue(shuckle.getMaxHp() / 2);
      expect(shuckle.getHpRatio()).toBeCloseTo(0.5, 1);

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
      expect(blissey.getHpRatio()).toBeCloseTo(0.5625, 1);
      expect(shuckle.getHpRatio()).toBeCloseTo(0.5, 1);
      game.phaseInterceptor.clearLogs();

      game.move.use(MoveId.DIG);
      await game.toNextTurn();

      // shuckle is airborne and blissey is semi-invulnerable, so nobody gets healed
      expect(blissey.getHpRatio()).toBeCloseTo(0.5625, 1);
      expect(shuckle.getHpRatio()).toBeCloseTo(0.5, 1);
    });

    it.each<{ name: string; move: MoveId; basePower?: number }>([
      { name: "Bulldoze", move: MoveId.BULLDOZE },
      { name: "Earthquake", move: MoveId.EARTHQUAKE },
      { name: "Magnitude", move: MoveId.MAGNITUDE, basePower: 150 }, // magnitude 10
    ])(
      "should halve $name's base power against grounded, on-field targets",
      async ({ move, basePower = allMoves[move].power }) => {
        await game.classicMode.startBattle([SpeciesId.TAUROS]);
        // force high rolls for guaranteed magnitude 10s
        vi.fn(randSeedInt).mockReturnValue(100);

        const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

        // Turn 1: attack before grassy terrain set up; 1x
        game.move.use(move);
        await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
        await game.toNextTurn();

        expect(powerSpy).toHaveLastReturnedWith(basePower);

        // Turn 2: attack with grassy terrain already active; 0.5x
        game.move.use(move);
        await game.toNextTurn();

        expect(powerSpy).toHaveLastReturnedWith(basePower / 2);

        // Turn 3: Give enemy levitate to make ungrounded and attack; 1x
        game.field.mockAbility(game.field.getEnemyPokemon(), AbilityId.LEVITATE);
        game.move.use(move);
        await game.toNextTurn();

        expect(powerSpy).toHaveLastReturnedWith(basePower);

        // Turn 4: Remove levitate and make enemy semi-invulnerable; 1x
        game.field.mockAbility(game.field.getEnemyPokemon(), AbilityId.BALL_FETCH);
        game.move.use(move);
        await game.move.forceEnemyMove(MoveId.FLY);
        await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
        await game.toNextTurn();

        expect(powerSpy).toHaveLastReturnedWith(basePower);
      },
    );
  });

  // TODO: Enable after terrain block PR is added
  describe.skip("Electric Terrain", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .disableCrits()
        .enemyLevel(100)
        .enemySpecies(SpeciesId.SHUCKLE)
        .enemyAbility(AbilityId.ELECTRIC_SURGE)
        .enemyPassiveAbility(AbilityId.LEVITATE)
        .ability(AbilityId.NO_GUARD);
    });

    it("should prevent all grounded pokemon from being put to sleep", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.SPORE);
      await game.move.forceEnemyMove(MoveId.SPORE);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey.status?.effect).toBeUndefined();
      expect(shuckle.status?.effect).toBe(StatusEffect.SLEEP);
      // TODO: These don't work due to how move failures are propagated
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

      expect(game.textInterceptor.logs).not.toContain(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.ELECTRIC),
        }),
      );
    });

    it("should prevent attack moves from applying sleep without showing text/failing move", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);
      vi.spyOn(allMoves[MoveId.RELIC_SONG], "chance", "get").mockReturnValue(100);

      game.move.use(MoveId.RELIC_SONG);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(shuckle.status?.effect).toBeUndefined();
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

      expect(game.textInterceptor.logs).not.toContain(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.ELECTRIC),
        }),
      );
    });
  });

  describe("Misty Terrain", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .disableCrits()
        .enemyLevel(100)
        .enemySpecies(SpeciesId.SHUCKLE)
        .enemyAbility(AbilityId.MISTY_SURGE)
        .enemyPassiveAbility(AbilityId.LEVITATE)
        .ability(AbilityId.NO_GUARD);
    });

    it("should prevent all grounded pokemon from being statused or confused", async () => {
      game.override.confusionActivation(false); // prevent self hits from ruining things
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      // blissey is grounded, shuckle isn't
      game.move.use(MoveId.TOXIC);
      await game.move.forceEnemyMove(MoveId.TOXIC);
      await game.toNextTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey.status?.effect).toBeUndefined();
      expect(shuckle.status?.effect).toBe(StatusEffect.TOXIC);
      // TODO: These don't work due to how move failures are propagated
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

      expect(game.textInterceptor.logs).toContain(
        i18next.t("terrain:mistyBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
        }),
      );
      game.textInterceptor.logs = [];

      game.move.use(MoveId.CONFUSE_RAY);
      await game.move.forceEnemyMove(MoveId.CONFUSE_RAY);
      await game.toNextTurn();

      expect(blissey.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
      expect(shuckle.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
    });

    it("should prevent attack moves from applying status without showing text/failing move", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);
      vi.spyOn(allMoves[MoveId.SACRED_FIRE], "chance", "get").mockReturnValue(100);

      game.move.use(MoveId.SACRED_FIRE);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(shuckle.status?.effect).toBeUndefined();
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

      expect(game.textInterceptor.logs).not.toContain(
        i18next.t("terrain:mistyBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
        }),
      );
    });
  });

  describe("Psychic Terrain", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .disableCrits()
        .enemyLevel(100)
        .enemySpecies(SpeciesId.SHUCKLE)
        .enemyAbility(AbilityId.PSYCHIC_SURGE)
        .enemyPassiveAbility(AbilityId.PRANKSTER)
        .ability(AbilityId.NO_GUARD)
        .passiveAbility(AbilityId.GALE_WINGS);
    });

    it("should block all opponent-targeted priority moves", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      // normal + priority moves
      game.move.use(MoveId.FAKE_OUT);
      await game.move.forceEnemyMove(MoveId.FOLLOW_ME);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(game.textInterceptor.logs).toContain(
        i18next.t("terrain:defaultBlockMessage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(shuckle),
          terrainName: getTerrainName(TerrainType.PSYCHIC),
        }),
      );

      // moves that only become priority via ability
      blissey.hp = 1;
      game.move.use(MoveId.ROOST);
      await game.move.forceEnemyMove(MoveId.TICKLE);
      await game.toEndOfTurn();

      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });

    // TODO: This needs to be fixed
    it.todo("should not block enemy-targeting spread moves, even if they become priority", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(MoveId.AIR_CUTTER);
      await game.move.forceEnemyMove(MoveId.SWEET_SCENT);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      const shuckle = game.field.getEnemyPokemon();
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(shuckle.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(shuckle.hp).toBeLessThan(shuckle.getMaxHp());
      expect(blissey.getStatStage(Stat.EVA)).toBe(-2);
    });
  });
});
