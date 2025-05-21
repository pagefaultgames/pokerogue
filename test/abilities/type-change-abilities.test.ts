import { allMoves } from "#app/data/moves/move";
import { PokemonType } from "#enums/pokemon-type";
import { MoveResult, type PlayerPokemon } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#app/battle";

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
      .ability(Abilities.PROTEAN)
      .startingLevel(100)
      .moveset([Moves.CURSE, Moves.DIG, Moves.SPLASH])
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(Moves.SPLASH);
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
    expect(pokemon.waveData.abilitiesApplied).toContainEqual(expect.toBeOneOf([Abilities.PROTEAN, Abilities.LIBERO]));
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
      expect.toBeOneOf([Abilities.PROTEAN, Abilities.LIBERO]),
    );
    const lastMove = allMoves[pokemon.getLastXMoves()[0].move]!;

    const pokemonTypes = pokemon.getTypes().map(pt => PokemonType[pt]);
    const moveType = PokemonType[pokemon.getMoveType(lastMove, true)];
    expect(pokemonTypes).not.toEqual([moveType]);
    pokemon.waveData.abilitiesApplied.clear();
  }

  it.each([
    { name: "Protean", ability: Abilities.PROTEAN },
    { name: "Libero", ability: Abilities.PROTEAN },
  ])("$name should change the user's type to the type of the move being used", async ({ ability }) => {
    game.override.ability(ability);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).toBeDefined();

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(leadPokemon);
  });

  // Test for Gen9+ functionality, we are using previous funcionality
  it.skip("should apply only once per switch in", async () => {
    game.override.moveset([Moves.SPLASH, Moves.AGILITY]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.BULBASAUR]);

    const bulbasaur = game.scene.getPlayerPokemon()!;
    expect(bulbasaur).toBeDefined();

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(bulbasaur);

    game.move.select(Moves.AGILITY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectNoTypeChange(bulbasaur);

    // switch out and back in
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(bulbasaur);
  });

  it.each<{ category: string; move?: Moves; passive?: Abilities; enemyMove?: Moves }>([
    { category: "Variable type Moves'", move: Moves.WEATHER_BALL, passive: Abilities.DROUGHT },
    { category: "Type Change Abilities'", passive: Abilities.REFRIGERATE },
    { category: "Move-calling Moves'", move: Moves.NATURE_POWER, passive: Abilities.PSYCHIC_SURGE },
    { category: "Ion Deluge's", enemyMove: Moves.ION_DELUGE },
    { category: "Electrify's", enemyMove: Moves.ELECTRIFY },
  ])(
    "should respect $category final type",
    async ({ move = Moves.TACKLE, passive = Abilities.NONE, enemyMove = Moves.SPLASH }) => {
      game.override.moveset(move).passiveAbility(passive).enemyMoveset(enemyMove);

      // Pure normal type for move overrides
      await game.classicMode.startBattle([Species.LINOONE]);

      const linoone = game.scene.getPlayerPokemon()!;
      expect(linoone).toBeDefined();

      game.move.select(move);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to("BerryPhase"); // NB: berry phase = turn end tags stay = tests happy

      expectTypeChange(linoone);
    },
  );

  it.each<{ cause: string; move?: Moves; passive?: Abilities; enemyMove?: Moves }>([
    { cause: "misses", move: Moves.FOCUS_BLAST },
    { cause: "is protected against", enemyMove: Moves.PROTECT },
    { cause: "is ineffective", move: Moves.EARTHQUAKE },
    { cause: "matches only one of its types", move: Moves.NIGHT_SLASH },
    { cause: "is blocked by terrain", move: Moves.SHADOW_SNEAK, passive: Abilities.PSYCHIC_SURGE },
  ])(
    "should still trigger if the user's move $cause",
    async ({ move = Moves.TACKLE, passive = Abilities.NONE, enemyMove = Moves.SPLASH }) => {
      game.override.moveset(move).passiveAbility(passive).enemyMoveset(enemyMove).enemySpecies(Species.SKARMORY);
      await game.classicMode.startBattle([Species.MEOWSCARADA]);

      // FOCUS MISS IS REAL CHAT
      vi.spyOn(allMoves[Moves.FOCUS_BLAST], "accuracy", "get").mockReturnValue(0);

      const meow = game.scene.getPlayerPokemon()!;
      expect(meow).toBeDefined();

      game.move.select(move);
      await game.phaseInterceptor.to("BerryPhase");

      expectTypeChange(meow);
    },
  );

  it.each<{ cause: string; move?: Moves; tera?: boolean; passive?: Abilities }>([
    { cause: "user is terastallized to any type", tera: true },
    { cause: "user uses Struggle", move: Moves.STRUGGLE },
    { cause: "the user's move is blocked by weather", move: Moves.FIRE_BLAST, passive: Abilities.PRIMORDIAL_SEA },
    { cause: "the user's move fails", move: Moves.BURN_UP },
  ])("should not apply if $cause", async ({ move = Moves.TACKLE, tera = false, passive = Abilities.NONE }) => {
    game.override.moveset(move).enemyPassiveAbility(passive);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const karp = game.scene.getPlayerPokemon()!;
    expect(karp).toBeDefined();

    karp.teraType = PokemonType.STEEL;

    if (tera) {
      game.move.selectWithTera(move);
    } else {
      game.move.select(move);
    }
    await game.phaseInterceptor.to("TurnEndPhase");

    expectNoTypeChange(karp);
  });

  it("should not apply if user is already the move's type", async () => {
    game.override.moveset(Moves.WATERFALL);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const karp = game.scene.getPlayerPokemon()!;
    expect(karp).toBeDefined();

    game.move.select(Moves.WATERFALL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(karp.waveData.abilitiesApplied.size).toBe(0);
    expect(karp.getTypes()).toEqual([allMoves[Moves.WATERFALL].type]);
  });

  it.each<{ moveName: string; move: Moves }>([
    { moveName: "Roar", move: Moves.ROAR },
    { moveName: "Whirlwind", move: Moves.WHIRLWIND },
    { moveName: "Forest's Curse", move: Moves.FORESTS_CURSE },
    { moveName: "Trick-or-Treat", move: Moves.TRICK_OR_TREAT },
  ])("should still apply if the user's $moveName fails", async ({ move }) => {
    game.override.moveset(move).battleType(BattleType.TRAINER).enemySpecies(Species.TREVENANT); // ghost/grass makes both moves fail

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).toBeDefined();

    game.move.select(move);
    // KO all off-field opponents for Whirlwind and co.
    for (const enemyMon of game.scene.getEnemyParty()) {
      if (!enemyMon.isActive()) {
        enemyMon.hp = 0;
      }
    }
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(leadPokemon);
  });

  it("should trigger on the first turn of charging moves", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const karp = game.scene.getPlayerPokemon()!;
    expect(karp).toBeDefined();

    game.move.select(Moves.DIG);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(karp);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(karp.waveData.abilitiesApplied).not.toContain(Abilities.PROTEAN);
  });

  it("should cause the user to cast Ghost-type Curse on itself", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const karp = game.scene.getPlayerPokemon()!;
    expect(karp).toBeDefined();
    expect(karp.isOfType(PokemonType.GHOST)).toBe(false);

    game.move.select(Moves.CURSE);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectTypeChange(karp);
    expect(karp.getTag(BattlerTagType.CURSED)).toBeDefined();
    expect(karp.getHpRatio(true)).toBeCloseTo(0.25);
  });

  it("should not trigger during Focus Punch's start-of-turn message or being interrupted", async () => {
    game.override.moveset(Moves.FOCUS_PUNCH).enemyMoveset(Moves.ABSORB);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const karp = game.scene.getPlayerPokemon()!;
    expect(karp).toBeDefined();
    expect(karp.isOfType(PokemonType.FIGHTING)).toBe(false);

    game.move.select(Moves.FOCUS_PUNCH);

    await game.phaseInterceptor.to("MessagePhase");
    expect(karp.isOfType(PokemonType.FIGHTING)).toBe(false);

    await game.phaseInterceptor.to("TurnEndPhase");

    expectNoTypeChange(karp);
    expect(karp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
