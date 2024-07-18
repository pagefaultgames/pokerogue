import { initAbilities } from "#app/data/ability";
import { initBiomes } from "#app/data/biomes";
import { initTrainerTypeDialogue } from "#app/data/dialogue";
import { initEggMoves } from "#app/data/egg-moves";
import { initMoves } from "#app/data/move";
import { initPokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initAchievements } from "#app/system/achv";
import { Biome } from "#enums/biome";
import { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";
import { legacyUiAtlases, legacyUiImages } from "./assets/images/ui/legacy/legacy-ui-assets";
import { legacyUiWindowImages } from "./assets/images/ui/legacy/windows/legacy-ui-window-assets";
import { uiAtlases, uiImages } from "./assets/images/ui/ui-assets";
import { uiWindowImages } from "./assets/images/ui/windows/ui-window-assets";
import { initChallenges } from "./data/challenge";
import { trainerConfigs } from "./data/trainer-config";
import { GachaType } from "./enums/gacha-types";
import { getBiomeHasProps } from "./field/arena";
import CacheBustedLoaderPlugin from "./plugins/cache-busted-loader-plugin";
import { initI18n } from "./plugins/i18n";
import { SceneBase } from "./scene-base";
import { initVouchers } from "./system/voucher";
import { isMobile } from "./touch-controls";
import { initStatsKeys } from "./ui/game-stats-ui-handler";
import * as Utils from "./utils";

export class LoadingScene extends SceneBase {
  readonly LOAD_EVENTS = Phaser.Loader.Events;

  constructor() {
    super("loading");

    Phaser.Plugins.PluginCache.register("Loader", CacheBustedLoaderPlugin, "load");
    initI18n();
  }

  preload() {
    Utils.localPing();
    this.load["manifest"] = this.game["manifest"];

    this.loadImage("loading_bg", "arenas");
    this.loadImage("logo", "");
    // this.loadImage("pride-update", "events");

    //load ui images
    Object.entries(uiImages).forEach(([key, img]) => {
      const legacyImg = legacyUiImages[`${key}_legacy`];
      this.loadImageAsset(key, img, legacyImg);
    });

    // load ui atlases
    Object.entries(uiAtlases).forEach(([key, [img, json]]) => {
      const [legacyImg, legacyJson] = legacyUiAtlases[`${key}_legacy`] ?? [undefined, undefined];
      this.loadAtlasAsset(key, String(img), json, legacyImg, legacyJson);
    });

    // Load window images
    Object.entries(uiWindowImages).forEach(([key, img]) => {
      const legacyAsset = legacyUiWindowImages[`${key}_legacy`];
      this.loadImageAsset(key, img, legacyAsset);
    });

    this.loadImage("default_bg", "arenas");
    // Load arena images
    Utils.getEnumValues(Biome).map((bt) => {
      const btKey = Biome[bt].toLowerCase();
      const isBaseAnimated = btKey === "end";
      const baseAKey = `${btKey}_a`;
      const baseBKey = `${btKey}_b`;
      this.loadImage(`${btKey}_bg`, "arenas");
      if (!isBaseAnimated) {
        this.loadImage(baseAKey, "arenas");
      } else {
        this.loadAtlas(baseAKey, "arenas");
      }
      if (!isBaseAnimated) {
        this.loadImage(baseBKey, "arenas");
      } else {
        this.loadAtlas(baseBKey, "arenas");
      }
      if (getBiomeHasProps(bt)) {
        for (let p = 1; p <= 3; p++) {
          const isPropAnimated = p === 3 && ["power_plant", "end"].find((b) => b === btKey);
          const propKey = `${btKey}_b_${p}`;
          if (!isPropAnimated) {
            this.loadImage(propKey, "arenas");
          } else {
            this.loadAtlas(propKey, "arenas");
          }
        }
      }
    });

    // Load bitmap fonts
    this.load.bitmapFont("item-count", "fonts/item-count.png", "fonts/item-count.xml");

    // Load trainer images
    this.loadAtlas("trainer_m_back", "trainer");
    this.loadAtlas("trainer_m_back_pb", "trainer");
    this.loadAtlas("trainer_f_back", "trainer");
    this.loadAtlas("trainer_f_back_pb", "trainer");

    Utils.getEnumValues(TrainerType).map((tt) => {
      const config = trainerConfigs[tt];
      this.loadAtlas(config.getSpriteKey(), "trainer");
      if (config.doubleOnly || config.hasDouble) {
        this.loadAtlas(config.getSpriteKey(true), "trainer");
      }
    });

    // Load character sprites
    this.loadAtlas("c_rival_m", "character", "rival_m");
    this.loadAtlas("c_rival_f", "character", "rival_f");

    // Load pokemon-related images
    this.loadImage("pkmn__back__sub", "pokemon/back", "sub.png");
    this.loadImage("pkmn__sub", "pokemon", "sub.png");
    this.loadAtlas("battle_stats", "effects");
    this.loadAtlas("shiny", "effects");
    this.loadAtlas("shiny_2", "effects");
    this.loadAtlas("shiny_3", "effects");
    this.loadImage("tera", "effects");
    this.loadAtlas("pb_particles", "effects");
    this.loadImage("evo_sparkle", "effects");
    this.loadAtlas("tera_sparkle", "effects");
    this.load.video("evo_bg", "images/effects/evo_bg.mp4", true);

    this.loadAtlas("pb", "");
    this.loadAtlas("items", "");
    this.loadAtlas("types", "");

    // Get current lang and load the types atlas for it. English will only load types while all other languages will load types and types_<lang>
    const lang = i18next.resolvedLanguage;
    if (lang !== "en") {
      if (Utils.verifyLang(lang)) {
        this.loadAtlas(`types_${lang}`, "");
      } else {
        // Fallback to English
        this.loadAtlas("types", "");
      }
    } else {
      this.loadAtlas("types", "");
    }

    this.loadAtlas("statuses", "");
    this.loadAtlas("categories", "");

    this.loadAtlas("egg", "egg");
    this.loadAtlas("egg_crack", "egg");
    this.loadAtlas("egg_icons", "egg");
    this.loadAtlas("egg_shard", "egg");
    this.loadAtlas("egg_lightrays", "egg");
    Utils.getEnumKeys(GachaType).forEach((gt) => {
      const key = gt.toLowerCase();
      this.loadImage(`gacha_${key}`, "egg");
      this.loadAtlas(`gacha_underlay_${key}`, "egg");
    });
    this.loadImage("gacha_glass", "egg");
    this.loadImage("gacha_eggs", "egg");
    this.loadAtlas("gacha_hatch", "egg");
    this.loadImage("gacha_knob", "egg");

    this.loadImage("egg_list_bg", "ui");

    this.loadImage("end_m", "cg");
    this.loadImage("end_f", "cg");

    for (let i = 0; i < 10; i++) {
      this.loadAtlas(`pokemon_icons_${i}`, "");
      if (i) {
        this.loadAtlas(`pokemon_icons_${i}v`, "");
      }
    }

    this.loadAtlas("dualshock", "inputs");
    this.loadAtlas("xbox", "inputs");
    this.loadAtlas("keyboard", "inputs");

    this.loadSe("select");
    this.loadSe("menu_open");
    this.loadSe("hit");
    this.loadSe("hit_strong");
    this.loadSe("hit_weak");
    this.loadSe("stat_up");
    this.loadSe("stat_down");
    this.loadSe("faint");
    this.loadSe("flee");
    this.loadSe("low_hp");
    this.loadSe("exp");
    this.loadSe("level_up");
    this.loadSe("sparkle");
    this.loadSe("restore");
    this.loadSe("shine");
    this.loadSe("shing");
    this.loadSe("charge");
    this.loadSe("beam");
    this.loadSe("upgrade");
    this.loadSe("buy");
    this.loadSe("achv");
    this.loadSe("error");

    this.loadSe("pb_rel");
    this.loadSe("pb_throw");
    this.loadSe("pb_bounce_1");
    this.loadSe("pb_bounce_2");
    this.loadSe("pb_move");
    this.loadSe("pb_catch");
    this.loadSe("pb_lock");

    this.loadSe("pb_tray_enter");
    this.loadSe("pb_tray_ball");
    this.loadSe("pb_tray_empty");

    this.loadSe("egg_crack");
    this.loadSe("egg_hatch");
    this.loadSe("gacha_dial");
    this.loadSe("gacha_running");
    this.loadSe("gacha_dispense");

    this.loadSe("PRSFX- Transform", "battle_anims");

    this.loadBgm("menu");

    this.loadBgm("level_up_fanfare", "bw/level_up_fanfare.mp3");
    this.loadBgm("item_fanfare", "bw/item_fanfare.mp3");
    this.loadBgm("minor_fanfare", "bw/minor_fanfare.mp3");
    this.loadBgm("heal", "bw/heal.mp3");
    this.loadBgm("victory_trainer", "bw/victory_trainer.mp3");
    this.loadBgm("victory_team_plasma", "bw/victory_team_plasma.mp3");
    this.loadBgm("victory_gym", "bw/victory_gym.mp3");
    this.loadBgm("victory_champion", "bw/victory_champion.mp3");
    this.loadBgm("evolution", "bw/evolution.mp3");
    this.loadBgm("evolution_fanfare", "bw/evolution_fanfare.mp3");

    this.load.plugin("rextexteditplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rextexteditplugin.min.js", true);

    this.loadLoadingScreen();

    initVouchers();
    initAchievements();
    initStatsKeys();
    initPokemonPrevolutions();
    initBiomes();
    initEggMoves();
    initPokemonForms();
    initTrainerTypeDialogue();
    initSpecies();
    initMoves();
    initAbilities();
    initChallenges();
  }

  loadLoadingScreen() {
    const mobile = isMobile();

    const loadingGraphics: any[] = [];

    const bg = this.add.image(0, 0, "");
    bg.setOrigin(0, 0);
    bg.setScale(6);
    bg.setVisible(false);

    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0xff00ff, 1).setDepth(10);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.lineStyle(5, 0xff00ff, 1.0);
    progressBox.fillStyle(0x222222, 0.8);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const midWidth = width / 2;
    const midHeight = height / 2;

    const logo = this.add.image(midWidth, 240, "");
    logo.setVisible(false);
    logo.setOrigin(0.5, 0.5);
    logo.setScale(4);

    const percentText = this.make.text({
      x: midWidth,
      y: midHeight - 24,
      text: "0%",
      style: {
        font: "72px emerald",
        color: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: midWidth,
      y: midHeight + 48,
      text: "",
      style: {
        font: "48px emerald",
        color: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    const disclaimerText = this.make.text({
      x: midWidth,
      y: assetText.y + 152,
      text: i18next.t("menu:disclaimer"),
      style: {
        font: "72px emerald",
        color: "#DA3838",
      },
    });
    disclaimerText.setOrigin(0.5, 0.5);

    const disclaimerDescriptionText = this.make.text({
      x: midWidth,
      y: disclaimerText.y + 120,
      text: i18next.t("menu:disclaimerDescription"),
      style: {
        font: "48px emerald",
        color: "#ffffff",
        align: "center",
      },
    });
    disclaimerDescriptionText.setOrigin(0.5, 0.5);

    loadingGraphics.push(bg, graphics, progressBar, progressBox, logo, percentText, assetText, disclaimerText, disclaimerDescriptionText);

    if (!mobile) {
      loadingGraphics.map((g) => g.setVisible(false));
    }

    const intro = this.add.video(0, 0);
    intro.on(Phaser.GameObjects.Events.VIDEO_COMPLETE, (video: Phaser.GameObjects.Video) => {
      this.tweens.add({
        targets: intro,
        duration: 500,
        alpha: 0,
        ease: "Sine.easeIn",
        onComplete: () => video.destroy(),
      });
      loadingGraphics.forEach((g) => g.setVisible(true));
    });
    intro.setOrigin(0, 0);
    intro.setScale(3);

    this.load.once(this.LOAD_EVENTS.START, () => {
      // videos do not need to be preloaded
      intro.loadURL("images/intro_dark.mp4", true);
      if (mobile) {
        intro.video.setAttribute("webkit-playsinline", "webkit-playsinline");
        intro.video.setAttribute("playsinline", "playsinline");
      }
      intro.play();
    });

    this.load.on(this.LOAD_EVENTS.PROGRESS, (progress: number) => {
      percentText.setText(`${Math.floor(progress * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 0.8);
      progressBar.fillRect(midWidth - 320, 360, 640 * progress, 64);
    });

    this.load.on(this.LOAD_EVENTS.FILE_COMPLETE, (key: string) => {
      assetText.setText(i18next.t("menu:loadingAsset", { assetName: key }));
      switch (key) {
      case "loading_bg":
        bg.setTexture("loading_bg");
        if (mobile) {
          bg.setVisible(true);
        }
        break;
      case "logo":
        logo.setTexture("logo");
        if (mobile) {
          logo.setVisible(true);
        }
        break;
      }
    });

    this.load.on(this.LOAD_EVENTS.COMPLETE, () => loadingGraphics.forEach((go) => go.destroy()));
  }

  get gameHeight() {
    return this.game.config.height as number;
  }

  get gameWidth() {
    return this.game.config.width as number;
  }

  async create() {
    this.scene.start("battle");
  }
}
