import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Whirlwind", () => {
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
      .battleStyle("single")
      .moveset([MoveId.SPLASH])
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.WHIRLWIND])
      .enemySpecies(SpeciesId.PIDGEY);
  });

  it.each([
    { move: MoveId.FLY, name: "Fly" },
    { move: MoveId.BOUNCE, name: "Bounce" },
    { move: MoveId.SKY_DROP, name: "Sky Drop" },
  ])("should not hit a flying target: $name (=$move)", async ({ move }) => {
    game.override.moveset([move]);
    // Must have a pokemon in the back so that the move misses instead of fails.
    await game.classicMode.startBattle([SpeciesId.STARAPTOR, SpeciesId.MAGIKARP]);

    const staraptor = game.field.getPlayerPokemon();

    game.move.select(move);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(staraptor.findTag(t => t.tagType === BattlerTagType.FLYING)).toBeDefined();
    expect(game.field.getEnemyPokemon().getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
  });

  it("should force switches randomly", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(true);
    expect(squirtle.isOnField()).toBe(false);

    // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(false);
    expect(squirtle.isOnField()).toBe(true);
  });

  it("should not force a switch to a challenge-ineligible Pokemon", async () => {
    // Mono-Water challenge, Eevee is ineligible
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that would normally call for switching to Eevee, but it is ineligible
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
  });

  it("should not force a switch to a fainted Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
  });

  it("should not force a switch if there are no available Pokemon to switch into", async () => {
    await game.classicMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE]);

    const [lapras, eevee] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(true);
    expect(eevee.isOnField()).toBe(false);
  });

  it("should fail when player uses Whirlwind against an opponent with only one available Pokémon", async () => {
    // Set up the battle scenario with the player knowing Whirlwind
    game.override.startingWave(5).enemySpecies(SpeciesId.PIDGEY).moveset([MoveId.WHIRLWIND]);
    await game.classicMode.startBattle();

    const enemyParty = game.scene.getEnemyParty();

    // Ensure the opponent has only one available Pokémon
    if (enemyParty.length > 1) {
      enemyParty.slice(1).forEach(p => {
        p.hp = 0;
        p.status = new Status(StatusEffect.FAINT);
      });
    }
    const eligibleEnemy = enemyParty.filter(p => p.hp > 0 && p.isAllowedInBattle());
    expect(eligibleEnemy.length).toBe(1);

    // Player uses Whirlwind; opponent uses Splash
    game.move.select(MoveId.WHIRLWIND);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.WHIRLWIND, result: MoveResult.FAIL });
  });

  it("should not pull in the other trainer's pokemon in a partner trainer battle", async () => {
    game.override
      .startingWave(2)
      .battleType(BattleType.TRAINER)
      .randomTrainer({
        trainerType: TrainerType.BREEDER,
        alwaysDouble: true,
      })
      .enemyMoveset([MoveId.SPLASH, MoveId.LUNAR_DANCE])
      .moveset([MoveId.WHIRLWIND, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.TOTODILE]);

    // expect the enemy to have at least 4 pokemon, necessary for this check to even work
    expect(game.scene.getEnemyParty().length, "enemy must have exactly 4 pokemon").toBeGreaterThanOrEqual(4);

    const user = game.field.getPlayerPokemon();

    console.log(user.getMoveset(false));

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.MEMENTO);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Get the enemy pokemon id so we can check if is the same after switch.
    const enemy_id = game.field.getEnemyPokemon().id;

    // Hit the enemy that fainted with whirlwind.
    game.move.select(MoveId.WHIRLWIND, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.toNextTurn();

    // Expect the enemy pokemon to not have switched out.
    expect(game.field.getEnemyPokemon().id).toBe(enemy_id);
  });

  it("should force a wild pokemon to flee", async () => {
    game.override
      .battleType(BattleType.WILD)
      .moveset([MoveId.WHIRLWIND, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const user = game.field.getPlayerPokemon();

    game.move.select(MoveId.WHIRLWIND);
    await game.phaseInterceptor.to("BerryPhase");

    expect(user.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });
});
