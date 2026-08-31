import { allHeldItems } from "#data/data-lists";
import { PokemonMove } from "#data/moves/pokemon-move";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { type BattleStat, EFFECTIVE_STATS, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Held Berries", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Sets the player's HP to the given ratio and runs a turn where the enemy does nothing.
   * @returns The player pokemon after the turn has resolved up to (but not including) TurnEndPhase
   */
  async function runBerryTurn(hpRatio: number) {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.hp = Phaser.Math.Clamp(Math.floor(player.getMaxHp() * hpRatio), 1, player.getMaxHp());

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn(false);

    return player;
  }

  describe("Sitrus Berry", () => {
    const sitrus = HeldItemId.SITRUS_BERRY;

    it("should heal 25% of max HP when below half HP and be consumed", async () => {
      game.override.startingHeldItems([{ entry: sitrus }]);
      const player = await runBerryTurn(0.3);

      const expectedHeal = toDmgValue(player.getMaxHp() / 4);
      expect(player.hp).toBe(Math.floor(player.getMaxHp() * 0.3) + expectedHeal);
      expect(player).not.toHaveHeldItem(sitrus);
    });

    it("should not activate when above half HP", async () => {
      game.override.startingHeldItems([{ entry: sitrus }]);
      const player = await runBerryTurn(0.9);

      expect(player.hp).toBe(Math.floor(player.getMaxHp() * 0.9));
      expect(player).toHaveHeldItem(sitrus);
    });
  });

  describe("Lum Berry", () => {
    const lum = HeldItemId.LUM_BERRY;

    it.each([
      StatusEffect.PARALYSIS,
      StatusEffect.SLEEP,
      StatusEffect.FREEZE,
      StatusEffect.POISON,
      StatusEffect.TOXIC,
      StatusEffect.BURN,
    ])("should cure %s status and be consumed", async status => {
      game.override.startingHeldItems([{ entry: lum }]).statusEffect(status);

      await game.classicMode.startBattle(SpeciesId.MAGIKARP);
      const player = game.field.getPlayerPokemon();
      expect(player.status?.effect).toBe(status);
      if (status === StatusEffect.FREEZE) {
        // Freeze override has no thaw counter and ends up immediately naturally thawing
        player.status = new Status(StatusEffect.FREEZE, 0, 0, 3);
      }

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn(false);

      expect(player.status).toBeNull();
      expect(player).not.toHaveHeldItem(lum);
    });

    it("should cure confusion and be consumed", async () => {
      game.override.startingHeldItems([{ entry: lum }]);

      await game.classicMode.startBattle(SpeciesId.MAGIKARP);
      const player = game.field.getPlayerPokemon();
      player.addTag(BattlerTagType.CONFUSED, 3);
      expect(player.getTag(BattlerTagType.CONFUSED)).toBeDefined();

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn(false);

      expect(player.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
      expect(player).not.toHaveHeldItem(lum);
    });
  });

  describe("Enigma Berry", () => {
    const enigma = HeldItemId.ENIGMA_BERRY;

    it("should heal 25% of max HP after being hit by a super-effective move", async () => {
      game.override.startingHeldItems([{ entry: enigma }]).enemyMoveset(MoveId.THUNDERBOLT);

      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      const hpBefore = player.hp;

      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn(false);

      expect(player.turnData.attacksReceived).toHaveLength(1);
      const damageTaken = player.turnData.attacksReceived[0].damage;
      expect(damageTaken).toBeGreaterThan(0);
      expect(player.hp).toBe(hpBefore - damageTaken + toDmgValue(player.getMaxHp() / 4));
      expect(player).not.toHaveHeldItem(enigma);
    });
  });

  describe("Stat-boosting berries", () => {
    it.each([
      { item: HeldItemId.LIECHI_BERRY, stat: Stat.ATK },
      { item: HeldItemId.GANLON_BERRY, stat: Stat.DEF },
      { item: HeldItemId.PETAYA_BERRY, stat: Stat.SPATK },
      { item: HeldItemId.APICOT_BERRY, stat: Stat.SPDEF },
      { item: HeldItemId.SALAC_BERRY, stat: Stat.SPD },
    ])("$item should raise $stat by 1 stage when below 1/4 HP", async ({ item, stat }) => {
      game.override.startingHeldItems([{ entry: item }]);
      const player = await runBerryTurn(0.2);

      expect(player.getStatStage(stat as BattleStat)).toBe(1);
      expect(player).not.toHaveHeldItem(item);
    });

    it.each([
      HeldItemId.LIECHI_BERRY,
      HeldItemId.GANLON_BERRY,
    ])("%s should not activate when above 1/4 HP", async item => {
      game.override.startingHeldItems([{ entry: item }]);
      const player = await runBerryTurn(0.9);

      expect(player).toHaveHeldItem(item);
    });
  });

  describe("Lansat Berry", () => {
    it("should grant a heightened crit rate when below 1/4 HP", async () => {
      game.override.startingHeldItems([{ entry: HeldItemId.LANSAT_BERRY }]);
      const player = await runBerryTurn(0.2);

      expect(player).toHaveBattlerTag(BattlerTagType.CRIT_BOOST);
      expect(player).not.toHaveHeldItem(HeldItemId.LANSAT_BERRY);
    });

    it("should not activate when above 1/4 HP", async () => {
      game.override.startingHeldItems([{ entry: HeldItemId.LANSAT_BERRY }]);
      const player = await runBerryTurn(0.9);

      expect(player).toHaveHeldItem(HeldItemId.LANSAT_BERRY);
    });
  });

  describe("Starf Berry", () => {
    it("should raise a random stat by 2 stages when below 1/4 HP", async () => {
      game.override.startingHeldItems([{ entry: HeldItemId.STARF_BERRY }]);
      const player = await runBerryTurn(0.2);

      const totalStages = EFFECTIVE_STATS.reduce(
        (sum, stat) => sum + Phaser.Math.Clamp(player.getStatStage(stat), 0, 6),
        0,
      );
      expect(totalStages).toBe(2);
      expect(player).not.toHaveHeldItem(HeldItemId.STARF_BERRY);
    });
  });

  describe("Leppa Berry", () => {
    // This is done jankily because PP usage isn't stable with moveset overrides
    async function prepareLeppaHolder(ppUsedRatio: number) {
      game.override.startingHeldItems([{ entry: HeldItemId.LEPPA_BERRY }]);
      await game.classicMode.startBattle(SpeciesId.MAGIKARP);

      const player = game.field.getPlayerPokemon();
      const moveset = player.getMoveset();
      const splash = new PokemonMove(MoveId.SPLASH);
      moveset.splice(0, moveset.length, splash);
      splash.ppUsed = Math.ceil(splash.getMovePp() * ppUsedRatio);
      return { player, splash };
    }

    it("should restore 10 PP to a depleted move and be consumed", async () => {
      const { player, splash } = await prepareLeppaHolder(1);

      applySingleHeldItem(HeldItemId.LEPPA_BERRY, HeldItemEffect.BERRY, { pokemon: player });

      expect(player).toHaveUsedPP(MoveId.SPLASH, splash.getMovePp() - 10);
      expect(player).not.toHaveHeldItem(HeldItemId.LEPPA_BERRY);
    });

    it("should not activate while no move is fully depleted", async () => {
      const { player } = await prepareLeppaHolder(0.5);

      const leppa = allHeldItems[HeldItemId.LEPPA_BERRY];
      expect(leppa.getAttrs(HeldItemEffect.BERRY)[0].shouldApply({ pokemon: player })).toBe(false);
      expect(player).not.toHaveUsedPP(MoveId.SPLASH, 0);
    });
  });

  it("should use berries held by enemy pokemon as well", async () => {
    game.override.enemyHeldItems([{ entry: HeldItemId.SITRUS_BERRY }]);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = Math.floor(enemy.getMaxHp() * 0.3);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn(false);

    expect(enemy).not.toHaveHeldItem(HeldItemId.SITRUS_BERRY);
  });
});
