import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {MoneyAchv, Achv, AchvTier, RibbonAchv, DamageAchv, HealAchv, LevelAchv, ModifierAchv, achvs} from "#app/system/achv";
import BattleScene from "../../battle-scene";
import { IntegerHolder, NumberHolder } from "#app/utils.js";
import { TurnHeldItemTransferModifier } from "#app/modifier/modifier.js";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";

describe("check some Achievement related stuff", () => {
  it ("should check Achievement creation", () => {
    const ach = new MoneyAchv("", "Achievement", 1000, null, 100);
    expect(ach.name).toBe("Achievement");
  });
});


describe("Achv", () => {
  let achv: Achv;

  beforeEach(() => {
    achv = new Achv("", "Test Achievement", "This is a test achievement", "test_icon", 10);
  });

  it("should have the correct name", () => {
    expect(achv.getDescription()).toBe("This is a test achievement");
  });

  it("should have the correct icon image", () => {
    expect(achv.getIconImage()).toBe("test_icon");
  });

  it("should set the achievement as secret", () => {
    achv.setSecret();
    expect(achv.secret).toBe(true);
    expect(achv.hasParent).toBe(false);

    achv.setSecret(true);
    expect(achv.secret).toBe(true);
    expect(achv.hasParent).toBe(true);

    achv.setSecret(false);
    expect(achv.secret).toBe(true);
    expect(achv.hasParent).toBe(false);
  });

  it("should return the correct tier based on the score", () => {
    const achv1 = new Achv("", "Test Achievement 1", "Test Description", "test_icon", 10);
    const achv2 = new Achv("", "Test Achievement 2", "Test Description", "test_icon", 25);
    const achv3 = new Achv("", "Test Achievement 3", "Test Description", "test_icon", 50);
    const achv4 = new Achv("", "Test Achievement 4", "Test Description", "test_icon", 75);
    const achv5 = new Achv("", "Test Achievement 5", "Test Description", "test_icon", 100);

    expect(achv1.getTier()).toBe(AchvTier.COMMON);
    expect(achv2.getTier()).toBe(AchvTier.GREAT);
    expect(achv3.getTier()).toBe(AchvTier.ULTRA);
    expect(achv4.getTier()).toBe(AchvTier.ROGUE);
    expect(achv5.getTier()).toBe(AchvTier.MASTER);
  });

  it("should validate the achievement based on the condition function", () => {
    const conditionFunc = jest.fn((scene: BattleScene, args: any[]) => args[0] === 10);
    const achv = new Achv("", "Test Achievement", "Test Description", "test_icon", 10, conditionFunc);

    expect(achv.validate(new BattleScene(), [5])).toBe(false);
    expect(achv.validate(new BattleScene(), [10])).toBe(true);
    expect(conditionFunc).toHaveBeenCalledTimes(2);
  });
});

describe("MoneyAchv", () => {
  it("should create an instance of MoneyAchv", () => {
    const moneyAchv = new MoneyAchv("", "Test Money Achievement", 10000, "money_icon", 10);
    expect(moneyAchv).toBeInstanceOf(MoneyAchv);
    expect(moneyAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the money amount", () => {
    const moneyAchv = new MoneyAchv("", "Test Money Achievement", 10000, "money_icon", 10);
    const scene = new BattleScene();
    scene.money = 5000;

    expect(moneyAchv.validate(scene, [])).toBe(false);

    scene.money = 15000;
    expect(moneyAchv.validate(scene, [])).toBe(true);
  });
});

describe("RibbonAchv", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([]);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    game = new GameManager(phaserGame);
    scene = game.scene;
  });

  it("should create an instance of RibbonAchv", () => {
    const ribbonAchv = new RibbonAchv("", "Test Ribbon Achievement", 10, "ribbon_icon", 10);
    expect(ribbonAchv).toBeInstanceOf(RibbonAchv);
    expect(ribbonAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the ribbon amount", () => {
    const ribbonAchv = new RibbonAchv("", "Test Ribbon Achievement", 10, "ribbon_icon", 10);
    scene.gameData.gameStats.ribbonsOwned = 5;

    expect(ribbonAchv.validate(scene, [])).toBe(false);

    scene.gameData.gameStats.ribbonsOwned = 15;
    expect(ribbonAchv.validate(scene, [])).toBe(true);
  });
});

