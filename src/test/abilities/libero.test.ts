import { allMoves } from "#app/data/move";
import { Type } from "#app/data/type";
import { Weather, WeatherType } from "#app/data/weather";
import { PlayerPokemon } from "#app/field/pokemon";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Libero", () => {
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
    game.override.battleType("single");
    game.override.ability(Abilities.LIBERO);
    game.override.startingLevel(100);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyMoveset([Moves.ENDURE, Moves.ENDURE, Moves.ENDURE, Moves.ENDURE]);
  });

  test(
    "ability applies and changes a pokemon's type",
    async () => {
      game.override.moveset([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);
    },
    TIMEOUT,
  );

  test.skip(
    "ability applies only once per switch in",
    async () => {
      game.override.moveset([Moves.SPLASH, Moves.AGILITY]);

      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR]);

      let leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);

      game.move.select(Moves.AGILITY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied.filter((a) => a === Abilities.LIBERO)).toHaveLength(1);
      const leadPokemonType = Type[leadPokemon.getTypes()[0]];
      const moveType = Type[allMoves[Moves.AGILITY].type];
      expect(leadPokemonType).not.toBe(moveType);

      await game.toNextTurn();
      game.doSwitchPokemon(1);
      await game.toNextTurn();
      game.doSwitchPokemon(1);
      await game.toNextTurn();

      leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move has a variable type",
    async () => {
      game.override.moveset([Moves.WEATHER_BALL]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.scene.arena.weather = new Weather(WeatherType.SUNNY);
      game.move.select(Moves.WEATHER_BALL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).toContain(Abilities.LIBERO);
      expect(leadPokemon.getTypes()).toHaveLength(1);
      const leadPokemonType = Type[leadPokemon.getTypes()[0]],
        moveType = Type[Type.FIRE];
      expect(leadPokemonType).toBe(moveType);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the type has changed by another ability",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.passiveAbility(Abilities.REFRIGERATE);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.TACKLE);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).toContain(Abilities.LIBERO);
      expect(leadPokemon.getTypes()).toHaveLength(1);
      const leadPokemonType = Type[leadPokemon.getTypes()[0]],
        moveType = Type[Type.ICE];
      expect(leadPokemonType).toBe(moveType);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move calls another move",
    async () => {
      game.override.moveset([Moves.NATURE_POWER]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.scene.arena.biomeType = Biome.MOUNTAIN;
      game.move.select(Moves.NATURE_POWER);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.AIR_SLASH);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move is delayed / charging",
    async () => {
      game.override.moveset([Moves.DIG]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.DIG);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.DIG);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move misses",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.enemyMoveset(SPLASH_ONLY);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.TACKLE);
      await game.move.forceMiss();
      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon.isFullHp()).toBe(true);
      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move is protected against",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.enemyMoveset([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.TACKLE);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move fails because of type immunity",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.enemySpecies(Species.GASTLY);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.TACKLE);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon's type is the same as the move's type",
    async () => {
      game.override.moveset([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      leadPokemon.summonData.types = [allMoves[Moves.SPLASH].type];
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.LIBERO);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon is terastallized",
    async () => {
      game.override.moveset([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      vi.spyOn(leadPokemon, "isTerastallized").mockReturnValue(true);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.LIBERO);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon uses struggle",
    async () => {
      game.override.moveset([Moves.STRUGGLE]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.STRUGGLE);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.LIBERO);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if the pokemon's move fails",
    async () => {
      game.override.moveset([Moves.BURN_UP]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.BURN_UP);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.LIBERO);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's Trick-or-Treat fails",
    async () => {
      game.override.moveset([Moves.TRICK_OR_TREAT]);
      game.override.enemySpecies(Species.GASTLY);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.TRICK_OR_TREAT);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TRICK_OR_TREAT);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly and the pokemon curses itself",
    async () => {
      game.override.moveset([Moves.CURSE]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      expect(leadPokemon).not.toBe(undefined);

      game.move.select(Moves.CURSE);
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.CURSE);
      expect(leadPokemon.getTag(BattlerTagType.CURSED)).not.toBe(undefined);
    },
    TIMEOUT,
  );
});

function testPokemonTypeMatchesDefaultMoveType(pokemon: PlayerPokemon, move: Moves) {
  expect(pokemon.summonData.abilitiesApplied).toContain(Abilities.LIBERO);
  expect(pokemon.getTypes()).toHaveLength(1);
  const pokemonType = Type[pokemon.getTypes()[0]],
    moveType = Type[allMoves[move].type];
  expect(pokemonType).toBe(moveType);
}
