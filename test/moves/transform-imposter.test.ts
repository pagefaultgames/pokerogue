import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { EnemyPokemon } from "#field/pokemon";
import { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

// TODO: Add more tests once Transform/Imposter are fully implemented
describe("Transforming Effects", () => {
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
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .enemyAbility(AbilityId.BEAST_BOOST)
      .enemyPassiveAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.STURDY);
  });

  // Contains logic shared by both Transform and Impostor (for brevity)
  describe("Phases - PokemonTransformPhase", async () => {
    it("should copy target's species, ability, gender, all stats except HP, all stat stages, moveset and types", async () => {
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const ditto = game.field.getPlayerPokemon();
      const mew = game.field.getEnemyPokemon();

      mew.setStatStage(Stat.ATK, 4);

      game.move.use(MoveId.SPLASH);
      game.scene.phaseManager.unshiftNew("PokemonTransformPhase", ditto.getBattlerIndex(), mew.getBattlerIndex());
      await game.toEndOfTurn();

      expect(ditto.isTransformed()).toBe(true);
      expect(ditto.getSpeciesForm().speciesId).toBe(mew.getSpeciesForm().speciesId);
      expect(ditto.getAbility()).toBe(mew.getAbility());
      expect(ditto.getGender()).toBe(mew.getGender());

      const playerStats = ditto.getStats(false);
      const enemyStats = mew.getStats(false);
      // HP stays the same; all other stats should carry over
      expect(playerStats[0]).not.toBe(enemyStats[0]);
      expect(playerStats.slice(1)).toEqual(enemyStats.slice(1));

      // Stat stages/moveset IDs
      expect(ditto.getStatStages()).toEqual(mew.getStatStages());

      expect(ditto.getMoveset().map(m => m.moveId)).toEqual(ditto.getMoveset().map(m => m.moveId));

      expect(ditto.getTypes()).toEqual(mew.getTypes());
    });

    // TODO: This is not implemented
    it.todo("should copy the target's original typing if target is typeless", async () => {
      game.override.enemySpecies(SpeciesId.MAGMAR);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const ditto = game.field.getPlayerPokemon();
      const magmar = game.field.getEnemyPokemon();

      game.move.use(MoveId.TRANSFORM);
      await game.move.forceEnemyMove(MoveId.BURN_UP);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(magmar.getTypes()).toEqual([PokemonType.UNKNOWN]);
      expect(ditto.getTypes()).toEqual([PokemonType.FIRE]);
    });

    it("should not consider the target's Tera Type when copying types", async () => {
      game.override.enemySpecies(SpeciesId.MAGMAR);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const ditto = game.field.getPlayerPokemon();
      const magmar = game.field.getEnemyPokemon();
      magmar.isTerastallized = true;
      magmar.teraType = PokemonType.DARK;

      game.move.use(MoveId.TRANSFORM);
      await game.toEndOfTurn();

      expect(ditto.getTypes(true)).toEqual([PokemonType.FIRE]);
    });

    // TODO: This is not currently implemented
    it.todo("should copy volatile status effects", async () => {
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const ditto = game.field.getPlayerPokemon();
      const mew = game.field.getEnemyPokemon();
      mew.addTag(BattlerTagType.SEEDED, 0, MoveId.LEECH_SEED, ditto.id);
      mew.addTag(BattlerTagType.CONFUSED, 4, MoveId.AXE_KICK, ditto.id);

      game.move.use(MoveId.TRANSFORM);
      await game.toEndOfTurn();

      expect(ditto.getTag(BattlerTagType.SEEDED)).toBeDefined();
      expect(ditto.getTag(BattlerTagType.CONFUSED)).toBeDefined();
    });

    // TODO: This is not implemented
    it.todo("should copy the target's rage fist hit count");

    it("should not copy friendship, held items, nickname, level or non-volatile status effects", async () => {
      game.override.enemyHeldItems([{ name: "BERRY", count: 1, type: BerryType.SITRUS }]);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const ditto = game.field.getPlayerPokemon();
      const mew = game.field.getEnemyPokemon();

      mew.status = new Status(StatusEffect.POISON);
      mew.friendship = 255;
      mew.nickname = btoa(unescape(encodeURIComponent("Pink Furry Cat Thing")));

      game.move.use(MoveId.TRANSFORM);
      await game.toEndOfTurn();

      expect(ditto.status?.effect).toBeUndefined();
      expect(ditto.getNameToRender()).not.toBe(mew.getNameToRender());
      expect(ditto.level).not.toBe(mew.level);
      expect(ditto.friendship).not.toBe(mew.friendship);
      expect(ditto.getHeldItems()).not.toEqual(mew.getHeldItems());
    });

    it("should copy in-battle overridden stats", async () => {
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      const oldAtk = player.getStat(Stat.ATK);
      const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);

      game.move.use(MoveId.TRANSFORM);
      await game.move.forceEnemyMove(MoveId.POWER_SPLIT);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
      expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);
      expect(avgAtk).not.toBe(oldAtk);
    });

    it("should set each move's pp to a maximum of 5 without affecting PP ups", async () => {
      game.override.enemyMoveset([MoveId.SWORDS_DANCE, MoveId.GROWL, MoveId.SKETCH, MoveId.RECOVER]);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.TRANSFORM);
      await game.toEndOfTurn();

      player.getMoveset().forEach(move => {
        // Should set correct maximum PP without touching `ppUp`
        if (move) {
          if (move.moveId === MoveId.SKETCH) {
            expect(move.getMovePp()).toBe(1);
          } else {
            expect(move.getMovePp()).toBe(5);
          }
          expect(move.ppUp).toBe(0);
        }
      });
    });

    it("should activate its ability if it copies one that activates on summon", async () => {
      game.override.enemyAbility(AbilityId.INTIMIDATE);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      game.move.use(MoveId.TRANSFORM);
      game.phaseInterceptor.clearLogs();
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
      expect(game.phaseInterceptor.log).toContain("StatStageChangePhase");
    });

    it("should persist transformed attributes across reloads", async () => {
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      game.move.use(MoveId.TRANSFORM);
      await game.move.forceEnemyMove(MoveId.MEMENTO);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toNextWave();

      expect(game).toBeAtPhase("CommandPhase");
      expect(game.scene.currentBattle.waveIndex).toBe(2);

      await game.reload.reloadSession();

      const playerReloaded = game.field.getPlayerPokemon();
      const playerMoveset = player.getMoveset();

      expect(playerReloaded.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
      expect(playerReloaded.getAbility()).toBe(enemy.getAbility());
      expect(playerReloaded.getGender()).toBe(enemy.getGender());

      expect(playerMoveset.map(m => m.moveId)).toEqual([MoveId.MEMENTO]);
    });

    it("should stay transformed with the correct form after reload", async () => {
      game.override.enemySpecies(SpeciesId.DARMANITAN);
      await game.classicMode.startBattle([SpeciesId.DITTO]);

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      // change form
      enemy.species.formIndex = 1;

      game.move.use(MoveId.TRANSFORM);
      await game.move.forceEnemyMove(MoveId.MEMENTO);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toNextWave();

      expect(game).toBeAtPhase("CommandPhase");
      expect(game.scene.currentBattle.waveIndex).toBe(2);

      expect(player.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
      expect(player.getSpeciesForm().formIndex).toBe(enemy.getSpeciesForm().formIndex);

      await game.reload.reloadSession();

      const playerReloaded = game.field.getPlayerPokemon();
      expect(playerReloaded.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
      expect(playerReloaded.getSpeciesForm().formIndex).toBe(enemy.getSpeciesForm().formIndex);
    });
  });

  describe("Moves - Transform", () => {
    it.each<{ cause: string; callback: (p: Pokemon) => void; player?: boolean }>([
      {
        cause: "user is fused",
        callback: p => vi.spyOn(p, "isFusion").mockReturnValue(true),
      },
      {
        cause: "target is fused",
        callback: p => vi.spyOn(p, "isFusion").mockReturnValue(true),
        player: false,
      },
      {
        cause: "user is transformed",
        callback: p => vi.spyOn(p, "isTransformed").mockReturnValue(true),
      },
      {
        cause: "target is transformed",
        callback: p => vi.spyOn(p, "isTransformed").mockReturnValue(true),
        player: false,
      },
      {
        cause: "user has illusion",
        callback: p => p.setIllusion(game.scene.getEnemyParty()[1]),
      },
      {
        cause: "target has illusion",
        callback: p => p.setIllusion(game.scene.getEnemyParty()[1]),
        player: false,
      },
      {
        cause: "target is behind a substitute",
        callback: p => p.addTag(BattlerTagType.SUBSTITUTE, 1, MoveId.SUBSTITUTE, p.id),
        player: false,
      },
    ])("should fail if $cause", async ({ callback, player = true }) => {
      game.override.battleType(BattleType.TRAINER); // ensures 2 enemy pokemon for illusion
      await game.classicMode.startBattle([SpeciesId.DITTO, SpeciesId.ABOMASNOW]);

      callback(player ? game.field.getPlayerPokemon() : game.field.getEnemyPokemon());

      game.move.use(MoveId.TRANSFORM);
      await game.toEndOfTurn();

      const ditto = game.field.getPlayerPokemon();
      expect(ditto.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(game.phaseInterceptor.log).not.toContain("PokemonTransformPhase");
    });
  });

  describe("Abilities - Imposter", () => {
    beforeEach(async () => {
      game.override.ability(AbilityId.NONE);
      // Mock ability index to always be HA (ensuring Ditto has Imposter and nobody else).
      (
        vi.spyOn(Pokemon.prototype as any, "generateAbilityIndex") as MockInstance<
          (typeof Pokemon.prototype)["generateAbilityIndex"]
        >
      ).mockReturnValue(3);
    });

    it.each<{ name: string; callback: (p: EnemyPokemon) => void }>([
      {
        name: "opponents with substitutes",
        callback: p => p.addTag(BattlerTagType.SUBSTITUTE, 1, MoveId.SUBSTITUTE, p.id),
      },
      { name: "fused opponents", callback: p => vi.spyOn(p, "isFusion").mockReturnValue(true) },
      {
        name: "opponents with illusions",
        callback: p => p.setIllusion(game.scene.getEnemyParty()[1]), // doesn't really matter what the illusion is, merely that it exists
      },
    ])("should ignore $name during target selection", async ({ callback }) => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.GYARADOS, SpeciesId.MILOTIC, SpeciesId.DITTO]);

      const ditto = game.scene.getPlayerParty()[2];

      const [enemy1, enemy2] = game.scene.getEnemyField();
      // Override enemy 1 to be a fusion/illusion
      callback(enemy1);

      expect(ditto.canTransformInto(enemy1)).toBe(false);
      expect(ditto.canTransformInto(enemy2)).toBe(true);

      // Switch out to Ditto
      game.doSwitchPokemon(2);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      expect(ditto.isActive()).toBe(true);
      expect(ditto.isTransformed()).toBe(true);
      expect(ditto.getSpeciesForm().speciesId).toBe(enemy2.getSpeciesForm().speciesId);
      expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
      expect(game.phaseInterceptor.log).toContain("PokemonTransformPhase");
    });

    it("should not activate if both opponents are fused or have illusions", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.GYARADOS, SpeciesId.MILOTIC, SpeciesId.DITTO]);

      const [gyarados, , ditto] = game.scene.getPlayerParty();
      const [enemy1, enemy2] = game.scene.getEnemyParty();
      // Override enemy 1 to be a fusion & enemy 2 to have illusion
      vi.spyOn(enemy1, "isFusion").mockReturnValue(true);
      enemy2.setIllusion(gyarados);

      expect(ditto.canTransformInto(enemy1)).toBe(false);
      expect(ditto.canTransformInto(enemy2)).toBe(false);

      // Switch out to Ditto
      game.doSwitchPokemon(2);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      expect(ditto.isActive()).toBe(true);
      expect(ditto.isTransformed()).toBe(false);
      expect(ditto.getSpeciesForm().speciesId).toBe(SpeciesId.DITTO);
      expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
      expect(game.phaseInterceptor.log).not.toContain("PokemonTransformPhase");
    });
  });
});