describe("DamageAchv", () => {
  it("should create an instance of DamageAchv", () => {
    const damageAchv = new DamageAchv("", "Test Damage Achievement", 250, "damage_icon", 10);
    expect(damageAchv).toBeInstanceOf(DamageAchv);
    expect(damageAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the damage amount", () => {
    const damageAchv = new DamageAchv("", "Test Damage Achievement", 250, "damage_icon", 10);
    const scene = new BattleScene();
    const numberHolder = new NumberHolder(200);

    expect(damageAchv.validate(scene, [numberHolder])).toBe(false);

    numberHolder.value = 300;
    expect(damageAchv.validate(scene, [numberHolder])).toBe(true);
  });
});

describe("HealAchv", () => {
  it("should create an instance of HealAchv", () => {
    const healAchv = new HealAchv("", "Test Heal Achievement", 250, "heal_icon", 10);
    expect(healAchv).toBeInstanceOf(HealAchv);
    expect(healAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the heal amount", () => {
    const healAchv = new HealAchv("", "Test Heal Achievement", 250, "heal_icon", 10);
    const scene = new BattleScene();
    const numberHolder = new NumberHolder(200);

    expect(healAchv.validate(scene, [numberHolder])).toBe(false);

    numberHolder.value = 300;
    expect(healAchv.validate(scene, [numberHolder])).toBe(true);
  });
});

describe("LevelAchv", () => {
  it("should create an instance of LevelAchv", () => {
    const levelAchv = new LevelAchv("", "Test Level Achievement", 100, "level_icon", 10);
    expect(levelAchv).toBeInstanceOf(LevelAchv);
    expect(levelAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the level", () => {
    const levelAchv = new LevelAchv("", "Test Level Achievement", 100, "level_icon", 10);
    const scene = new BattleScene();
    const integerHolder = new IntegerHolder(50);

    expect(levelAchv.validate(scene, [integerHolder])).toBe(false);

    integerHolder.value = 150;
    expect(levelAchv.validate(scene, [integerHolder])).toBe(true);
  });
});

describe("ModifierAchv", () => {
  it("should create an instance of ModifierAchv", () => {
    const modifierAchv = new ModifierAchv("", "Test Modifier Achievement", "Test Description", "modifier_icon", 10, () => true);
    expect(modifierAchv).toBeInstanceOf(ModifierAchv);
    expect(modifierAchv instanceof Achv).toBe(true);
  });

  it("should validate the achievement based on the modifier function", () => {
    const modifierAchv = new ModifierAchv("", "Test Modifier Achievement", "Test Description", "modifier_icon", 10, () => true);
    const scene = new BattleScene();
    const modifier = new TurnHeldItemTransferModifier(null, 3, 1);

    expect(modifierAchv.validate(scene, [modifier])).toBe(true);
  });
});

describe("achvs", () => {
  it("should contain the predefined achievements", () => {
    expect(achvs._10K_MONEY).toBeInstanceOf(MoneyAchv);
    expect(achvs._100K_MONEY).toBeInstanceOf(MoneyAchv);
    expect(achvs._1M_MONEY).toBeInstanceOf(MoneyAchv);
    expect(achvs._10M_MONEY).toBeInstanceOf(MoneyAchv);
    expect(achvs._250_DMG).toBeInstanceOf(DamageAchv);
    expect(achvs._1000_DMG).toBeInstanceOf(DamageAchv);
    expect(achvs._2500_DMG).toBeInstanceOf(DamageAchv);
    expect(achvs._10000_DMG).toBeInstanceOf(DamageAchv);
    expect(achvs._250_HEAL).toBeInstanceOf(HealAchv);
    expect(achvs._1000_HEAL).toBeInstanceOf(HealAchv);
    expect(achvs._2500_HEAL).toBeInstanceOf(HealAchv);
    expect(achvs._10000_HEAL).toBeInstanceOf(HealAchv);
    expect(achvs.LV_100).toBeInstanceOf(LevelAchv);
    expect(achvs.LV_250).toBeInstanceOf(LevelAchv);
    expect(achvs.LV_1000).toBeInstanceOf(LevelAchv);
    expect(achvs._10_RIBBONS).toBeInstanceOf(RibbonAchv);
    expect(achvs._25_RIBBONS).toBeInstanceOf(RibbonAchv);
    expect(achvs._50_RIBBONS).toBeInstanceOf(RibbonAchv);
    expect(achvs._75_RIBBONS).toBeInstanceOf(RibbonAchv);
    expect(achvs._100_RIBBONS).toBeInstanceOf(RibbonAchv);
    expect(achvs.TRANSFER_MAX_BATTLE_STAT).toBeInstanceOf(Achv);
    expect(achvs.MAX_FRIENDSHIP).toBeInstanceOf(Achv);
    expect(achvs.MEGA_EVOLVE).toBeInstanceOf(Achv);
    expect(achvs.GIGANTAMAX).toBeInstanceOf(Achv);
    expect(achvs.TERASTALLIZE).toBeInstanceOf(Achv);
    expect(achvs.STELLAR_TERASTALLIZE).toBeInstanceOf(Achv);
    expect(achvs.SPLICE).toBeInstanceOf(Achv);
    expect(achvs.MINI_BLACK_HOLE).toBeInstanceOf(ModifierAchv);
    expect(achvs.CATCH_MYTHICAL).toBeInstanceOf(Achv);
    expect(achvs.CATCH_SUB_LEGENDARY).toBeInstanceOf(Achv);
    expect(achvs.CATCH_LEGENDARY).toBeInstanceOf(Achv);
    expect(achvs.SEE_SHINY).toBeInstanceOf(Achv);
    expect(achvs.SHINY_PARTY).toBeInstanceOf(Achv);
    expect(achvs.HATCH_MYTHICAL).toBeInstanceOf(Achv);
    expect(achvs.HATCH_SUB_LEGENDARY).toBeInstanceOf(Achv);
    expect(achvs.HATCH_LEGENDARY).toBeInstanceOf(Achv);
    expect(achvs.HATCH_SHINY).toBeInstanceOf(Achv);
    expect(achvs.HIDDEN_ABILITY).toBeInstanceOf(Achv);
    expect(achvs.PERFECT_IVS).toBeInstanceOf(Achv);
    expect(achvs.CLASSIC_VICTORY).toBeInstanceOf(Achv);
  });

  it("should initialize the achievements with IDs and parent IDs", () => {

    expect(achvs._10K_MONEY.id).toBe("_10K_MONEY");
    expect(achvs._10K_MONEY.hasParent).toBe(undefined);
    expect(achvs._100K_MONEY.id).toBe("_100K_MONEY");
    expect(achvs._100K_MONEY.hasParent).toBe(true);
    expect(achvs._100K_MONEY.parentId).toBe("_10K_MONEY");
    expect(achvs._1M_MONEY.id).toBe("_1M_MONEY");
    expect(achvs._1M_MONEY.hasParent).toBe(true);
    expect(achvs._1M_MONEY.parentId).toBe("_100K_MONEY");
    expect(achvs._10M_MONEY.id).toBe("_10M_MONEY");
    expect(achvs._10M_MONEY.hasParent).toBe(true);
    expect(achvs._10M_MONEY.parentId).toBe("_1M_MONEY");
    expect(achvs.LV_100.id).toBe("LV_100");
    expect(achvs.LV_100.hasParent).toBe(false);
    expect(achvs.LV_250.id).toBe("LV_250");
    expect(achvs.LV_250.hasParent).toBe(true);
    expect(achvs.LV_250.parentId).toBe("LV_100");
    expect(achvs.LV_1000.id).toBe("LV_1000");
    expect(achvs.LV_1000.hasParent).toBe(true);
    expect(achvs.LV_1000.parentId).toBe("LV_250");
  });
});
