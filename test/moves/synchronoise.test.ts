import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Synchronoise", () => {
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

  it("should affect all opponents that share a type with the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BIBAREL, SpeciesId.STARLY);

    const [bibarel, starly, karp1, karp2] = game.scene.getField();
    // Mock 2nd magikarp to be a completely different type
    vi.spyOn(karp2, "getTypes").mockReturnValue([PokemonType.GRASS]);

    game.move.use(MoveId.SYNCHRONOISE, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(bibarel).toHaveUsedMove({ move: MoveId.SYNCHRONOISE, result: MoveResult.SUCCESS });
    expect(starly).not.toHaveFullHp();
    expect(karp1).not.toHaveFullHp();
    expect(karp2).toHaveFullHp();
  });

  it("should consider the user's Tera Type if it is Terastallized", async () => {
    await game.classicMode.startBattle(SpeciesId.BIDOOF);

    const bidoof = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.field.forceTera(bidoof, PokemonType.WATER);
    game.move.use(MoveId.SYNCHRONOISE);
    await game.toEndOfTurn();

    expect(bidoof).toHaveUsedMove({ move: MoveId.SYNCHRONOISE, result: MoveResult.SUCCESS });
    expect(karp).not.toHaveFullHp();
  });

  it("should consider the user/target's normal types if Terastallized into Tera Stellar", async () => {
    await game.classicMode.startBattle(SpeciesId.ABRA);

    const abra = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.field.forceTera(abra, PokemonType.STELLAR);
    game.field.forceTera(karp, PokemonType.STELLAR);
    game.move.use(MoveId.SYNCHRONOISE);
    await game.toEndOfTurn();

    expect(abra).toHaveUsedMove({ move: MoveId.SYNCHRONOISE, result: MoveResult.MISS });
    expect(karp).toHaveFullHp();
  });

  it("should count as ineffective if no enemies share types with the user", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGNETON);

    const magneton = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.SYNCHRONOISE);
    await game.toEndOfTurn();

    // NB: Type immunities currently use HitResult.MISS; this may (and arguably should) change later
    expect(magneton).toHaveUsedMove({ move: MoveId.SYNCHRONOISE, result: MoveResult.MISS });
    expect(karp).toHaveFullHp();
  });

  it("should never affect any Pokemon if the user is typeless", async () => {
    await game.classicMode.startBattle(SpeciesId.BIBAREL);

    const bibarel = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    bibarel.summonData.types = [PokemonType.UNKNOWN];
    karp.summonData.types = [PokemonType.UNKNOWN];

    game.move.use(MoveId.SYNCHRONOISE);
    await game.toEndOfTurn();

    expect(bibarel).toHaveUsedMove({ move: MoveId.SYNCHRONOISE, result: MoveResult.MISS });
    expect(karp).toHaveFullHp();
  });
});
