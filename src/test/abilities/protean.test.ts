import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import * as Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases.js";
import { allMoves } from "#app/data/move.js";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Weather, WeatherType } from "#app/data/weather.js";
import { Type } from "#app/data/type.js";
import { Biome } from "#enums/biome";
import { PlayerPokemon } from "#app/field/pokemon.js";

const TIMEOUT = 20 * 1000;

describe("Abilities - Protean", () => {
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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.PROTEAN);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ENDURE, Moves.ENDURE, Moves.ENDURE, Moves.ENDURE]);
  });

  test(
    "ability applies and changes a pokemon's type",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);
    },
    TIMEOUT,
  );

  test(
    "ability applies only once per switch in",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.AGILITY]);

      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR]);

      let leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);

      game.doAttack(getMovePosition(game.scene, 0, Moves.AGILITY));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied.filter((a) => a === Abilities.PROTEAN)).toHaveLength(1);
      const leadPokemonType = Type[leadPokemon.getTypes()[0]];
      const moveType = Type[allMoves[Moves.AGILITY].defaultType];
      expect(leadPokemonType).not.toBe(moveType);

      await game.toNextTurn();
      game.doSwitchPokemon(1);
      await game.toNextTurn();
      game.doSwitchPokemon(1);
      await game.toNextTurn();

      leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.SPLASH);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move has a variable type",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WEATHER_BALL]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.scene.arena.weather = new Weather(WeatherType.SUNNY);
      game.doAttack(getMovePosition(game.scene, 0, Moves.WEATHER_BALL));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).toContain(Abilities.PROTEAN);
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
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.REFRIGERATE);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).toContain(Abilities.PROTEAN);
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
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.NATURE_POWER]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.scene.arena.biomeType = Biome.MOUNTAIN;
      game.doAttack(getMovePosition(game.scene, 0, Moves.NATURE_POWER));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.AIR_SLASH);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move is delayed / charging",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DIG]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.DIG));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.DIG);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move misses",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValueOnce(false);
      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move is protected against",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's move fails because of type immunity",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.GASTLY);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TACKLE);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon's type is the same as the move's type",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      leadPokemon.summonData.types = [allMoves[Moves.SPLASH].defaultType];
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.PROTEAN);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon is terastallized",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      vi.spyOn(leadPokemon, "isTerastallized").mockReturnValue(true);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.PROTEAN);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if pokemon uses struggle",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STRUGGLE]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.STRUGGLE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.PROTEAN);
    },
    TIMEOUT,
  );

  test(
    "ability is not applied if the pokemon's move fails",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BURN_UP]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BURN_UP));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.summonData.abilitiesApplied).not.toContain(Abilities.PROTEAN);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly even if the pokemon's Trick-or-Treat fails",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TRICK_OR_TREAT]);
      vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.GASTLY);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TRICK_OR_TREAT));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.TRICK_OR_TREAT);
    },
    TIMEOUT,
  );

  test(
    "ability applies correctly and the pokemon curses itself",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CURSE]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.CURSE));
      await game.phaseInterceptor.to(TurnEndPhase);

      testPokemonTypeMatchesDefaultMoveType(leadPokemon, Moves.CURSE);
      expect(leadPokemon.getTag(BattlerTagType.CURSED)).not.toBe(undefined);
    },
    TIMEOUT,
  );
});

function testPokemonTypeMatchesDefaultMoveType(pokemon: PlayerPokemon, move: Moves) {
  expect(pokemon.summonData.abilitiesApplied).toContain(Abilities.PROTEAN);
  expect(pokemon.getTypes()).toHaveLength(1);
  const pokemonType = Type[pokemon.getTypes()[0]],
    moveType = Type[allMoves[move].defaultType];
  expect(pokemonType).toBe(moveType);
}
