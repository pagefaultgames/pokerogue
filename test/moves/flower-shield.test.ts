import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Flower Shield", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP);
  });

  it("should raise the Defense of all Grass-type Pokemon by 1 stage, including the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.CHERRIM, SpeciesId.FEEBAS);

    const [cherrim, feebas, karp1, karp2] = game.scene.getField();
    karp1.summonData.types = [PokemonType.GRASS];

    game.move.use(MoveId.FLOWER_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // cherrim and grass-type Magikarp got buffed; feebas and water-type  Magikarp did not
    expect(cherrim).toHaveStatStage(Stat.DEF, 1);
    expect(karp1).toHaveStatStage(Stat.DEF, 1);
    expect(feebas).toHaveStatStage(Stat.DEF, 0);
    expect(karp2).toHaveStatStage(Stat.DEF, 0);
  });

  it("should not affect semi-invulnerable Pokemon", async () => {
    game.override.enemySpecies(SpeciesId.PARAS);
    await game.classicMode.startBattle(SpeciesId.CHERRIM);

    const cherrim = game.field.getPlayerPokemon();
    const paras = game.field.getEnemyPokemon();

    game.move.use(MoveId.FLOWER_SHIELD);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(cherrim).toHaveStatStage(Stat.DEF, 1);
    expect(paras).toHaveStatStage(Stat.DEF, 0);
  });

  it("should check all affected targets' Tera Types, including Tera Stellar", async () => {
    game.override.enemySpecies(SpeciesId.PARAS);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    // Tera Grass Feebas, Tera Stellar Paras
    const feebas = game.field.getPlayerPokemon();
    const paras = game.field.getEnemyPokemon();
    game.field.forceTera(feebas, PokemonType.GRASS);
    game.field.forceTera(paras, PokemonType.STELLAR);

    game.move.use(MoveId.FLOWER_SHIELD);
    await game.toEndOfTurn();

    expect(feebas).toHaveStatStage(Stat.DEF, 1);
    expect(paras).toHaveStatStage(Stat.DEF, 1);
  });

  it("should fail if no vulnerable Grass-type Pokemon are on field", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.CHERRIM);

    const [cherrim, _, karp1, karp2] = game.scene.getField();

    // Hide cherrim while enemies use Flower Shield
    game.move.use(MoveId.DIG, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.FLOWER_SHIELD);
    await game.toEndOfTurn();

    expect(cherrim).toHaveStatStage(Stat.DEF, 0);
    expect(karp1).toHaveStatStage(Stat.DEF, 0);
    expect(karp2).toHaveStatStage(Stat.DEF, 0);
    expect(karp1).toHaveUsedMove({ move: MoveId.FLOWER_SHIELD, result: MoveResult.FAIL });
  });
});
