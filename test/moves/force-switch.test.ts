import { BattlerIndex } from "#app/battle";
import { Challenges } from "#enums/challenges";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { splitArray } from "#app/utils/common";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveResult } from "#app/field/pokemon";
import { SubstituteTag } from "#app/data/battler-tags";

describe("Moves - Switching Moves", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  describe("Target Switch Moves", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .ability(Abilities.NO_GUARD)
        .moveset([Moves.DRAGON_TAIL, Moves.SPLASH, Moves.FLAMETHROWER])
        .enemySpecies(Species.WAILORD)
        .enemyMoveset(Moves.SPLASH);
    });

    it("should force switches to a random off-field pokemon", async () => {
      game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
      await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

      // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min;
      });
      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.DRAGON_TAIL);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(true);
      expect(squirtle.isOnField()).toBe(false);
      expect(bulbasaur.getInverseHp()).toBeGreaterThan(0);

      // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min + 1;
      });
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(false);
      expect(squirtle.isOnField()).toBe(true);
      expect(charmander.getInverseHp()).toBeGreaterThan(0);
    });

    it("should force trainers to switch randomly without selecting from a partner's party", async () => {
      game.override
        .battleStyle("double")
        .enemyMoveset(Moves.SPLASH)
        .enemyAbility(Abilities.STURDY)
        .battleType(BattleType.TRAINER)
        .randomTrainer({ trainerType: TrainerType.TATE, alwaysDouble: true })
        .enemySpecies(0);
      await game.classicMode.startBattle([Species.WIMPOD, Species.TYRANITAR]);

      // Grab each trainer's pokemon based on species name
      const [tateParty, lizaParty] = splitArray(
        game.scene.getEnemyParty(),
        pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
      ).map(a => a.map(p => p.species.name));

      expect(tateParty).not.toEqual(lizaParty);

      // Force enemy trainers to switch to the first mon available.
      // Due to how enemy trainer parties are laid out, this prevents false positives
      // as Tate's pokemon are placed immediately before Liza's corresponding members.
      vi.fn(Phaser.Math.RND.integerInRange).mockImplementation(min => min);

      // Spy on the function responsible for making informed switches
      const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

      game.move.select(Moves.DRAGON_TAIL, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
      game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
      await game.phaseInterceptor.to("BerryPhase");

      const [tatePartyNew, lizaPartyNew] = splitArray(
        game.scene.getEnemyParty(),
        pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
      ).map(a => a.map(p => p.species.name));

      // Forced switch move should have switched Liza's Pokemon with another one of her own at random
      expect(tatePartyNew).toEqual(tateParty);
      expect(lizaPartyNew).not.toEqual(lizaParty);
      expect(choiceSwitchSpy).not.toHaveBeenCalled();
    });

    it("should force wild Pokemon to flee and redirect moves accordingly", async () => {
      game.override.battleStyle("double").enemyMoveset(Moves.SPLASH).enemyAbility(Abilities.ROUGH_SKIN);
      await game.classicMode.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);

      const leadPokemon = game.scene.getPlayerParty()[0]!;
      const secPokemon = game.scene.getPlayerParty()[1]!;

      const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
      const enemySecPokemon = game.scene.getEnemyParty()[1]!;

      game.move.select(Moves.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
      // target the same pokemon, second move should be redirected after first flees
      game.move.select(Moves.DRAGON_TAIL, 1, BattlerIndex.ENEMY);

      await game.phaseInterceptor.to("BerryPhase");

      const isVisibleLead = enemyLeadPokemon.visible;
      const hasFledLead = enemyLeadPokemon.switchOutStatus;
      const isVisibleSec = enemySecPokemon.visible;
      const hasFledSec = enemySecPokemon.switchOutStatus;
      expect(!isVisibleLead && hasFledLead && !isVisibleSec && hasFledSec).toBe(true);
      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
      expect(secPokemon.hp).toBeLessThan(secPokemon.getMaxHp());
      expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
      expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
    });

    it("should not switch out a target with suction cups, unless the user has Mold Breaker", async () => {
      game.override.enemyAbility(Abilities.SUCTION_CUPS);
      await game.classicMode.startBattle([Species.REGIELEKI]);

      const enemy = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.DRAGON_TAIL);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemy.isOnField()).toBe(true);
      expect(enemy.isFullHp()).toBe(false);

      // Turn 2: Mold Breaker should ignore switch blocking ability and switch out the target
      game.override.ability(Abilities.MOLD_BREAKER);
      enemy.hp = enemy.getMaxHp();

      game.move.select(Moves.DRAGON_TAIL);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemy.isOnField()).toBe(false);
      expect(enemy.isFullHp()).toBe(false);
    });

    it("should not switch out a Commanded Dondozo", async () => {
      game.override.battleStyle("double").enemySpecies(Species.DONDOZO);
      await game.classicMode.startBattle([Species.REGIELEKI]);

      // pretend dondozo 2 commanded dondozo 1 (silly I know, but it works)
      const [dondozo1, dondozo2] = game.scene.getEnemyField();
      dondozo1.addTag(BattlerTagType.COMMANDED, 1, Moves.NONE, dondozo2.id);

      game.move.select(Moves.DRAGON_TAIL);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(dondozo1.isOnField()).toBe(true);
      expect(dondozo1.isFullHp()).toBe(false);
    });

    it("should force a switch upon fainting an opponent normally", async () => {
      game.override.startingWave(5).startingLevel(1000); // To make sure Dragon Tail KO's the opponent
      await game.classicMode.startBattle([Species.DRATINI]);

      game.move.select(Moves.DRAGON_TAIL);

      await game.toNextTurn();

      // Make sure the enemy switched to a healthy Pokemon
      const enemy = game.scene.getEnemyPokemon()!;
      expect(enemy).toBeDefined();
      expect(enemy.isFullHp()).toBe(true);

      // Make sure the enemy has a fainted Pokemon in their party and not on the field
      const faintedEnemy = game.scene.getEnemyParty().find(p => !p.isAllowedInBattle());
      expect(faintedEnemy).toBeDefined();
      expect(game.scene.getEnemyField().length).toBe(1);
    });

    it("should neither switch nor softlock when activating an opponent's reviver seed", async () => {
      game.override
        .battleType(BattleType.TRAINER)
        .enemyHeldItems([{ name: "REVIVER_SEED" }])
        .startingLevel(1000); // make sure Dragon Tail KO's the opponent
      await game.classicMode.startBattle([Species.DRATINI]);

      const [wailord1, wailord2] = game.scene.getEnemyParty()!;
      expect(wailord1).toBeDefined();
      expect(wailord2).toBeDefined();

      game.move.select(Moves.DRAGON_TAIL);
      await game.toNextTurn();

      // Wailord should have consumed the reviver seed and stayed on field
      expect(wailord1.isOnField()).toBe(true);
      expect(wailord1.getHpRatio()).toBeCloseTo(0.5);
      expect(wailord1.getHeldItems()).toHaveLength(0);
      expect(wailord2.isOnField()).toBe(false);
    });

    it("should neither switch nor softlock when activating a player's reviver seed", async () => {
      game.override
        .startingHeldItems([{ name: "REVIVER_SEED" }])
        .enemyMoveset(Moves.DRAGON_TAIL)
        .enemyLevel(1000); // make sure Dragon Tail KO's the player
      await game.classicMode.startBattle([Species.BLISSEY, Species.BULBASAUR]);

      const [blissey, bulbasaur] = game.scene.getPlayerParty();

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // dratini should have consumed the reviver seed and stayed on field
      expect(blissey.isOnField()).toBe(true);
      expect(blissey.getHpRatio()).toBeCloseTo(0.5);
      expect(blissey.getHeldItems()).toHaveLength(0);
      expect(bulbasaur.isOnField()).toBe(false);
    });

    it("should not force a switch to a fainted or challenge-ineligible Pokemon", async () => {
      game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
      // Mono-Water challenge, Eevee is ineligible
      game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
      await game.challengeMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

      const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();
      expect(toxapex).toBeDefined();
      toxapex.hp = 0;

      // Mock an RNG call to switch to the first eligible pokemon.
      // Eevee is ineligible and Toxapex is fainted, so it should proc on Primarina instead
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min;
      });
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(lapras.isOnField()).toBe(false);
      expect(eevee.isOnField()).toBe(false);
      expect(toxapex.isOnField()).toBe(false);
      expect(primarina.isOnField()).toBe(true);
      expect(lapras.getInverseHp()).toBeGreaterThan(0);
    });

    // TODO: This is not implemented yet (needs locales)
    it.todo.each<{ name: string; move: Moves }>([
      { name: "Whirlwind", move: Moves.WHIRLWIND },
      { name: "Roar", move: Moves.ROAR },
      { name: "Dragon Tail", move: Moves.DRAGON_TAIL },
      { name: "Circle Throw", move: Moves.CIRCLE_THROW },
    ])("should display custom text for forced switch outs", async ({ move }) => {
      game.override.moveset(move).battleType(BattleType.TRAINER);
      await game.classicMode.startBattle([Species.BLISSEY, Species.BULBASAUR]);

      const enemy = game.scene.getEnemyPokemon()!;
      game.move.select(move);
      await game.toNextTurn();

      const newEnemy = game.scene.getEnemyPokemon()!;
      expect(newEnemy).not.toBe(enemy);
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      expect(game.textInterceptor.logs).not.toContain(
        i18next.t("battle:trainerGo", {
          trainerName: game.scene.currentBattle.trainer?.getName(newEnemy.trainerSlot),
          pokemonName: newEnemy.getNameToRender(),
        }),
      );
    });
  });

  describe("Self-Switch Attack Moves", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .enemySpecies(Species.GENGAR)
        .moveset(Moves.U_TURN)
        .enemyMoveset(Moves.SPLASH)
        .disableCrits();
    });

    it("triggers rough skin on the u-turn user before a new pokemon is switched in", async () => {
      game.override.enemyAbility(Abilities.ROUGH_SKIN);
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

      const raichu = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.U_TURN);
      game.doSelectPartyPokemon(1);
      // advance to the phase for picking party members to send out
      await game.phaseInterceptor.to("SwitchPhase", false);

      expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
      const player = game.scene.getPlayerPokemon()!;
      expect(player).toBe(raichu);
      expect(player.isFullHp()).toBe(false);
      expect(game.scene.getEnemyPokemon()!.waveData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    });

    it("still forces a switch if u-turn KO's the opponent", async () => {
      game.override.startingLevel(1000);
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);
      const enemy = game.scene.getEnemyPokemon()!;

      // KO the opponent with U-Turn
      game.move.select(Moves.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.isFainted()).toBe(true);

      // Check that U-Turn forced a switch
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.SHUCKLE);
    });
  });

  describe("Failure Checks", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override.battleStyle("single").enemySpecies(Species.GENGAR).disableCrits().enemyAbility(Abilities.STURDY);
    });

    it.each<{ name: string; move: Moves }>([
      { name: "U-Turn", move: Moves.U_TURN },
      { name: "Flip Turn", move: Moves.FLIP_TURN },
      { name: "Volt Switch", move: Moves.VOLT_SWITCH },
      { name: "Baton Pass", move: Moves.BATON_PASS },
      { name: "Shed Tail", move: Moves.SHED_TAIL },
      { name: "Parting Shot", move: Moves.PARTING_SHOT },
    ])("$name should not allow wild pokemon to flee", async ({ move }) => {
      game.override.moveset(Moves.SPLASH).enemyMoveset(move);
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

      // reset species override so we get a different species
      game.override.enemySpecies(Species.ARBOK);

      game.move.select(Moves.SPLASH);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      const player = game.scene.getPlayerPokemon()!;
      expect(player.species.speciesId).toBe(Species.SHUCKLE);
      expect(player.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

      expect(game.phaseInterceptor.log).not.toContain("BattleEndPhase");
      const enemy = game.scene.getEnemyPokemon()!;
      expect(enemy.switchOutStatus).toBe(false);
      expect(enemy.species.speciesId).toBe(Species.GENGAR);
    });

    it.each<{ name: string; move: Moves }>([
      { name: "Teleport", move: Moves.TELEPORT },
      { name: "Whirlwind", move: Moves.WHIRLWIND },
      { name: "Roar", move: Moves.ROAR },
      { name: "Dragon Tail", move: Moves.DRAGON_TAIL },
      { name: "Circle Throw", move: Moves.CIRCLE_THROW },
    ])("$name should allow wild pokemon to flee", async ({ move }) => {
      game.override.moveset(move).enemyMoveset(move);
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

      const gengar = game.scene.getEnemyPokemon();
      game.move.select(move);
      game.doSelectPartyPokemon(1);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).not.toContain("BattleEndPhase");
      expect(game.scene.getEnemyPokemon()).toBe(gengar);
    });

    it.each<{ name: string; move?: Moves; enemyMove?: Moves }>([
      { name: "U-Turn", move: Moves.U_TURN },
      { name: "Flip Turn", move: Moves.FLIP_TURN },
      { name: "Volt Switch", move: Moves.VOLT_SWITCH },
      // TODO: Enable once Parting shot is fixed
      // {name: "Parting Shot", move: Moves.PARTING_SHOT},
      { name: "Dragon Tail", enemyMove: Moves.DRAGON_TAIL },
      { name: "Circle Throw", enemyMove: Moves.CIRCLE_THROW },
    ])(
      "$name should not fail if no valid switch out target is found",
      async ({ move = Moves.SPLASH, enemyMove = Moves.SPLASH }) => {
        game.override.moveset(move).enemyMoveset(enemyMove);
        await game.classicMode.startBattle([Species.RAICHU]);

        game.move.select(move);
        game.doSelectPartyPokemon(1);
        await game.toNextTurn();

        expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
        expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].result).toBe(MoveResult.MISS);
      },
    );

    it.each<{ name: string; move?: Moves; enemyMove?: Moves }>([
      { name: "Teleport", move: Moves.TELEPORT },
      { name: "Baton Pass", move: Moves.BATON_PASS },
      { name: "Shed Tail", move: Moves.SHED_TAIL },
      { name: "Roar", enemyMove: Moves.ROAR },
      { name: "Whirlwind", enemyMove: Moves.WHIRLWIND },
    ])(
      "$name should fail if no valid switch out target is found",
      async ({ move = Moves.SPLASH, enemyMove = Moves.SPLASH }) => {
        game.override.moveset(move).enemyMoveset(enemyMove);
        await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

        // reset species override so we get a different species
        game.override.enemySpecies(Species.ARBOK);

        game.move.select(move);
        game.doSelectPartyPokemon(1);

        await game.toNextTurn();

        expect(game.phaseInterceptor.log).not.toContain("BattleEndPhase");
        expect(game.scene.getEnemyPokemon()!.species.speciesId).toBe(Species.GENGAR);
      },
    );

    describe("Baton Pass", () => {
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
          .enemySpecies(Species.MAGIKARP)
          .enemyAbility(Abilities.BALL_FETCH)
          .moveset([Moves.BATON_PASS, Moves.NASTY_PLOT, Moves.SPLASH, Moves.SUBSTITUTE])
          .ability(Abilities.BALL_FETCH)
          .enemyMoveset(Moves.SPLASH)
          .disableCrits();
      });

      it("should pass the user's stat stages and BattlerTags to an ally", async () => {
        await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

        game.move.select(Moves.NASTY_PLOT);
        await game.toNextTurn();

        const [raichu, shuckle] = game.scene.getPlayerParty();
        expect(raichu.getStatStage(Stat.SPATK)).toEqual(2);

        game.move.select(Moves.SUBSTITUTE);
        await game.toNextTurn();

        expect(raichu.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();

        game.move.select(Moves.BATON_PASS);
        game.doSelectPartyPokemon(1);
        await game.phaseInterceptor.to("TurnEndPhase");

        expect(game.scene.getPlayerPokemon()).toBe(shuckle);
        expect(shuckle.getStatStage(Stat.SPATK)).toEqual(2);
        expect(shuckle.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      });

      it("should pass stat stages when used by enemy trainers", async () => {
        game.override.battleType(BattleType.TRAINER).enemyMoveset([Moves.NASTY_PLOT, Moves.BATON_PASS]);
        await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

        const enemy = game.scene.getEnemyPokemon()!;

        // round 1 - ai buffs
        game.move.select(Moves.SPLASH);
        await game.forceEnemyMove(Moves.NASTY_PLOT);
        await game.toNextTurn();

        game.move.select(Moves.SPLASH);
        await game.forceEnemyMove(Moves.BATON_PASS);
        await game.toNextTurn();

        // check buffs are still there
        const newEnemy = game.scene.getEnemyPokemon()!;
        expect(newEnemy).not.toBe(enemy);
        expect(newEnemy.getStatStage(Stat.SPATK)).toBe(2);
        expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      });

      it("should not transfer non-transferrable effects", async () => {
        game.override.enemyMoveset([Moves.SALT_CURE]);
        await game.classicMode.startBattle([Species.PIKACHU, Species.FEEBAS]);

        const [player1, player2] = game.scene.getPlayerParty();

        game.move.select(Moves.BATON_PASS);
        await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

        // enemy salt cure
        await game.phaseInterceptor.to("MoveEndPhase");
        expect(player1.getTag(BattlerTagType.SALT_CURED)).toBeDefined();

        game.doSelectPartyPokemon(1);
        await game.toNextTurn();

        expect(player1.isOnField()).toBe(false);
        expect(player2.isOnField()).toBe(true);
        expect(player2.getTag(BattlerTagType.SALT_CURED)).toBeUndefined();
      });

      it("removes the user's binding effects", async () => {
        game.override.moveset([Moves.FIRE_SPIN, Moves.BATON_PASS]);

        await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

        const enemy = game.scene.getEnemyPokemon()!;

        game.move.select(Moves.FIRE_SPIN);
        await game.move.forceHit();
        await game.toNextTurn();

        expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeDefined();

        game.move.select(Moves.BATON_PASS);
        game.doSelectPartyPokemon(1);
        await game.toNextTurn();

        expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeUndefined();
      });
    });
  });

  describe("Baton Pass", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .battleStyle("single")
        .enemySpecies(Species.MAGIKARP)
        .enemyAbility(Abilities.BALL_FETCH)
        .moveset([Moves.BATON_PASS, Moves.NASTY_PLOT, Moves.SPLASH, Moves.SUBSTITUTE])
        .ability(Abilities.BALL_FETCH)
        .enemyMoveset(Moves.SPLASH)
        .disableCrits();
    });

    it("should pass the user's stat stages and BattlerTags to an ally", async () => {
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

      game.move.select(Moves.NASTY_PLOT);
      await game.toNextTurn();

      const [raichu, shuckle] = game.scene.getPlayerParty();
      expect(raichu.getStatStage(Stat.SPATK)).toEqual(2);

      game.move.select(Moves.SUBSTITUTE);
      await game.toNextTurn();

      expect(raichu.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();

      game.move.select(Moves.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerPokemon()).toBe(shuckle);
      expect(shuckle.getStatStage(Stat.SPATK)).toEqual(2);
      expect(shuckle.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    });

    it("should pass stat stages when used by enemy trainers", async () => {
      game.override.battleType(BattleType.TRAINER).enemyMoveset([Moves.NASTY_PLOT, Moves.BATON_PASS]);
      await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

      const enemy = game.scene.getEnemyPokemon()!;

      // round 1 - ai buffs
      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.NASTY_PLOT);
      await game.toNextTurn();

      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.BATON_PASS);
      await game.toNextTurn();

      // check buffs are still there
      const newEnemy = game.scene.getEnemyPokemon()!;
      expect(newEnemy).not.toBe(enemy);
      expect(newEnemy.getStatStage(Stat.SPATK)).toBe(2);
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    });

    it("should not transfer non-transferrable effects", async () => {
      game.override.enemyMoveset([Moves.SALT_CURE]);
      await game.classicMode.startBattle([Species.PIKACHU, Species.FEEBAS]);

      const [player1, player2] = game.scene.getPlayerParty();

      game.move.select(Moves.BATON_PASS);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

      // enemy salt cure
      await game.phaseInterceptor.to("MoveEndPhase");
      expect(player1.getTag(BattlerTagType.SALT_CURED)).toBeDefined();

      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(player1.isOnField()).toBe(false);
      expect(player2.isOnField()).toBe(true);
      expect(player2.getTag(BattlerTagType.SALT_CURED)).toBeUndefined();
    });

    it("removes the user's binding effects", async () => {
      game.override.moveset([Moves.FIRE_SPIN, Moves.BATON_PASS]);

      await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

      const enemy = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.FIRE_SPIN);
      await game.move.forceHit();
      await game.toNextTurn();

      expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeDefined();

      game.move.select(Moves.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeUndefined();
    });
  });

  describe("Shed Tail", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .moveset(Moves.SHED_TAIL)
        .battleStyle("single")
        .enemySpecies(Species.SNORLAX)
        .enemyAbility(Abilities.BALL_FETCH)
        .enemyMoveset(Moves.SPLASH);
    });

    it("should consume 50% of the user's max HP (rounded up) to transfer a 25% HP Substitute doll", async () => {
      await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

      const magikarp = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SHED_TAIL);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      const feebas = game.scene.getPlayerPokemon()!;
      expect(feebas).not.toBe(magikarp);
      expect(feebas.hp).toBe(feebas.getMaxHp());

      const substituteTag = feebas.getTag(SubstituteTag)!;
      expect(substituteTag).toBeDefined();

      // Note: Altered the test to be consistent with the correct HP cost :yipeevee_static:
      expect(magikarp.getInverseHp()).toBe(Math.ceil(magikarp.getMaxHp() / 2));
      expect(substituteTag.hp).toBe(Math.ceil(magikarp.getMaxHp() / 4));
    });

    it("should fail if user's HP is insufficient", async () => {
      await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

      const magikarp = game.scene.getPlayerPokemon()!;
      magikarp.hp = Math.floor(magikarp.getMaxHp() / 2 - 1);

      game.move.select(Moves.SHED_TAIL);
      await game.phaseInterceptor.to("TurnEndPhase", false);

      expect(magikarp.isOnField()).toBe(true);
      expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(magikarp.hp).toBe(magikarp.getMaxHp() / 2 - 1);
    });
  });
});
