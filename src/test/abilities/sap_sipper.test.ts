import { Stat } from "#enums/stat";
import { TerrainType } from "#app/data/terrain";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

// See also: TypeImmunityAbAttr
describe("Abilities - Sap Sipper", () => {
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
    game.override.disableCrits();
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass attack", async() => {
    const moveToUse = Moves.LEAFAGE;
    const enemyAbility = Abilities.SAP_SIPPER;

    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.DUSKULL);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass status move", async() => {
    const moveToUse = Moves.SPORE;
    const enemyAbility = Abilities.SAP_SIPPER;

    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.status).toBeUndefined();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the field", async () => {
    const moveToUse = Moves.GRASSY_TERRAIN;
    const enemyAbility = Abilities.SAP_SIPPER;

    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.terrain).toBeDefined();
    expect(game.scene.arena.terrain!.terrainType).toBe(TerrainType.GRASSY);
    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(0);
  });

  it("activate once against multi-hit grass attacks", async () => {
    const moveToUse = Moves.BULLET_SEED;
    const enemyAbility = Abilities.SAP_SIPPER;

    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the user", async () => {
    const moveToUse = Moves.SPIKY_SHIELD;
    const ability = Abilities.SAP_SIPPER;

    game.override.moveset([ moveToUse ]);
    game.override.ability(ability);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.NONE);

    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getTag(BattlerTagType.SPIKY_SHIELD)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  // TODO Add METRONOME outcome override
  // To run this testcase, manually modify the METRONOME move to always give SAP_SIPPER, then uncomment
  it.todo("activate once against multi-hit grass attacks (metronome)", async () => {
    const moveToUse = Moves.METRONOME;
    const enemyAbility = Abilities.SAP_SIPPER;

    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });
});
