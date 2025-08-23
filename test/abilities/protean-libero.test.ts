import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Protean/Libero", () => {
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
      .ability(AbilityId.PROTEAN)
      .startingLevel(100)
      .moveset([MoveId.CURSE, MoveId.DIG, MoveId.SPLASH])
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Assert that the protean/libero ability triggered to change the user's type to
   * the type of its most recently used move.
   * Takes into account type overrides from effects.
   * @param pokemon - The {@linkcode PlayerPokemon} being checked.
   * @remarks
   * This will clear the given Pokemon's `abilitiesApplied` set after being called to allow for easier multi-turn testing.
   */
  function expectTypeChange(pokemon: PlayerPokemon) {
    expect(pokemon.waveData.abilitiesApplied).toContainEqual(expect.toBeOneOf([AbilityId.PROTEAN, AbilityId.LIBERO]));
    const lastMove = allMoves[pokemon.getLastXMoves()[0].move]!;

    const pokemonTypes = pokemon.getTypes().map(pt => PokemonType[pt]);
    const moveType = PokemonType[pokemon.getMoveType(lastMove)];
    expect(pokemonTypes).toEqual([moveType]);
    pokemon.waveData.abilitiesApplied.clear();
  }

  /**
   * Assert that the protean/libero ability did NOT trigger to change the user's type to
   * the type of its most recently used move.
   * Takes into account type overrides from effects.
   * @param pokemon - The {@linkcode PlayerPokemon} being checked.
   * @remarks
   * This will clear the given Pokemon's `abilitiesApplied` set after being called to allow for easier multi-turn testing.
   */
  function expectNoTypeChange(pokemon: PlayerPokemon) {
    expect(pokemon.waveData.abilitiesApplied).not.toContainEqual(
      expect.toBeOneOf([AbilityId.PROTEAN, AbilityId.LIBERO]),
    );
    const lastMove = allMoves[pokemon.getLastXMoves()[0].move]!;

    const pokemonTypes = pokemon.getTypes().map(pt => PokemonType[pt]);
    const moveType = PokemonType[pokemon.getMoveType(lastMove, true)];
    expect(pokemonTypes).not.toEqual([moveType]);
    pokemon.waveData.abilitiesApplied.clear();
  }

  it.each([
    { name: "Protean", ability: AbilityId.PROTEAN },
    { name: "Libero", ability: AbilityId.PROTEAN },
  ])("$name should change the user's type to the type of the move being used", async ({ ability }) => {
    game.override.ability(ability);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expectTypeChange(leadPokemon);
  });

  // Test for Gen9+ functionality, we are using previous funcionality
  it.skip("should apply only once per switch in", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.AGILITY]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.BULBASAUR]);

    const bulbasaur = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.toEndOfTurn();

    expectTypeChange(bulbasaur);

    game.move.select(MoveId.AGILITY);
    await game.toEndOfTurn();

    expectNoTypeChange(bulbasaur);

    // switch out and back in
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.toEndOfTurn();

    expectTypeChange(bulbasaur);
  });

  it.each<{ category: string; move?: MoveId; passive?: AbilityId; enemyMove?: MoveId }>([
    { category: "Variable type Moves'", move: MoveId.WEATHER_BALL, passive: AbilityId.DROUGHT },
    { category: "Type Change Abilities'", passive: AbilityId.REFRIGERATE },
    { category: "Move-calling Moves'", move: MoveId.NATURE_POWER, passive: AbilityId.PSYCHIC_SURGE },
    { category: "Ion Deluge's", enemyMove: MoveId.ION_DELUGE },
    { category: "Electrify's", enemyMove: MoveId.ELECTRIFY },
  ])(
    "should respect $category final type",
    async ({ move = MoveId.TACKLE, passive = AbilityId.NONE, enemyMove = MoveId.SPLASH }) => {
      game.override.passiveAbility(passive);
      await game.classicMode.startBattle([SpeciesId.LINOONE]); // Pure normal type for move overrides

      const linoone = game.field.getPlayerPokemon();

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      // We stop before running `TurnEndPhase` so that the effects of `BattlerTag`s (such as from Electrify)
      // are still active when checking the move's type
      await game.phaseInterceptor.to("TurnEndPhase", false);

      expectTypeChange(linoone);
    },
  );

  it.each<{ cause: string; move?: MoveId; passive?: AbilityId; enemyMove?: MoveId }>([
    { cause: "misses", move: MoveId.FOCUS_BLAST },
    { cause: "is protected against", enemyMove: MoveId.PROTECT },
    { cause: "is ineffective", move: MoveId.EARTHQUAKE },
    { cause: "matches only one of its types", move: MoveId.NIGHT_SLASH },
    { cause: "is blocked by terrain", move: MoveId.SHADOW_SNEAK, passive: AbilityId.PSYCHIC_SURGE },
  ])(
    "should still trigger if the user's move $cause",
    async ({ move = MoveId.TACKLE, passive = AbilityId.NONE, enemyMove = MoveId.SPLASH }) => {
      game.override.passiveAbility(passive).enemySpecies(SpeciesId.SKARMORY);
      await game.classicMode.startBattle([SpeciesId.MEOWSCARADA]);

      vi.spyOn(allMoves[MoveId.FOCUS_BLAST], "accuracy", "get").mockReturnValue(0);

      const meow = game.field.getPlayerPokemon();

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      await game.toEndOfTurn();

      expectTypeChange(meow);
    },
  );

  it.each<{ cause: string; move?: MoveId; tera?: boolean; passive?: AbilityId }>([
    { cause: "user is terastallized to any type", tera: true },
    { cause: "user uses Struggle", move: MoveId.STRUGGLE },
    { cause: "the user's move is blocked by weather", move: MoveId.FIRE_BLAST, passive: AbilityId.PRIMORDIAL_SEA },
    { cause: "the user's move fails", move: MoveId.BURN_UP },
  ])("should not apply if $cause", async ({ move = MoveId.TACKLE, tera = false, passive = AbilityId.NONE }) => {
    game.override.enemyPassiveAbility(passive);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const karp = game.field.getPlayerPokemon();

    karp.teraType = PokemonType.STEEL;

    game.move.use(move, BattlerIndex.PLAYER, undefined, tera);
    await game.toEndOfTurn();

    expectNoTypeChange(karp);
  });

  it("should not apply if user is already the move's type", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const karp = game.field.getPlayerPokemon();

    game.move.use(MoveId.WATERFALL);
    await game.toEndOfTurn();

    expect(karp.waveData.abilitiesApplied.size).toBe(0);
    expect(karp.getTypes()).toEqual([allMoves[MoveId.WATERFALL].type]);
  });

  it.each<{ moveName: string; move: MoveId }>([
    { moveName: "Roar", move: MoveId.ROAR },
    { moveName: "Whirlwind", move: MoveId.WHIRLWIND },
    { moveName: "Forest's Curse", move: MoveId.FORESTS_CURSE },
    { moveName: "Trick-or-Treat", move: MoveId.TRICK_OR_TREAT },
  ])("should still apply if the user's $moveName fails", async ({ move }) => {
    game.override.battleType(BattleType.TRAINER).enemySpecies(SpeciesId.TREVENANT); // ghost/grass makes both moves fail
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.use(move);
    // KO all off-field opponents for Whirlwind and co.
    for (const enemyMon of game.scene.getEnemyParty()) {
      if (!enemyMon.isActive()) {
        enemyMon.hp = 0;
      }
    }
    await game.toEndOfTurn();

    expectTypeChange(leadPokemon);
  });

  it("should trigger on the first turn of charging moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const karp = game.field.getPlayerPokemon();

    game.move.select(MoveId.DIG);
    await game.toEndOfTurn();

    expectTypeChange(karp);

    await game.toEndOfTurn();
    expect(karp.waveData.abilitiesApplied).not.toContain(AbilityId.PROTEAN);
  });

  it("should cause the user to cast Ghost-type Curse on itself", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const karp = game.field.getPlayerPokemon();
    expect(karp.isOfType(PokemonType.GHOST)).toBe(false);

    game.move.select(MoveId.CURSE);
    await game.toEndOfTurn();

    expectTypeChange(karp);
    expect(karp.getHpRatio(true)).toBeCloseTo(0.25);
    expect(karp.getTag(BattlerTagType.CURSED)).toBeDefined();
  });

  it("should not trigger during Focus Punch's start-of-turn message or being interrupted", async () => {
    game.override.moveset(MoveId.FOCUS_PUNCH).enemyMoveset(MoveId.ABSORB);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const karp = game.field.getPlayerPokemon();
    expect(karp.isOfType(PokemonType.FIGHTING)).toBe(false);

    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to("MessagePhase");
    expect(karp.isOfType(PokemonType.FIGHTING)).toBe(false);

    await game.toEndOfTurn();

    expectNoTypeChange(karp);
    expect(karp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
