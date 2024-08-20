import { StatusEffect } from "#app/data/status-effect";
import { EnemyPokemon } from "#app/field/pokemon";
import { allMoves } from "#app/data/move";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TurnEndPhase } from "#app/phases/turn-end-phase";

const TIMEOUT = 20 * 1000;

describe("Moves - Thunder Wave", () => {
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
    game.override.starterSpecies(Species.PIKACHU);
    game.override.moveset([Moves.THUNDER_WAVE]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
  });

  // References: https://bulbapedia.bulbagarden.net/wiki/Thunder_Wave_(move)

  it(
    "Thunder Wave as-is paralyzes non-statused Pokemon that are not Ground types",
    async () => {
      game.override.enemySpecies(Species.MAGIKARP);
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.status?.effect).toBe(StatusEffect.PARALYSIS);
    },
    TIMEOUT
  );

  it(
    "Thunder Wave as-is does not paralyze if the Pokemon is a Ground-type",
    async () => {
      game.override.enemySpecies(Species.DIGLETT);
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.status).toBeUndefined();
    },
    TIMEOUT
  );

  it(
    "Thunder Wave does not paralyze if the Pokemon is already status-ed",
    async () => {
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyStatusEffect(StatusEffect.BURN);
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.PARALYSIS);
    },
    TIMEOUT
  );

  it(
    "Thunder Wave's effectiveness is based on its type",
    async () => {
      game.override.ability(Abilities.NORMALIZE);
      game.override.enemySpecies(Species.DIGLETT);
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.status?.effect).toBe(StatusEffect.PARALYSIS);
    },
    TIMEOUT
  );

  it(
    "Thunder Wave respects type immunities",
    async () => {
      game.override.ability(Abilities.NORMALIZE);
      game.override.enemySpecies(Species.HAUNTER);
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.status).toBeUndefined();
    },
    TIMEOUT
  );
});
