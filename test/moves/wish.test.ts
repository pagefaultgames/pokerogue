import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/testUtils/gameManager";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Wish", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  /**
   * Expect that wish is active with the specified number of attacks.
   * @param numAttacks - The number of wish instances that should be queued; default `1`
   */
  function expectWishActive(numAttacks = 1) {
    const wishes = game.scene.arena.positionalTagManager["tags"].filter(t => t.tagType === PositionalTagType.WISH);
    expect(wishes).toHaveLength(numAttacks);
  }

  it("should heal the Pokemon in the current slot for 50% of the user's maximum HP", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    game.move.use(MoveId.WISH);
    await game.toNextTurn();

    expectWishActive();

    game.doSwitchPokemon(1);
    await game.toEndOfTurn();

    expectWishActive(0);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("arenaTag:wishTagOnAdd", {
        pokemonName: getPokemonNameWithAffix(blissey),
      }),
    );
    expect(alomomola.hp).toBe(1);
    expect(blissey.hp).toBe(toDmgValue(alomomola.getMaxHp() / 2) + 1);
  });

  it("should function independently of Future Sight", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    game.move.use(MoveId.WISH);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expectWishActive(1);
  });

  it("should work in double battles and triggerin order of creation", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    const oldOrder = game.field.getSpeedOrder();

    game.move.use(MoveId.WISH, BattlerIndex.PLAYER);
    game.move.use(MoveId.WISH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expectWishActive(2);

    // Lower speed to change turn order
    alomomola.setStatStage(Stat.SPD, 6);
    blissey.setStatStage(Stat.SPD, -6);

    const newOrder = game.field.getSpeedOrder();
    expect(newOrder).not.toEqual(oldOrder);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("PositionalTagPhase");

    // Both wishes have activated and added healing phases
    expectWishActive(0);

    const healPhases = game.scene.phaseManager.phaseQueue.filter(p => p.is("PokemonHealPhase"));
    expect(healPhases).toHaveLength(4);
    expect(healPhases.map(php => php["battlerIndex"])).toEqual(oldOrder);

    await game.toEndOfTurn();

    expect(alomomola.hp).toBe(toDmgValue(alomomola.getMaxHp() / 2) + 1);
    expect(blissey.hp).toBe(toDmgValue(blissey.getMaxHp() / 2) + 1);
  });
});
