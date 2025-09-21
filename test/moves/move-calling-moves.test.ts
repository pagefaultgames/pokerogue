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
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Moves - Move-calling Moves", () => {
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
    const getNaturePowerType = NaturePowerAttr.prototype["getMoveIdForTerrain"];
    let spy: MockInstance<typeof getNaturePowerType>;

    beforeEach(() => {
      spy = vi.spyOn(
        allMoves[MoveId.NATURE_POWER].getAttrs("NaturePowerAttr")[0] as NaturePowerAttr &
          Pick<{ getMoveIdForTerrain: NaturePowerAttr["getMoveIdForTerrain"] }, "getMoveIdForTerrain">,
        "getMoveIdForTerrain",
      );
    });

    it.each(
      getEnumValues(BiomeId).map(biome => ({
        move: getNaturePowerType(TerrainType.NONE, biome),
        moveName: toTitleCase(MoveId[getNaturePowerType(TerrainType.NONE, biome)]),
        biome,
        biomeName: BiomeId[biome],
      })),
    )("should select $moveName if the current biome is $biomeName", async ({ move, biome }) => {
      game.override.startingBiome(biome);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

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
        move: getNaturePowerType(terrain, BiomeId.TOWN),
        moveName: toTitleCase(MoveId[getNaturePowerType(terrain, BiomeId.TOWN)]),
        terrain,
        terrainName: TerrainType[terrain],
      })),
    )("should select $moveName if the current terrain is $terrainName", async ({ move /*, terrain */ }) => {
      //  game.override.terrain(terrainType);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

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
    choiceName: string;
    /** A callback that will ensure the selected move is m. */
    callback: (m: MoveId) => void;
  }>([
    {
      name: "Metronome",
      move: MoveId.METRONOME,
      attrName: "RandomMoveAttr",
      choiceName: "a completely random move",
      callback: m => {
        game.move.forceMetronomeMove(m);
      },
    },
    {
      name: "Sleep Talk",
      move: MoveId.SLEEP_TALK,
      attrName: "RandomMovesetMoveAttr",
      choiceName: "a random move that the user knows",
      callback: m => {
        game.move.changeMoveset(game.field.getPlayerPokemon(), [m, MoveId.SLEEP_TALK]);
      },
    },
    {
      name: "Assist",
      move: MoveId.ASSIST,
      attrName: "RandomMovesetMoveAttr",
      choiceName: "a random move known by the user's allies",
      callback: m => {
        game.move.changeMoveset(game.scene.getPlayerParty()[1], m);
      },
    },
    {
      name: "Mirror Move",
      move: MoveId.MIRROR_MOVE,
      attrName: "CopyMoveAttr",
      choiceName: "the last move used by the target",
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
      choiceName: "the last move used by the target",
    },
  ])("$name", ({ move, attrName, callback, choiceName }) => {
    let attr: CallMoveAttrWithBanlist;
    let banlist: ReadonlySet<MoveId>;
    let getMoveSpy: MockInstance<CallMoveAttrWithBanlist["getMove"]>;

    beforeEach(() => {
      attr = allMoves[move].getAttrs(attrName)[0] as CallMoveAttrWithBanlist;
      banlist = attr["invalidMoves"];
      getMoveSpy = vi.spyOn(attr as typeof attr & Pick<{ getMove: (typeof attr)["getMove"] }, "getMove">, "getMove");

      // Barring other things, ensure Copycat has (at least) that particular move in its moveset
      game.override.moveset(move);
      if (move === MoveId.SLEEP_TALK) {
        game.override.statusEffect(StatusEffect.SLEEP);
      }
    });

    // TODO: Revert and move back to the original tests' functions
    it.skipIf(move === MoveId.METRONOME)(`should copy and execute ${choiceName}`, async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      callback(MoveId.SPLASH);

      const feebas = game.field.getPlayerPokemon();
      game.move.select(move);
      await game.toEndOfTurn();

      expect(getMoveSpy).toHaveReturnedWith(MoveId.SPLASH);
      expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
      expect(feebas).toHaveUsedMove({
        move: MoveId.SPLASH,
        useMode: MoveUseMode.FOLLOW_UP,
        targets: [feebas.getBattlerIndex()],
      });
    });

    it.skipIf(move === MoveId.MIRROR_MOVE)(
      "should target called moves randomly if multiple valid targets exist",
      async () => {
        game.override.battleStyle("double");
        await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

        const [feebas, milotic] = game.scene.getPlayerField();
        game.move.changeMoveset(feebas, move);
        game.move.changeMoveset(milotic, MoveId.CELEBRATE);

        callback(MoveId.TACKLE);

        // Turn 1: Force an RNG roll that hits enemy 1
        vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(0);

        game.move.select(move);
        game.move.select(MoveId.CELEBRATE, BattlerIndex.PLAYER_2);
        await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
        await game.toEndOfTurn();

        console.log(feebas.getLastXMoves(-1));
        expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
        expect(feebas).toHaveUsedMove({
          move: MoveId.TACKLE,
          useMode: MoveUseMode.FOLLOW_UP,
          targets: [BattlerIndex.ENEMY],
        });

        // Turn 2: exact same thing, but with 2nd enemy instead
        vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(1);

        game.move.select(move);
        await game.toEndOfTurn();

        expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
        expect(feebas).toHaveUsedMove({
          move: MoveId.TACKLE,
          useMode: MoveUseMode.FOLLOW_UP,
          targets: [BattlerIndex.ENEMY_2],
        });
      },
    );

    it.runIf(move === MoveId.MIRROR_MOVE)("should always target the Mirror Move recipient", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      callback(MoveId.TACKLE);

      const feebas = game.field.getPlayerPokemon();
      // Mock RNG functions to return high rolls (ie last eligible target)
      // This will force the test to fail if MM were to use the same targeting algorithm
      // as Copycat/etc
      vi.spyOn(feebas, "randBattleSeedInt").mockReturnValue(1);

      game.move.use(move);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move, useMode: MoveUseMode.NORMAL }, 1);
      expect(feebas).toHaveUsedMove({
        move: MoveId.TACKLE,
        useMode: MoveUseMode.FOLLOW_UP,
        targets: [BattlerIndex.ENEMY],
      });
    });

    // testing Metronome here is pointless since we literally mock out its randomness
    it.skipIf(move === MoveId.METRONOME)("should return MoveId.NONE if an invalid move would be picked", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);
      const firstBanlistedMove = [...banlist.values()][0];
      expect(attr["isMoveAllowed"](firstBanlistedMove)).toBe(false);

      callback(firstBanlistedMove);
      expect(attr["getMove"](game.field.getPlayerPokemon(), game.field.getEnemyPokemon())).toBe(MoveId.NONE);
    });

    it("should fail if MoveId.NONE would otherwise be called", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

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

    it("should fail if all the user's moves are invalid", async () => {
      game.override.moveset([MoveId.SLEEP_TALK, MoveId.COPYCAT]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();
      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });

    it("should fail if the user is not asleep", async () => {
      game.override.statusEffect(StatusEffect.POISON);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });

    it("should fail the turn that the user wakes up from Sleep", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveStatusEffect(StatusEffect.SLEEP);
      feebas.status!.sleepTurnsRemaining = 1;

      game.move.select(MoveId.SLEEP_TALK);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.SLEEP_TALK, result: MoveResult.FAIL });
    });
  });

  describe("Assist", () => {
    it("should fail if there are no allies, even if user has eligible moves", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();
      game.move.changeMoveset(feebas, [MoveId.ASSIST, MoveId.TACKLE]);

      game.move.select(MoveId.ASSIST);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, result: MoveResult.FAIL });
    });

    it("should fail if allies have no eligible moves", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

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

    // TODO: Enable once move phase is refactored
    it.runIf(move === MoveId.COPYCAT).todo(
      'should update "last move" tracker for moves failing conditions, but not pre-move interrupts',
      async () => {
        game.override.enemyStatusEffect(StatusEffect.SLEEP);
        await game.classicMode.startBattle([SpeciesId.FEEBAS]);

        game.move.use(MoveId.SUCKER_PUNCH);
        await game.move.forceEnemyMove(MoveId.SPLASH);
        await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
        await game.phaseInterceptor.to("MoveEndPhase");

        // Enemy is asleep and should not have updated tracker
        expect(game.scene.currentBattle.lastMove).toBe(MoveId.NONE);

        await game.phaseInterceptor.to("MoveEndPhase");

        // Player sucker punch failed conditions, but still updated tracker
        expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.SUCKER_PUNCH, result: MoveResult.FAIL });
        expect(game.scene.currentBattle.lastMove).toBe(MoveId.SUCKER_PUNCH);
      },
    );

    it("should fail if no prior moves have been made", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.use(move);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(getMoveSpy).toHaveLastReturnedWith(MoveId.NONE);
      expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move, result: MoveResult.FAIL });
    });

    it("should fail when trying to copy an invalid move", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      expect(banlist).toContain(move);

      game.move.use(move);
      await game.move.forceEnemyMove(move);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(getMoveSpy).toHaveLastReturnedWith(MoveId.NONE);
      expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move, result: MoveResult.FAIL });
    });

    it("should copy moves called by other move-calling moves", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.use(MoveId.METRONOME);
      game.move.forceMetronomeMove(MoveId.SWORDS_DANCE, true);
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
});
