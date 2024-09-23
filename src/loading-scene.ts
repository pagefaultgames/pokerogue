import { GachaType } from "./enums/gacha-types";
import { getBiomeHasProps } from "./field/arena";
import CacheBustedLoaderPlugin from "./plugins/cache-busted-loader-plugin";
import { SceneBase } from "./scene-base";
import { WindowVariant, getWindowVariantSuffix } from "./ui/ui-theme";
import { isMobile } from "./touch-controls";
import * as Utils from "./utils";
import { initI18n } from "./plugins/i18n";
import { initPokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { initBiomes } from "#app/data/biomes";
import { initEggMoves } from "#app/data/egg-moves";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initMoves } from "#app/data/move";
import { initAbilities } from "#app/data/ability";
import { initAchievements } from "#app/system/achv";
import { initTrainerTypeDialogue } from "#app/data/dialogue";
import { initChallenges } from "./data/challenge";
import i18next from "i18next";
import { initStatsKeys } from "./ui/game-stats-ui-handler";
import { initVouchers } from "./system/voucher";
import { Biome } from "#enums/biome";
import {initMysteryEncounters} from "#app/data/mystery-encounters/mystery-encounters";
import { allDefaultAtlasAssets, allDefaultBgmAssets, allDefaultImageAssets, allDefaultSeAssets } from "#app/default-assets";

export class LoadingScene extends SceneBase {
  public static readonly KEY = "loading";

  readonly LOAD_EVENTS = Phaser.Loader.Events;

  constructor() {
    super(LoadingScene.KEY);

    Phaser.Plugins.PluginCache.register("Loader", CacheBustedLoaderPlugin, "load");
    initI18n();
  }

