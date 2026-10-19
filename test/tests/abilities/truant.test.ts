import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Truant", () => {
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
      .moveset([MoveId.SPLASH, MoveId.TACKLE])
      .ability(AbilityId.TRUANT)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should loaf around and prevent using moves every other turn", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // Turn 1: Splash succeeds
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(
      expect.objectContaining({ move: MoveId.SPLASH, result: MoveResult.SUCCESS }),
    );

    // Turn 2: Truant activates, cancelling tackle and displaying message
    game.move.select(MoveId.TACKLE);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(expect.objectContaining({ move: MoveId.NONE, result: MoveResult.FAIL }));
    expect(enemy).toHaveFullHp();
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:truantLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(player),
      }),
    );

    // Turn 3: Truant didn't activate, tackle worked
    game.move.select(MoveId.TACKLE);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(
      expect.objectContaining({ move: MoveId.TACKLE, result: MoveResult.SUCCESS }),
    );
    expect(enemy).not.toHaveFullHp();
  });

  describe("when gained by evolving while on the field", () => {
    beforeEach(() => {
      game.override
        .ability(AbilityId.NONE)
        .battleType(BattleType.WILD)
        .startingWave(71)
        .startingLevel(35)
        .enemySpecies(SpeciesId.GOLEM)
        .enemyLevel(100);
    });

    /** Evolve a Vigoroth into a Slaking on the field and move on to the next wave */
    async function evolveIntoSlaking(): Promise<void> {
      await game.classicMode.startBattle(SpeciesId.VIGOROTH);

      const vigoroth = game.field.getPlayerPokemon();
      vigoroth.abilityIndex = 0;
      expect(vigoroth.getAbility().id).toBe(AbilityId.VITAL_SPIRIT);

      game.field.getEnemyPokemon().hp = 1;
      game.move.select(MoveId.TACKLE);
      await game.toNextWave();

      expect(vigoroth.species.speciesId).toBe(SpeciesId.SLAKING);
      expect(vigoroth.isOnField()).toBe(true);
    }

    /** Check that the Slaking ignores moves used before evolving: it acts first, then loafs around */
    async function expectToActThenLoaf(): Promise<void> {
      const slaking = game.field.getPlayerPokemon();
      expect(slaking).toHaveBattlerTag(BattlerTagType.TRUANT);

      // Turn 1: Tackle succeeds, since Slaking has not moved yet
      game.move.select(MoveId.TACKLE);
      await game.toNextTurn();
      expect(slaking.getLastXMoves(1)[0]).toEqual(
        expect.objectContaining({ move: MoveId.TACKLE, result: MoveResult.SUCCESS }),
      );

      // Turn 2: Truant activates
      game.move.select(MoveId.TACKLE);
      await game.toNextTurn();
      expect(slaking.getLastXMoves(1)[0]).toEqual(
        expect.objectContaining({ move: MoveId.NONE, result: MoveResult.FAIL }),
      );
    }

    it("should act first and then loaf around", async () => {
      await evolveIntoSlaking();
      await expectToActThenLoaf();
    });

    it("should act first and then loaf around after reloading the session", async () => {
      await evolveIntoSlaking();
      await game.reload.reloadSession();
      await expectToActThenLoaf();
    });
  });
});
