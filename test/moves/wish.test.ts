import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("should heal the Pokemon in the current slot for 50% of the user's maximum HP", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    game.move.use(MoveId.WISH);
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH);

    game.doSwitchPokemon(1);
    await game.toEndOfTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH, 0);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("arenaTag:wishTagOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(alomomola),
      }),
    );
    expect(alomomola).toHaveHp(1);
    expect(blissey).toHaveHp(toDmgValue(alomomola.getMaxHp() / 2) + 1);
  });

  it("should work if the user has full HP, but not if it already has an active Wish", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const alomomola = game.field.getPlayerPokemon();
    alomomola.hp = 1;

    game.move.use(MoveId.WISH);
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH);

    game.move.use(MoveId.WISH);
    await game.toEndOfTurn();

    expect(alomomola.hp).toBe(toDmgValue(alomomola.getMaxHp() / 2) + 1);
    expect(alomomola).toHaveUsedMove({ result: MoveResult.FAIL });
  });

  it("should function independently of Future Sight", async () => {
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    game.move.use(MoveId.WISH);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH);
    expect(game).toHavePositionalTag(PositionalTagType.DELAYED_ATTACK);
  });

  it("should work in double battles and trigger in order of creation", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey, karp1, karp2] = game.scene.getField();
    alomomola.hp = 1;
    blissey.hp = 1;

    vi.spyOn(karp1, "getNameToRender").mockReturnValue("Karp 1");
    vi.spyOn(karp2, "getNameToRender").mockReturnValue("Karp 2");

    const oldOrder = game.field.getSpeedOrder();

    game.move.use(MoveId.WISH, BattlerIndex.PLAYER);
    game.move.use(MoveId.WISH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.WISH);
    await game.move.forceEnemyMove(MoveId.WISH);
    // Ensure that the wishes are used deterministically in speed order (for speed ties)
    await game.setTurnOrder(oldOrder.map(p => p.getBattlerIndex()));
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH, 4);

    // Lower speed to change turn order
    alomomola.setStatStage(Stat.SPD, 6);
    blissey.setStatStage(Stat.SPD, -6);

    const newOrder = game.field.getSpeedOrder();
    expect(newOrder).not.toEqual(oldOrder);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("PositionalTagPhase");

    // all wishes have activated and added healing phases
    expect(game).toHavePositionalTag(PositionalTagType.WISH, 0);

    const healPhases = game.scene.phaseManager.phaseQueue.filter(p => p.is("PokemonHealPhase"));
    expect(healPhases).toHaveLength(4);
    expect.soft(healPhases.map(php => php.getPokemon())).toEqual(oldOrder);

    await game.toEndOfTurn();

    expect(alomomola.hp).toBe(toDmgValue(alomomola.getMaxHp() / 2) + 1);
    expect(blissey.hp).toBe(toDmgValue(blissey.getMaxHp() / 2) + 1);
  });

  it("should vanish and not play message if slot is empty", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ALOMOMOLA, SpeciesId.BLISSEY]);

    const [alomomola, blissey] = game.scene.getPlayerParty();
    alomomola.hp = 1;
    blissey.hp = 1;

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.WISH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.MEMENTO, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.toEndOfTurn();

    // Wish went away without doing anything
    expect(game).toHavePositionalTag(PositionalTagType.WISH, 0);
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("arenaTag:wishTagOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(blissey),
      }),
    );
    expect(alomomola.hp).toBe(1);
  });
});