  preload() {
    this.logPartitionedStorageSize();
    Utils.localPing();
    this.load["manifest"] = this.game["manifest"];

    for (const key of allDefaultSeAssets.keys()) {
      this.loadSe(key, allDefaultSeAssets.get(key));
    }

    for (const key of allDefaultBgmAssets.keys()) {
      this.loadBgm(key, allDefaultBgmAssets.get(key));
    }

    for (const key of allDefaultImageAssets.keys()) {
      const val = allDefaultImageAssets.get(key);
      if (val instanceof Array) {
        this.loadImage(key, val[0], val[1]);
      } else if (val !== undefined) {
        this.loadImage(key, val);
      }
    }

    for (const key of allDefaultAtlasAssets.keys()) {
      const val = allDefaultAtlasAssets.get(key);
      if (val instanceof Array) {
        this.loadAtlas(key, val[0], val[1]);
      } else if (val !== undefined) {
        this.loadAtlas(key, val);
      }
    }

    // UI windows
    for (const wv of Utils.getEnumValues(WindowVariant)) {
      for (let w = 1; w <= 5; w++) {
        const key = `window_${w}${getWindowVariantSuffix(wv)}`;
        allDefaultImageAssets.set(key, "ui/windows");
        this.loadImage(key, "ui/windows");
      }
    }

    // Summary screen tabs
    for (let t = 1; t <= 3; t++) {
      const key = `summary_tabs_${t}`;
      allDefaultImageAssets.set(key, "ui");
      this.loadImage(key, "ui");
    }

    // Load arena images
    Utils.getEnumValues(Biome).map(bt => {
      const btKey = Biome[bt].toLowerCase();
      const isBaseAnimated = btKey === "end";
      const baseAKey = `${btKey}_a`;
      const baseBKey = `${btKey}_b`;
      allDefaultImageAssets.set(`${btKey}_bg`, "arenas");
      this.loadImage(`${btKey}_bg`, "arenas");
      if (!isBaseAnimated) {
        allDefaultImageAssets.set(baseAKey, "arenas");
        this.loadImage(baseAKey, "arenas");
      } else {
        allDefaultAtlasAssets.set(baseAKey, "arenas");
        this.loadAtlas(baseAKey, "arenas");
      }
      if (!isBaseAnimated) {
        allDefaultImageAssets.set(baseBKey, "arenas");
        this.loadImage(baseBKey, "arenas");
      } else {
        allDefaultAtlasAssets.set(baseBKey, "arenas");
        this.loadAtlas(baseBKey, "arenas");
      }
      if (getBiomeHasProps(bt)) {
        for (let p = 1; p <= 3; p++) {
          const isPropAnimated = p === 3 && [ "power_plant", "end" ].find(b => b === btKey);
          const propKey = `${btKey}_b_${p}`;
          if (!isPropAnimated) {
            allDefaultImageAssets.set(propKey, "arenas");
            this.loadImage(propKey, "arenas");
          } else {
            allDefaultAtlasAssets.set(propKey, "arenas");
            this.loadAtlas(propKey, "arenas");
          }
        }
      }
    });

    // Load bitmap fonts
    allDefaultAtlasAssets.set("item-count", "");
    this.load.bitmapFont("item-count", "fonts/item-count.png", "fonts/item-count.xml");

    this.load.video("evo_bg", "images/effects/evo_bg.mp4", true);

    // Get current lang and load the types atlas for it. English will only load types while all other languages will load types and types_<lang>
    const lang = i18next.resolvedLanguage;
    if (lang !== "en") {
      if (Utils.verifyLang(lang)) {
        allDefaultAtlasAssets.set(`statuses_${lang}`, "");
        allDefaultAtlasAssets.set(`types_${lang}`, "");
        this.loadAtlas(`statuses_${lang}`, "");
        this.loadAtlas(`types_${lang}`, "");
      } else {
        // Fallback to English
        allDefaultAtlasAssets.set("statuses", "");
        allDefaultAtlasAssets.set("types", "");
        this.loadAtlas("statuses", "");
        this.loadAtlas("types", "");
      }
    } else {
      allDefaultAtlasAssets.set("statuses", "");
      allDefaultAtlasAssets.set("types", "");
      this.loadAtlas("statuses", "");
      this.loadAtlas("types", "");
    }
    const availableLangs = ["en", "de", "it", "fr", "ja", "ko", "es", "pt-BR", "zh-CN"];
    if (lang && availableLangs.includes(lang)) {
      const key = "egg-update_"+lang;
      allDefaultImageAssets.set(key, "events");
      this.loadImage(key, "events");
    } else {
      allDefaultImageAssets.set("egg-update_en", "events");
      this.loadImage("egg-update_en", "events");
    }

    // Gacha UI
    Utils.getEnumKeys(GachaType).forEach(gt => {
      const key = gt.toLowerCase();
      allDefaultImageAssets.set(`gacha_${key}`, "egg");
      allDefaultAtlasAssets.set(`gacha_underlay_${key}`, "egg");
      this.loadImage(`gacha_${key}`, "egg");
      this.loadAtlas(`gacha_underlay_${key}`, "egg");
    });

    for (let i = 0; i < 10; i++) {
      allDefaultAtlasAssets.set(`pokemon_icons_${i}`, "");
      this.loadAtlas(`pokemon_icons_${i}`, "");
      if (i) {
        allDefaultAtlasAssets.set(`pokemon_icons_${i}v`, "");
        this.loadAtlas(`pokemon_icons_${i}v`, "");
      }
    }

    this.load.plugin("rextexteditplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rextexteditplugin.min.js", true);

    this.loadLoadingScreen();

    initAchievements();
    initVouchers();
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
    initMysteryEncounters();

    this.logLocalStorageSize();
    this.logSessionStorageSize();
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
        align: "center"
      },
    });
    disclaimerDescriptionText.setOrigin(0.5, 0.5);

    loadingGraphics.push(bg, graphics, progressBar, progressBox, logo, percentText, assetText, disclaimerText, disclaimerDescriptionText);

    if (!mobile) {
      loadingGraphics.map(g => g.setVisible(false));
    }

    const intro = this.add.video(0, 0);
    intro.once(Phaser.GameObjects.Events.VIDEO_COMPLETE, (video: Phaser.GameObjects.Video) => {
      this.tweens.add({
        targets: intro,
        duration: 500,
        alpha: 0,
        ease: "Sine.easeIn",
        onComplete: () => video.destroy(),
      });
      loadingGraphics.forEach(g => g.setVisible(true));
    });
    intro.setOrigin(0, 0);
    intro.setScale(3);

    this.load.once(this.LOAD_EVENTS.START, () => {
      // videos do not need to be preloaded
      intro.loadURL("images/intro_dark.mp4", true);
      if (mobile) {
        intro.video?.setAttribute("webkit-playsinline", "webkit-playsinline");
        intro.video?.setAttribute("playsinline", "playsinline");
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

    this.load.on(this.LOAD_EVENTS.COMPLETE, () => {
      loadingGraphics.forEach(go => go.destroy());
      intro.destroy();
    });
  }

  get gameHeight() {
    return this.game.config.height as number;
  }

  get gameWidth() {
    return this.game.config.width as number;
  }

  async create() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.handleDestroy());
    this.scene.start("battle");
  }

  handleDestroy() {
    console.debug(`Destroying ${LoadingScene.KEY} scene`);
    this.load.off(this.LOAD_EVENTS.PROGRESS);
    this.load.off(this.LOAD_EVENTS.FILE_COMPLETE);
    this.load.off(this.LOAD_EVENTS.COMPLETE);
    // this.textures.remove("loading_bg"); is removed in BattleScene.launchBattle()
    this.children.removeAll(true);
    console.debug(`Destroyed ${LoadingScene.KEY} scene`);
  }
}
