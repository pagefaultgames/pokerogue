import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { NaturePowerAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import type { CallMoveAttrWithBanlist, MoveAttrString } from "#types/move-types";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Moves - Move-calling Moves", () => {
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
      .ability(AbilityId.NO_GUARD)
      .passiveAbility(AbilityId.STURDY)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyLevel(100)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("Nature Power", () => {
    // Note: We have to access the prototype here since `allMoves` isn't initialized yet when we want to
    // determine the test case names
    const getMoveIdForTerrain = NaturePowerAttr.prototype["getMoveIdForTerrain"];
    let spy: MockInstance<typeof getMoveIdForTerrain>;

    beforeEach(() => {
      spy = vi.spyOn(
        allMoves[MoveId.NATURE_POWER].getAttrs("NaturePowerAttr")[0] as NaturePowerAttr &
          Pick<{ getMoveIdForTerrain: NaturePowerAttr["getMoveIdForTerrain"] }, "getMoveIdForTerrain">,
        "getMoveIdForTerrain",
      );
    });

    it.each(
      getEnumValues(BiomeId).map(biome => ({
        move: getMoveIdForTerrain(TerrainType.NONE, biome),
        moveName: toTitleCase(MoveId[getMoveIdForTerrain(TerrainType.NONE, biome)]),
        biome,
        biomeName: BiomeId[biome],
      })),
    )("should select $moveName if the current biome is $biomeName", async ({ move, biome }) => {
      game.override.startingBiome(biome);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.NATURE_POWER);
      await game.toEndOfTurn();

      expect(spy).toHaveLastReturnedWith(move);
      const player = game.field.getPlayerPokemon();
      expect(player).toHaveUsedMove({ move, useMode: MoveUseMode.FOLLOW_UP });
      expect(game).toHaveShownMessage(
        i18next.t("moveTriggers:naturePowerUse", {
          pokemonName: getPokemonNameWithAffix(player),
          moveName: allMoves[move].name,
        }),
      );
    });

    // TODO: Add after terrain override is added
    it.todo.each(
      getEnumValues(TerrainType).map(terrain => ({
        move: getMoveIdForTerrain(terrain, BiomeId.TOWN),
        moveName: toTitleCase(MoveId[getMoveIdForTerrain(terrain, BiomeId.TOWN)]),
        terrain,
        terrainName: TerrainType[terrain],
      })),
    )("should select $moveName if the current terrain is $terrainName", async ({ move /*, terrain */ }) => {
      //  game.override.terrain(terrainType);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.NATURE_POWER);
      await game.toEndOfTurn();

      expect(spy).toHaveLastReturnedWith(move);
      const player = game.field.getPlayerPokemon();
      expect(player).toHaveUsedMove({ move, useMode: MoveUseMode.FOLLOW_UP });
      expect(game).toHaveShownMessage(
        i18next.t("moveTriggers:naturePowerUse", {
          pokemonName: getPokemonNameWithAffix(player),
          moveName: allMoves[move].name,
        }),
      );
    });
  });

  describe.each<{
    name: string;
    move: MoveId;
    attrName: MoveAttrString;
    /** A callback that will ensure the selected move is used. */
    callback: (m: MoveId) => void;
  }>([
    {
      name: "Metronome",
      move: MoveId.METRONOME,
      attrName: "RandomMoveAttr",
      callback: m => {
        game.move.forceMetronomeMove(m);
      },
    },
    {
      name: "Sleep Talk",
      move: MoveId.SLEEP_TALK,
      attrName: "RandomMovesetMoveAttr",
      callback: m => {
        game.move.changeMoveset(game.field.getPlayerPokemon(), [m, MoveId.SLEEP_TALK]);
      },
    },
    {
      name: "Assist",
      move: MoveId.ASSIST,
      attrName: "RandomMovesetMoveAttr",
      callback: m => {
        game.move.changeMoveset(game.scene.getPlayerParty()[1], m);
      },
    },
    {
      name: "Mirror Move",
      move: MoveId.MIRROR_MOVE,
      attrName: "CopyMoveAttr",
      callback: m => {
        game.field
          .getEnemyPokemon()
          .pushMoveHistory({ move: m, useMode: MoveUseMode.NORMAL, targets: [BattlerIndex.PLAYER] });
      },
    },
    {
      name: "Copycat",
      move: MoveId.COPYCAT,
      attrName: "CopyMoveAttr",
      callback: m => {
        game.scene.currentBattle.lastMove = m;
      },
    },
  ])("General Checks - $name", ({ move, attrName, callback }) => {
    let attr: CallMoveAttrWithBanlist;
    let banlist: ReadonlySet<MoveId>;
    let getMoveSpy: MockInstance<CallMoveAttrWithBanlist["getMove"]>;

    beforeEach(() => {
      attr = allMoves[move].getAttrs(attrName)[0] as CallMoveAttrWithBanlist;
      banlist = attr["invalidMoves"];
      getMoveSpy = vi.spyOn(attr as typeof attr & Pick<{ getMove: (typeof attr)["getMove"] }, "getMove">, "getMove");

      // Barring other things, ensure Sleep Talk (at least) has that particular move in its moveset
      game.override.moveset(move);
      if (move === MoveId.SLEEP_TALK) {
        game.override.statusEffect(StatusEffect.SLEEP);
      }
    });

    it.skipIf(move === MoveId.MIRROR_MOVE)(
      "should target called moves randomly if multiple valid targets exist",
      async () => {
        game.override.battleStyle("double");
        await game.classicMode.startBattle(SpeciesId.FEEBAS);

        const feebas = game.field.getPlayerPokemon();

        getMoveSpy.mockReturnValue(MoveId.TACKLE);

        // Turn 1: Force an RNG roll that hits enemy 1
        vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(0);

        game.move.use(move);
        await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
        await game.toEndOfTurn();

        expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
        expect(feebas).toHaveUsedMove({
          move: MoveId.TACKLE,
          useMode: MoveUseMode.FOLLOW_UP,
          targets: [BattlerIndex.ENEMY],
        });

        // Turn 2: exact same thing, but with 2nd enemy instead
        vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(1);

        game.move.use(move);
        await game.toEndOfTurn();

        expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
        expect(feebas).toHaveUsedMove({
          move: MoveId.TACKLE,
          useMode: MoveUseMode.FOLLOW_UP,
          targets: [BattlerIndex.ENEMY_2],
        });
      },
    );

    it.runIf(move === MoveId.MIRROR_MOVE)("should always target the Mirror Move recipient if possible", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      // Mock RNG functions to return high rolls (ie last eligible target)
      // This will force the test to fail if MM were to use the same random targeting algorithm
      // as Copycat/etc
      vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(1);

      game.move.use(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.ENEMY_2);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.setTurnOrder([BattlerIndex.ENEMY_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.MIRROR_MOVE, useMode: MoveUseMode.NORMAL }, 1);
      expect(feebas).toHaveUsedMove({
        move: MoveId.TACKLE,
        useMode: MoveUseMode.FOLLOW_UP,
        targets: [BattlerIndex.ENEMY],
      });

      // 2nd turn: Copy a move that physically cannot target the Mirror Move recipient
      game.move.use(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.ENEMY_2);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.setTurnOrder([BattlerIndex.ENEMY_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();
    });

    // testing Metronome here is pointless since we literally mock out its randomness
    it.skipIf(move === MoveId.METRONOME)("should return MoveId.NONE if an invalid move would be picked", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);
      const firstBanlistedMove = [...banlist.values()][0];
      expect(attr["isMoveAllowed"](firstBanlistedMove)).toBe(false);

      callback(firstBanlistedMove);
      expect(attr["getMove"](game.field.getPlayerPokemon(), game.field.getEnemyPokemon())).toBe(MoveId.NONE);
    });

    it("should fail if MoveId.NONE would otherwise be called", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      getMoveSpy.mockReturnValueOnce(MoveId.NONE);

      game.move.use(move);
      await game.toEndOfTurn();

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveUsedMove({ move, result: MoveResult.FAIL });
    });
  });

  describe("Sleep Talk", () => {
    beforeEach(() => {
      game.override.moveset([MoveId.SLEEP_TALK, MoveId.SWORDS_DANCE]).statusEffect(StatusEffect.SLEEP);
    });

    it("should call a random valid move from the user's moveset", async () => {
      game.override.moveset([MoveId.SLEEP_TALK, MoveId.DIG, MoveId.FLY, MoveId.SWORDS_DANCE]); // Dig and Fly are invalid moves, Swords Dance should always be called
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.select(MoveId.SLEEP_TALK);
      await game.toNextTurn();

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveStatStage(Stat.ATK, 2);
      expect(feebas).toHaveUsedMove({
        move: MoveId.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.FOLLOW_UP,
      });
      expect(feebas).toHaveUsedMove(
        {
          move: MoveId.SLEEP_TALK,
          result: MoveResult.SUCCESS,
          useMode: MoveUseMode.NORMAL,
        },
        1,
      );
    });

    it("should fail if all the user's moves are invalid", async () => {
      game.override.moveset([MoveId.SLEEP_TALK, MoveId.COPYCAT]);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });

    it("should fail if the user is not asleep", async () => {
      game.override.statusEffect(StatusEffect.POISON);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });

    it("should fail the turn that the user wakes up from Sleep", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveStatusEffect(StatusEffect.SLEEP);
      feebas.status!.sleepTurnsRemaining = 1;

      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });
  });

  describe("Assist", () => {
    it("should call a random eligible move from an ally's moveset", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.SHUCKLE);

      const [feebas, shuckle] = game.scene.getPlayerField();
      game.move.changeMoveset(feebas, [MoveId.CIRCLE_THROW, MoveId.ASSIST, MoveId.WOOD_HAMMER, MoveId.ACID_SPRAY]);
      game.move.changeMoveset(shuckle, [MoveId.COPYCAT, MoveId.ASSIST, MoveId.TORCH_SONG, MoveId.TACKLE]);

      // Force rolling the first eligible move for both mons
      vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(0);
      vi.spyOn(shuckle, "randBattleSeedInt").mockReturnValue(0);

      game.move.select(MoveId.ASSIST, BattlerIndex.PLAYER);
      game.move.select(MoveId.ASSIST, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.TORCH_SONG, useMode: MoveUseMode.FOLLOW_UP });
      expect(shuckle).toHaveUsedMove({ move: MoveId.WOOD_HAMMER, useMode: MoveUseMode.FOLLOW_UP });
      expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, useMode: MoveUseMode.NORMAL }, 1);
      expect(shuckle).toHaveUsedMove({ move: MoveId.ASSIST, useMode: MoveUseMode.NORMAL }, 1);
    });

    it("should consider off-field allies", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.SHUCKLE);

      const [feebas, shuckle] = game.scene.getPlayerParty();
      game.move.changeMoveset(shuckle, MoveId.SOAK);

      game.move.use(MoveId.ASSIST);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({
        move: MoveId.SOAK,
        useMode: MoveUseMode.FOLLOW_UP,
        result: MoveResult.SUCCESS,
      });
    });

    it("should fail if there are no allies, even if user has eligible moves", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      game.move.changeMoveset(feebas, [MoveId.ASSIST, MoveId.TACKLE]);

      game.move.select(MoveId.ASSIST);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, result: MoveResult.FAIL });
    });

    it("should fail if allies have no eligible moves", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.SHUCKLE);

      const [feebas, shuckle] = game.scene.getPlayerParty();
      // All of these are ineligible moves
      game.move.changeMoveset(shuckle, [MoveId.METRONOME, MoveId.DIG, MoveId.FLY]);

      game.move.use(MoveId.ASSIST);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, result: MoveResult.FAIL });
    });
  });

  describe.each([
    { name: "Copycat", move: MoveId.COPYCAT },
    { name: "Mirror Move", move: MoveId.MIRROR_MOVE },
  ])("$name", ({ move }) => {
    let attr: CallMoveAttrWithBanlist;
    let banlist: ReadonlySet<MoveId>;
    let getMoveSpy: MockInstance<CallMoveAttrWithBanlist["getMove"]>;

    beforeEach(() => {
      attr = allMoves[move].getAttrs("CopyMoveAttr")[0] as CallMoveAttrWithBanlist;
      banlist = attr["invalidMoves"];
      getMoveSpy = vi.spyOn(attr as typeof attr & Pick<{ getMove: (typeof attr)["getMove"] }, "getMove">, "getMove");
    });

    it.runIf(move === MoveId.COPYCAT)(
      'should update "last move" tracker for moves failing conditions, but not pre-move interrupts',
      async () => {
        game.override.enemyStatusEffect(StatusEffect.SLEEP);
        await game.classicMode.startBattle(SpeciesId.FEEBAS);

        game.move.use(MoveId.SUCKER_PUNCH);
        await game.move.forceEnemyMove(MoveId.SPLASH);
        await game.phaseInterceptor.to("MoveEndPhase");

        // Player sucker punch failed conditions, but still updated tracker
        expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.SUCKER_PUNCH, result: MoveResult.FAIL });
        expect(game.scene.currentBattle.lastMove).toBe(MoveId.SUCKER_PUNCH);

        await game.phaseInterceptor.to("MoveEndPhase");

        // Enemy is asleep and should not have updated tracker
        expect(game.scene.currentBattle.lastMove).toBe(MoveId.SUCKER_PUNCH);
      },
    );

    it("should fail if no prior moves have been made", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(move);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(getMoveSpy).toHaveLastReturnedWith(MoveId.NONE);
      expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move, result: MoveResult.FAIL });
    });

    it("should fail when trying to copy an invalid move", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      expect(banlist).toContain(move);

      game.move.use(move);
      await game.move.forceEnemyMove(move);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(getMoveSpy).toHaveLastReturnedWith(MoveId.NONE);
      expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move, result: MoveResult.FAIL });
    });

    it("should copy moves called by other move-calling moves", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.METRONOME);
      game.move.forceMetronomeMove(MoveId.SWORDS_DANCE);
      await game.move.forceEnemyMove(move);
      // Ensure player moves first so enemy can copy Swords Dance
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveUsedMove(
        {
          move,
          result: MoveResult.SUCCESS,
          useMode: MoveUseMode.NORMAL,
        },
        1,
      );
      expect(enemy).toHaveUsedMove({
        move: MoveId.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.FOLLOW_UP,
      });
      expect(enemy).toHaveStatStage(Stat.ATK, 2);
    });
  });

  describe("Metronome", () => {
    // TODO: Figure out a good way to override RNG rolls to force Metronome to use a move
    // WITHOUT using the override that mocks the method
    it.todo("should call a random move");
  });
});
