import type { BattleScene } from "#app/battle-scene";
import * as messages from "#app/messages";
import { BindTag, SubstituteTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import type { PokemonTurnData } from "#data/pokemon-data";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import type { Pokemon } from "#field/pokemon";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import type { TurnMove } from "#types/turn-move";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("BattlerTag - SubstituteTag", () => {
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
  });

  let mockPokemon: Pokemon;

  describe("onAdd behavior", () => {
    beforeEach(() => {
      mockPokemon = {
        scene: game.scene,
        hp: 101,
        id: 0,
        getMaxHp: vi.fn().mockReturnValue(101) as Pokemon["getMaxHp"],
        findAndRemoveTags: vi.fn().mockImplementation(tagFilter => {
          // simulate a Trapped tag set by another Pokemon, then expect the filter to catch it.
          const trapTag = new BindTag(5, 0);
          expect(tagFilter(trapTag)).toBeTruthy();
        }) as Pokemon["findAndRemoveTags"],
      } as unknown as Pokemon;

      vi.spyOn(messages, "getPokemonNameWithAffix").mockReturnValue("");
      vi.spyOn(mockPokemon.scene as BattleScene, "getPokemonById").mockImplementation(pokemonId =>
        mockPokemon.id === pokemonId ? mockPokemon : null,
      );
    });

    it("sets the tag's HP to 1/4 of the source's max HP (rounded down)", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockReturnValue(true);
      vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      subject.onAdd(mockPokemon);

      expect(subject.hp).toBe(25);
    });

    it("triggers on-add effects that bring the source out of focus", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockImplementation(
        (_pokemon, battleAnimType, _fieldAssets?, _delayed?) => {
          expect(battleAnimType).toBe(PokemonAnimType.SUBSTITUTE_ADD);
          return true;
        },
      );

      const msgSpy = vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      subject.onAdd(mockPokemon);

      expect(subject.sourceInFocus).toBeFalsy();
      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).toHaveBeenCalledTimes(1);
      expect(msgSpy).toHaveBeenCalledOnce();
    });

    it("removes effects that trap the source", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      subject.onAdd(mockPokemon);
      expect(mockPokemon.findAndRemoveTags).toHaveBeenCalledTimes(1);
    });
  });

  describe("onRemove behavior", () => {
    beforeEach(() => {
      mockPokemon = {
        scene: game.scene,
        hp: 101,
        id: 0,
        isFainted: vi.fn().mockReturnValue(false) as Pokemon["isFainted"],
      } as unknown as Pokemon;

      vi.spyOn(messages, "getPokemonNameWithAffix").mockReturnValue("");
    });

    it("triggers on-remove animation and message", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);
      subject.sourceInFocus = false;

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockImplementation(
        (_pokemon, battleAnimType, _fieldAssets?, _delayed?) => {
          expect(battleAnimType).toBe(PokemonAnimType.SUBSTITUTE_REMOVE);
          return true;
        },
      );

      const msgSpy = vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      subject.onRemove(mockPokemon);

      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).toHaveBeenCalledTimes(1);
      expect(msgSpy).toHaveBeenCalledOnce();
    });
  });

  describe("lapse behavior", () => {
    beforeEach(() => {
      mockPokemon = {
        scene: game.scene,
        hp: 101,
        id: 0,
        turnData: { acted: true } as PokemonTurnData,
        getLastXMoves: vi
          .fn()
          .mockReturnValue([
            { move: MoveId.TACKLE, result: MoveResult.SUCCESS } as TurnMove,
          ]) as Pokemon["getLastXMoves"],
      } as unknown as Pokemon;

      vi.spyOn(messages, "getPokemonNameWithAffix").mockReturnValue("");
    });

    it("PRE_MOVE lapse triggers pre-move animation", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockImplementation(
        (_pokemon, battleAnimType, _fieldAssets?, _delayed?) => {
          expect(battleAnimType).toBe(PokemonAnimType.SUBSTITUTE_PRE_MOVE);
          return true;
        },
      );

      vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      expect(subject.lapse(mockPokemon, BattlerTagLapseType.PRE_MOVE)).toBeTruthy();

      expect(subject.sourceInFocus).toBeTruthy();
      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).toHaveBeenCalledTimes(1);
    });

    it("AFTER_MOVE lapse triggers post-move animation", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockImplementation(
        (_pokemon, battleAnimType, _fieldAssets?, _delayed?) => {
          expect(battleAnimType).toBe(PokemonAnimType.SUBSTITUTE_POST_MOVE);
          return true;
        },
      );

      const msgSpy = vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      expect(subject.lapse(mockPokemon, BattlerTagLapseType.AFTER_MOVE)).toBeTruthy();

      expect(subject.sourceInFocus).toBeFalsy();
      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).toHaveBeenCalledTimes(1);
      expect(msgSpy).not.toHaveBeenCalled();
    });

    // TODO: Figure out how to mock a MoveEffectPhase correctly for this test
    it.todo("HIT lapse triggers on-hit message", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockReturnValue(true);
      const msgSpy = vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      const moveEffectPhase = {
        move: allMoves[MoveId.TACKLE],
        getUserPokemon: vi.fn().mockReturnValue(undefined) as MoveEffectPhase["getUserPokemon"],
      } as MoveEffectPhase;

      vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "getCurrentPhase").mockReturnValue(moveEffectPhase);
      vi.spyOn(allMoves[MoveId.TACKLE], "hitsSubstitute").mockReturnValue(true);

      expect(subject.lapse(mockPokemon, BattlerTagLapseType.HIT)).toBeTruthy();

      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).not.toHaveBeenCalled();
      expect(msgSpy).toHaveBeenCalledOnce();
    });

    it("CUSTOM lapse flags the tag for removal", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockReturnValue(true);
      vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      expect(subject.lapse(mockPokemon, BattlerTagLapseType.CUSTOM)).toBeFalsy();
    });

    it("Unsupported lapse type does nothing", async () => {
      const subject = new SubstituteTag(MoveId.SUBSTITUTE, mockPokemon.id);

      vi.spyOn(mockPokemon.scene as BattleScene, "triggerPokemonBattleAnim").mockReturnValue(true);
      const msgSpy = vi.spyOn((mockPokemon.scene as BattleScene).phaseManager, "queueMessage").mockReturnValue();

      expect(subject.lapse(mockPokemon, BattlerTagLapseType.TURN_END)).toBeTruthy();

      expect((mockPokemon.scene as BattleScene).triggerPokemonBattleAnim).not.toHaveBeenCalled();
      expect(msgSpy).not.toHaveBeenCalled();
    });
  });
});
