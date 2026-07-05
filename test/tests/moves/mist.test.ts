import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Mist", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should prevent the user and its allies from having their stats lowered by other Pokemon", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [feebas, milotic] = game.scene.getPlayerField();

    game.move.use(MoveId.MIST, BattlerIndex.PLAYER);
    game.move.use(MoveId.TICKLE, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn(false);

    // all stat drops should have been blocked, including those from allies
    expect(game).toHaveArenaTag({ tagType: ArenaTagType.MIST, side: ArenaTagSide.PLAYER, turnCount: 5 });
    expect(feebas).toHaveStatStage(Stat.ATK, 0);
    expect(milotic).toHaveStatStage(Stat.ATK, 0);
    // TODO: Move failures don't get propagated here...
    // const karp = game.field.getEnemyPokemon();
    // expect(karp).toHaveUsedMove({move: MoveId.GROWL, result: MoveResult.FAIL});
  });

  it("should show a message upon successfully blocking a stat drop", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();

    game.move.use(MoveId.MIST);
    await game.move.forceEnemyMove(MoveId.LEER);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(game).toHaveShownMessage(
      i18next.t("arenaTag:mistApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
      }),
    );
  });

  it("should not apply to self-targeting moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.scene.arena.addTag(ArenaTagType.MIST, 5, undefined, 0, ArenaTagSide.PLAYER);

    game.move.use(MoveId.SHELL_SMASH);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveStatStage(Stat.ATK, 2);
    expect(feebas).toHaveStatStage(Stat.DEF, -1);
  });

  // infiltrator interaction tested inside infiltrator.test.ts
});
