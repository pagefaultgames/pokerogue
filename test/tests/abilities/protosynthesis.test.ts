import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const effectiveStatParams = { ignoreHeldItems: true };

describe.each([
  { abilityId: AbilityId.PROTOSYNTHESIS, abilityName: "Protosynthesis", arenaMove: MoveId.SUNNY_DAY },
  { abilityId: AbilityId.QUARK_DRIVE, abilityName: "Quark Drive", arenaMove: MoveId.ELECTRIC_TERRAIN },
])("Abilities - $abilityName", ({ abilityId, arenaMove }) => {
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
      .ability(abilityId)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.CHANSEY)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should boost the higher of the user's stats", async () => {
    game.override.playerIVs([0, 0, 0, 1, 0, 0]); // Set SpAtk to 1 so that it's higher than Atk
    await game.classicMode.startBattle(SpeciesId.MEW);

    const player = game.field.getPlayerPokemon();
    expect(player.getNature()).toBe(Nature.HARDY);

    const startingAtk = player.getEffectiveStat(Stat.ATK, effectiveStatParams);
    const startingSpAtk = player.getEffectiveStat(Stat.SPATK, effectiveStatParams);
    expect(startingAtk).toBeLessThan(startingSpAtk);

    const enemy = game.field.getEnemyPokemon();
    const initialHp = enemy.hp;

    game.move.use(MoveId.FAIRY_WIND);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceEnemyMove(arenaMove);
    await game.toNextTurn();

    const unboostedDamage = initialHp - enemy.hp;
    enemy.hp = initialHp;
    const boostedAtk = player.getEffectiveStat(Stat.ATK, effectiveStatParams);
    const boostedSpAtk = player.getEffectiveStat(Stat.SPATK, effectiveStatParams);
    expect(boostedAtk).toBeLessThan(boostedSpAtk);

    game.move.use(MoveId.FAIRY_WIND);
    await game.toNextTurn();

    const boostedDamage = initialHp - enemy.hp;
    expect(boostedDamage).toBeGreaterThan(unboostedDamage * 1.1);
    expect(boostedSpAtk).toBeGreaterThan(startingSpAtk);
    expect(boostedAtk).toEqual(startingAtk);
  });

  it("should not consider temporary items when determining which stat to boost", async () => {
    game.override.startingModifier([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.DEF }]);
    await game.classicMode.startBattle(SpeciesId.MEW);

    const player = game.field.getPlayerPokemon();
    expect(player.getNature()).toBe(Nature.HARDY);

    const enemy = game.field.getEnemyPokemon();

    const startingDef = player.getEffectiveStat(Stat.DEF, effectiveStatParams);
    const startingAtk = player.getEffectiveStat(Stat.ATK, effectiveStatParams);
    const initialHp = enemy.hp;

    game.move.use(MoveId.TACKLE);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceEnemyMove(arenaMove);
    await game.toNextTurn();

    const unboostedDamage = initialHp - enemy.hp;
    enemy.hp = initialHp;
    const boostedDef = player.getEffectiveStat(Stat.DEF, effectiveStatParams);
    const boostedAtk = player.getEffectiveStat(Stat.ATK, effectiveStatParams);

    game.move.use(MoveId.TACKLE);
    await game.toNextTurn();

    const boostedDamage = initialHp - enemy.hp;
    expect(boostedDamage).toBeGreaterThan(unboostedDamage * 1.1);
    expect(boostedDef).toEqual(startingDef);
    expect(boostedAtk).toBeGreaterThan(startingAtk);
  });
});
