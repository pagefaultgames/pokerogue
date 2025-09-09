import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import type { FixedBattleConfig } from "#app/battle";
import { Battle } from "#app/battle";
import {
  ANTI_VARIANCE_WEIGHT_MODIFIER,
  AVERAGE_ENCOUNTERS_PER_RUN_TARGET,
  BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT,
  MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT,
} from "#app/constants";
import type { GameMode } from "#app/game-mode";
import { getGameMode } from "#app/game-mode";
import { timedEventManager } from "#app/global-event-manager";
import { initGlobalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import { InputsController } from "#app/inputs-controller";
import { LoadingScene } from "#app/loading-scene";
import Overrides from "#app/overrides";
import type { Phase } from "#app/phase";
import { PhaseManager } from "#app/phase-manager";
import { FieldSpritePipeline } from "#app/pipelines/field-sprite";
import { InvertPostFX } from "#app/pipelines/invert";
import { SpritePipeline } from "#app/pipelines/sprite";
import { SceneBase } from "#app/scene-base";
import { startingWave } from "#app/starting-wave";
import { TimedEventManager } from "#app/timed-event-manager";
import { UiInputs } from "#app/ui-inputs";
import { biomeDepths, getBiomeName } from "#balance/biomes";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import { FRIENDSHIP_GAIN_FROM_BATTLE } from "#balance/starters";
import { initCommonAnims, initMoveAnim, loadCommonAnimAssets, loadMoveAnimAssets } from "#data/battle-anims";
import { allAbilities, allMoves, allSpecies, modifierTypes } from "#data/data-lists";
import { battleSpecDialogue } from "#data/dialogue";
import type { SpeciesFormChangeTrigger } from "#data/form-change-triggers";
import { SpeciesFormChangeManualTrigger, SpeciesFormChangeTimeOfDayTrigger } from "#data/form-change-triggers";
import { Gender } from "#data/gender";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies, PokemonSpeciesFilter } from "#data/pokemon-species";
import { getTypeRgb } from "#data/type";
import { BattleSpec } from "#enums/battle-spec";
import { BattleStyle } from "#enums/battle-style";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { EaseType } from "#enums/ease-type";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { FormChangeItem } from "#enums/form-change-item";
import { GameModes } from "#enums/game-modes";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { MoneyFormat } from "#enums/money-format";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PlayerGender } from "#enums/player-gender";
import { PokeballType } from "#enums/pokeball";
import type { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PokemonType } from "#enums/pokemon-type";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TextStyle } from "#enums/text-style";
import type { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiTheme } from "#enums/ui-theme";
import { NewArenaEvent } from "#events/battle-scene";
import { Arena, ArenaBase } from "#field/arena";
import { DamageNumberHandler } from "#field/damage-number-handler";
import type { Pokemon } from "#field/pokemon";
import { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { PokemonSpriteSparkleHandler } from "#field/pokemon-sprite-sparkle-handler";
import { Trainer } from "#field/trainer";
import type { Modifier, ModifierPredicate, TurnHeldItemTransferModifier } from "#modifiers/modifier";
import {
  ConsumableModifier,
  ConsumablePokemonModifier,
  DoubleBattleChanceBoosterModifier,
  ExpBalanceModifier,
  ExpShareModifier,
  FusePokemonModifier,
  HealingBoosterModifier,
  ModifierBar,
  MultipleParticipantExpBonusModifier,
  PersistentModifier,
  PokemonExpBoosterModifier,
  PokemonFormChangeItemModifier,
  PokemonHeldItemModifier,
  PokemonHpRestoreModifier,
  PokemonIncrementingStatModifier,
  RememberMoveModifier,
} from "#modifiers/modifier";
import {
  getDefaultModifierTypeForTier,
  getEnemyModifierTypesForWave,
  getLuckString,
  getLuckTextTint,
  getPartyLuckValue,
  type ModifierType,
  PokemonHeldItemModifierType,
} from "#modifiers/modifier-type";
import { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterSaveData } from "#mystery-encounters/mystery-encounter-save-data";
import { allMysteryEncounters, mysteryEncountersByBiome } from "#mystery-encounters/mystery-encounters";
import type { MovePhase } from "#phases/move-phase";
import { expSpriteKeys } from "#sprites/sprite-keys";
import { hasExpSprite } from "#sprites/sprite-utils";
import type { Variant } from "#sprites/variant";
import { clearVariantData, variantData } from "#sprites/variant";
import type { Achv } from "#system/achv";
import { achvs, ModifierAchv, MoneyAchv } from "#system/achv";
import { GameData } from "#system/game-data";
import { initGameSpeed } from "#system/game-speed";
import type { PokemonData } from "#system/pokemon-data";
import { MusicPreference } from "#system/settings";
import type { TrainerData } from "#system/trainer-data";
import type { Voucher } from "#system/voucher";
import { vouchers } from "#system/voucher";
import { trainerConfigs } from "#trainers/trainer-config";
import type { HeldModifierConfig } from "#types/held-modifier-config";
import type { Localizable } from "#types/locales";
import { AbilityBar } from "#ui/containers/ability-bar";
import { ArenaFlyout } from "#ui/containers/arena-flyout";
import { CandyBar } from "#ui/containers/candy-bar";
import { CharSprite } from "#ui/containers/char-sprite";
import { PartyExpBar } from "#ui/containers/party-exp-bar";
import { PokeballTray } from "#ui/containers/pokeball-tray";
import { PokemonInfoContainer } from "#ui/containers/pokemon-info-container";
import { addTextObject, getTextColor } from "#ui/text";
import { UI } from "#ui/ui";
import { addUiThemeOverrides } from "#ui/ui-theme";
import {
  BooleanHolder,
  type Constructor,
  fixedInt,
  formatMoney,
  getIvsFromId,
  isBetween,
  isNullOrUndefined,
  NumberHolder,
  randomString,
  randSeedInt,
  shiftCharCodes,
} from "#utils/common";
import { deepMergeSpriteData } from "#utils/data";
import { getEnumValues } from "#utils/enums";
import { getModifierPoolForType, getModifierType } from "#utils/modifier-utils";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";
import Phaser from "phaser";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import type UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";

const DEBUG_RNG = false;

export interface PokeballCounts {
  [pb: string]: number;
}

export type AnySound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

export interface InfoToggle {
  toggleInfo(force?: boolean): void;
  isActive(): boolean;
}

export class BattleScene extends SceneBase {
  public rexUI: UIPlugin;
  public inputController: InputsController;
  public uiInputs: UiInputs;

  public sessionPlayTime: number | null = null;
  public lastSavePlayTime: number | null = null;
  public masterVolume = 0.5;
  public bgmVolume = 1;
  public fieldVolume = 1;
  public seVolume = 1;
  public uiVolume = 1;
  public gameSpeed = 1;
  public damageNumbersMode = 0;
  public reroll = false;
  public shopCursorTarget: number = ShopCursorTarget.REWARDS;
  public commandCursorMemory = false;
  public dexForDevs = false;
  public showMovesetFlyout = true;
  public showArenaFlyout = true;
  public showTimeOfDayWidget = true;
  public timeOfDayAnimation: EaseType = EaseType.NONE;
  public showLevelUpStats = true;
  public enableTutorials: boolean = import.meta.env.VITE_BYPASS_TUTORIAL === "1";
  public enableMoveInfo = true;
  public enableRetries = false;
  public hideIvs = false;
  // TODO: Remove all plain numbers in place of enums or `const object` equivalents for clarity
  /**
   * Determines the condition for a notification should be shown for Candy Upgrades
   * - 0 = 'Off'
   * - 1 = 'Passives Only'
   * - 2 = 'On'
   */
  public candyUpgradeNotification = 0;
  /**
   * Determines what type of notification is used for Candy Upgrades
   * - 0 = 'Icon'
   * - 1 = 'Animation'
   */
  public candyUpgradeDisplay = 0;
  public moneyFormat: MoneyFormat = MoneyFormat.NORMAL;
  public uiTheme: UiTheme = UiTheme.DEFAULT;
  public windowType = 0;
  public experimentalSprites = false;
  public musicPreference: MusicPreference = MusicPreference.ALLGENS;
  public moveAnimations = true;
  public expGainsSpeed: ExpGainsSpeed = ExpGainsSpeed.DEFAULT;
  public skipSeenDialogues = false;
  /**
   * Determines if the egg hatching animation should be skipped
   * - 0 = Never (never skip animation)
   * - 1 = Ask (ask to skip animation when hatching 2 or more eggs)
   * - 2 = Always (automatically skip animation when hatching 2 or more eggs)
   */
  public eggSkipPreference = 0;
  /**
   * Defines the {@linkcode ExpNotification | Experience gain display mode}.
   * @defaultValue {@linkcode ExpNotification.DEFAULT}
   */
  public expParty: ExpNotification = ExpNotification.DEFAULT;
  public hpBarSpeed = 0;
  public fusionPaletteSwaps = true;
  public enableTouchControls = false;
  public enableVibration = false;
  public showBgmBar = true;
  public hideUsername = false;
  /** Determines the selected battle style. */
  public battleStyle: BattleStyle = BattleStyle.SWITCH;
  /**
   * Defines whether or not to show type effectiveness hints
   * - true: Show hints for moves
   * - false: No hints
   */
  public typeHints = false;

  public disableMenu = false;

  public gameData: GameData;
  public sessionSlotId: number;

  /** Manager for the phases active in the battle scene */
  public readonly phaseManager: PhaseManager;
  public field: Phaser.GameObjects.Container;
  public fieldUI: Phaser.GameObjects.Container;
  public charSprite: CharSprite;
  public pbTray: PokeballTray;
  public pbTrayEnemy: PokeballTray;
  public abilityBar: AbilityBar;
  public partyExpBar: PartyExpBar;
  public candyBar: CandyBar;
  public arenaBg: Phaser.GameObjects.Sprite;
  public arenaBgTransition: Phaser.GameObjects.Sprite;
  public arenaPlayer: ArenaBase;
  public arenaPlayerTransition: ArenaBase;
  public arenaEnemy: ArenaBase;
  public arenaNextEnemy: ArenaBase;
  public arena: Arena;
  public gameMode: GameMode;
  public score: number;
  public lockModifierTiers: boolean;
  public trainer: Phaser.GameObjects.Sprite;
  public lastEnemyTrainer: Trainer | null;
  public currentBattle: Battle;
  public pokeballCounts: PokeballCounts;
  public money: number;
  public pokemonInfoContainer: PokemonInfoContainer;
  private party: PlayerPokemon[];
  /** Session save data that pertains to Mystery Encounters */
  public mysteryEncounterSaveData: MysteryEncounterSaveData = new MysteryEncounterSaveData();
  /** If the previous wave was a MysteryEncounter, tracks the object with this variable. Mostly used for visual object cleanup */
  public lastMysteryEncounter?: MysteryEncounter;
  /** Combined Biome and Wave count text */
  private biomeWaveText: Phaser.GameObjects.Text;
  private moneyText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private luckLabelText: Phaser.GameObjects.Text;
  private luckText: Phaser.GameObjects.Text;
  private modifierBar: ModifierBar;
  private enemyModifierBar: ModifierBar;
  public arenaFlyout: ArenaFlyout;

  private fieldOverlay: Phaser.GameObjects.Rectangle;
  private shopOverlay: Phaser.GameObjects.Rectangle;
  private shopOverlayShown = false;
  private shopOverlayOpacity = 0.8;

  public modifiers: PersistentModifier[];
  private enemyModifiers: PersistentModifier[];
  public uiContainer: Phaser.GameObjects.Container;
  public ui: UI;

  public seed: string;
  public waveSeed: string;
  public waveCycleOffset: number;
  public offsetGym: boolean;

  public damageNumberHandler: DamageNumberHandler;
  private spriteSparkleHandler: PokemonSpriteSparkleHandler;

  public fieldSpritePipeline: FieldSpritePipeline;
  public spritePipeline: SpritePipeline;

  private bgm: AnySound;
  private bgmResumeTimer: Phaser.Time.TimerEvent | null;
  private bgmCache: Set<string> = new Set();
  private playTimeTimer: Phaser.Time.TimerEvent;

  public rngCounter = 0;
  public rngSeedOverride = "";
  public rngOffset = 0;

  public inputMethod: string;
  private infoToggles: InfoToggle[] = [];

  public eventManager: TimedEventManager;

  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode BattleSceneEventType.MOVE_USED} {@linkcode MoveUsedEvent}
   * - {@linkcode BattleSceneEventType.TURN_INIT} {@linkcode TurnInitEvent}
   * - {@linkcode BattleSceneEventType.TURN_END} {@linkcode TurnEndEvent}
   * - {@linkcode BattleSceneEventType.NEW_ARENA} {@linkcode NewArenaEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor() {
    super("battle");
    this.phaseManager = new PhaseManager();
    this.eventManager = new TimedEventManager();
    this.updateGameInfo();
    initGlobalScene(this);
  }

  loadPokemonAtlas(key: string, atlasPath: string, experimental?: boolean) {
    if (experimental === undefined) {
      experimental = this.experimentalSprites;
    }
    const variant = atlasPath.includes("variant/") || /_[0-3]$/.test(atlasPath);
    if (experimental) {
      experimental = hasExpSprite(key);
    }
    if (variant) {
      atlasPath = atlasPath.replace("variant/", "");
    }
    this.load.atlas(
      key,
      `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.png`,
      `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.json`,
    );
  }

  async preload() {
    if (DEBUG_RNG) {
      const originalRealInRange = Phaser.Math.RND.realInRange;
      Phaser.Math.RND.realInRange = function (min: number, max: number): number {
        const ret = originalRealInRange.apply(this, [min, max]);
        const args = ["RNG", ++this.rngCounter, ret / (max - min), `min: ${min} / max: ${max}`];
        args.push(`seed: ${this.rngSeedOverride || this.waveSeed || this.seed}`);
        if (this.rngOffset) {
          args.push(`offset: ${this.rngOffset}`);
        }
        console.log(...args);
        return ret;
      };
    }

    /**
     * These moves serve as fallback animations for other moves without loaded animations, and
     * must be loaded prior to game start.
     */
    const defaultMoves = [MoveId.TACKLE, MoveId.TAIL_WHIP, MoveId.FOCUS_ENERGY, MoveId.STRUGGLE];

    await Promise.all([
      this.initVariantData(),
      initCommonAnims().then(() => loadCommonAnimAssets(true)),
      Promise.all(defaultMoves.map(m => initMoveAnim(m))).then(() => loadMoveAnimAssets(defaultMoves, true)),
      this.initStarterColors(),
    ]).catch(reason => {
      throw new Error(`Unexpected error during BattleScene preLoad!\nReason: ${reason}`);
    });
  }

  create() {
    this.scene.remove(LoadingScene.KEY);
    initGameSpeed.apply(this);
    this.inputController = new InputsController();
    this.uiInputs = new UiInputs(this.inputController);

    this.gameData = new GameData();

    addUiThemeOverrides();

    this.load.setBaseURL();

    this.spritePipeline = new SpritePipeline(this.game);
    (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add("Sprite", this.spritePipeline);

    this.fieldSpritePipeline = new FieldSpritePipeline(this.game);
    (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add("FieldSprite", this.fieldSpritePipeline);

    this.launchBattle();
  }

  update() {
    this.ui?.update();
  }

  launchBattle() {
    this.arenaBg = this.add.sprite(0, 0, "plains_bg");
    this.arenaBg.setName("sprite-arena-bg");
    this.arenaBgTransition = this.add.sprite(0, 0, "plains_bg");
    this.arenaBgTransition.setName("sprite-arena-bg-transition");

    for (const a of [this.arenaBgTransition, this.arenaBg]) {
      a.setPipeline(this.fieldSpritePipeline);
      a.setScale(6);
      a.setOrigin(0);
      a.setSize(320, 240);
    }

    const field = this.add.container(0, 0);
    field.setName("field");
    field.setScale(6);

    this.field = field;

    const fieldUI = this.add.container(0, this.game.canvas.height);
    fieldUI.setName("field-ui");
    fieldUI.setDepth(1);
    fieldUI.setScale(6);

    this.fieldUI = fieldUI;

    const transition = this.make.rexTransitionImagePack(
      {
        x: 0,
        y: 0,
        scale: 6,
        key: "loading_bg",
        origin: { x: 0, y: 0 },
      },
      true,
    );

    //@ts-expect-error (the defined types in the package are incromplete...)
    transition.transit({
      mode: "blinds",
      ease: "Cubic.easeInOut",
      duration: 1250,
    });
    transition.once("complete", () => {
      transition.destroy();
    });

    this.add.existing(transition);

    const uiContainer = this.add.container(0, 0);
    uiContainer.setName("ui");
    uiContainer.setDepth(2);
    uiContainer.setScale(6);

    this.uiContainer = uiContainer;

    const overlayWidth = this.scaledCanvas.width;
    const overlayHeight = this.scaledCanvas.height - 48;
    this.fieldOverlay = this.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x424242);
    this.fieldOverlay.setName("rect-field-overlay");
    this.fieldOverlay.setOrigin(0, 0);
    this.fieldOverlay.setAlpha(0);
    this.fieldUI.add(this.fieldOverlay);

    this.shopOverlay = this.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x070707);
    this.shopOverlay.setName("rect-shop-overlay");
    this.shopOverlay.setOrigin(0, 0);
    this.shopOverlay.setAlpha(0);
    this.fieldUI.add(this.shopOverlay);

    this.modifiers = [];
    this.enemyModifiers = [];

    this.modifierBar = new ModifierBar();
    this.modifierBar.setName("modifier-bar");
    this.add.existing(this.modifierBar);
    uiContainer.add(this.modifierBar);

    this.enemyModifierBar = new ModifierBar(true);
    this.enemyModifierBar.setName("enemy-modifier-bar");
    this.add.existing(this.enemyModifierBar);
    uiContainer.add(this.enemyModifierBar);

    this.charSprite = new CharSprite();
    this.charSprite.setName("sprite-char");
    this.charSprite.setup();

    this.fieldUI.add(this.charSprite);

    this.pbTray = new PokeballTray(true);
    this.pbTray.setName("pb-tray");
    this.pbTray.setup();

    this.pbTrayEnemy = new PokeballTray(false);
    this.pbTrayEnemy.setName("enemy-pb-tray");
    this.pbTrayEnemy.setup();

    this.fieldUI.add(this.pbTray);
    this.fieldUI.add(this.pbTrayEnemy);

    this.abilityBar = new AbilityBar();
    this.abilityBar.setName("ability-bar");
    this.abilityBar.setup();
    this.fieldUI.add(this.abilityBar);

    this.partyExpBar = new PartyExpBar();
    this.partyExpBar.setName("party-exp-bar");
    this.partyExpBar.setup();
    this.fieldUI.add(this.partyExpBar);

    this.candyBar = new CandyBar();
    this.candyBar.setName("candy-bar");
    this.candyBar.setup();
    this.fieldUI.add(this.candyBar);

    this.biomeWaveText = addTextObject(this.scaledCanvas.width - 2, 0, startingWave.toString(), TextStyle.BATTLE_INFO);
    this.biomeWaveText.setName("text-biome-wave");
    this.biomeWaveText.setOrigin(1, 0.5);
    this.fieldUI.add(this.biomeWaveText);

    this.moneyText = addTextObject(this.scaledCanvas.width - 2, 0, "", TextStyle.MONEY);
    this.moneyText.setName("text-money");
    this.moneyText.setOrigin(1, 0.5);
    this.fieldUI.add(this.moneyText);

    this.scoreText = addTextObject(this.scaledCanvas.width - 2, 0, "", TextStyle.PARTY, { fontSize: "54px" });
    this.scoreText.setName("text-score");
    this.scoreText.setOrigin(1, 0.5);
    this.fieldUI.add(this.scoreText);

    this.luckText = addTextObject(this.scaledCanvas.width - 2, 0, "", TextStyle.PARTY, { fontSize: "54px" });
    this.luckText.setName("text-luck");
    this.luckText.setOrigin(1, 0.5);
    this.luckText.setVisible(false);
    this.fieldUI.add(this.luckText);

    this.luckLabelText = addTextObject(
      this.scaledCanvas.width - 2,
      0,
      i18next.t("common:luckIndicator"),
      TextStyle.PARTY,
      { fontSize: "54px" },
    );
    this.luckLabelText.setName("text-luck-label");
    this.luckLabelText.setOrigin(1, 0.5);
    this.luckLabelText.setVisible(false);
    this.fieldUI.add(this.luckLabelText);

    this.arenaFlyout = new ArenaFlyout();
    this.fieldUI.add(this.arenaFlyout);
    this.fieldUI.moveBelow<Phaser.GameObjects.GameObject>(this.arenaFlyout, this.fieldOverlay);

    this.updateUIPositions();

    this.damageNumberHandler = new DamageNumberHandler();

    this.spriteSparkleHandler = new PokemonSpriteSparkleHandler();
    this.spriteSparkleHandler.setup();

    this.pokemonInfoContainer = new PokemonInfoContainer(this.scaledCanvas.width + 52, -this.scaledCanvas.height + 66);
    this.pokemonInfoContainer.setup();

    this.fieldUI.add(this.pokemonInfoContainer);

    this.party = [];

    this.arenaPlayer = new ArenaBase(true);
    this.arenaPlayer.setName("arena-player");
    this.arenaPlayerTransition = new ArenaBase(true);
    this.arenaPlayerTransition.setName("arena-player-transition");
    this.arenaEnemy = new ArenaBase(false);
    this.arenaEnemy.setName("arena-enemy");
    this.arenaNextEnemy = new ArenaBase(false);
    this.arenaNextEnemy.setName("arena-next-enemy");

    this.arenaBgTransition.setVisible(false);
    this.arenaPlayerTransition.setVisible(false);
    this.arenaNextEnemy.setVisible(false);

    for (const a of [this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy]) {
      if (a instanceof Phaser.GameObjects.Sprite) {
        a.setOrigin(0, 0);
      }
      field.add(a);
    }

    const trainer = this.addFieldSprite(
      0,
      0,
      `trainer_${this.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`,
    );
    trainer.setOrigin(0.5, 1);
    trainer.setName("sprite-trainer");

    field.add(trainer);

    this.trainer = trainer;

    this.anims.create({
      key: "prompt",
      frames: this.anims.generateFrameNumbers("prompt", { start: 1, end: 4 }),
      frameRate: 6,
      repeat: -1,
      showOnStart: true,
    });

    this.anims.create({
      key: "tera_sparkle",
      frames: this.anims.generateFrameNumbers("tera_sparkle", {
        start: 0,
        end: 12,
      }),
      frameRate: 18,
      repeat: 0,
      showOnStart: true,
      hideOnComplete: true,
    });

    this.reset(false, false, true);

    // Initialize UI-related aspects and then start the login phase.
    const ui = new UI();
    this.uiContainer.add(ui);
    this.ui = ui;
    ui.setup();

    this.phaseManager.toTitleScreen(true);
    this.phaseManager.shiftPhase();
  }

  initSession(): void {
    if (this.sessionPlayTime === null) {
      this.sessionPlayTime = 0;
    }
    if (this.lastSavePlayTime === null) {
      this.lastSavePlayTime = 0;
    }

    if (this.playTimeTimer) {
      this.playTimeTimer.destroy();
    }

    this.playTimeTimer = this.time.addEvent({
      delay: fixedInt(1000),
      repeat: -1,
      callback: () => {
        if (this.gameData) {
          this.gameData.gameStats.playTime++;
        }
        if (this.sessionPlayTime !== null) {
          this.sessionPlayTime++;
        }
        if (this.lastSavePlayTime !== null) {
          this.lastSavePlayTime++;
        }
      },
    });

    this.updateBiomeWaveText();
    this.updateMoneyText();
    this.updateScoreText();
  }

  async initExpSprites(): Promise<void> {
    if (expSpriteKeys.size > 0) {
      return;
    }
    const res = await this.cachedFetch("./exp-sprites.json");
    const keys = await res.json();
    if (!Array.isArray(keys)) {
      throw new Error("EXP Sprites were not array when fetched!");
    }

    // TODO: Optimize this
    for (const k of keys) {
      expSpriteKeys.add(k);
    }
  }

  /**
   * Initialize the variant data.
   * If experimental sprites are enabled, their entries are replaced via this method.
   */
  async initVariantData(): Promise<void> {
    clearVariantData();
    const otherVariantData = await this.cachedFetch("./images/pokemon/variant/_masterlist.json").then(r => r.json());
    for (const k of Object.keys(otherVariantData)) {
      variantData[k] = otherVariantData[k];
    }
    if (!this.experimentalSprites) {
      return;
    }
    const expVariantData = await this.cachedFetch("./images/pokemon/variant/_exp_masterlist.json").then(r => r.json());
    deepMergeSpriteData(variantData, expVariantData);
  }

  cachedFetch(url: string, init?: RequestInit): Promise<Response> {
    const manifest = this.game["manifest"];
    if (manifest) {
      const timestamp = manifest[`/${url.replace("./", "")}`];
      if (timestamp) {
        url += `?t=${timestamp}`;
      }
    }
    return fetch(url, init);
  }

  async initStarterColors(): Promise<void> {
    if (Object.keys(starterColors).length > 0) {
      // already initialized
      return;
    }
    const sc = await this.cachedFetch("./starter-colors.json").then(res => res.json());
    for (const key of Object.keys(sc)) {
      starterColors[key] = sc[key];
    }
  }

  // TODO: Add a `getPartyOnSide` function for getting the party of a pokemon
  public getPlayerParty(): PlayerPokemon[] {
    return this.party;
  }

  /**
   * @returns An array of {@linkcode PlayerPokemon} filtered from the player's party
   * that are {@linkcode Pokemon.isAllowedInBattle | allowed in battle}.
   */
  public getPokemonAllowedInBattle(): PlayerPokemon[] {
    return this.getPlayerParty().filter(p => p.isAllowedInBattle());
  }

  /**
   * @returns The first {@linkcode PlayerPokemon} that is {@linkcode getPlayerField on the field}
   * and {@linkcode PlayerPokemon.isActive is active}
   * (aka {@linkcode PlayerPokemon.isAllowedInBattle is allowed in battle}),
   * or `undefined` if there are no valid pokemon
   * @param includeSwitching Whether a pokemon that is currently switching out is valid, default `true`
   */
  public getPlayerPokemon(includeSwitching = true): PlayerPokemon | undefined {
    return this.getPlayerField().find(p => p.isActive() && (includeSwitching || p.switchOutStatus === false));
  }

  // TODO: Add `undefined` to return type
  /**
   * Returns an array of PlayerPokemon of length 1 or 2 depending on if in a double battle or not.
   * @param active - (Default `false`) Whether to consider only {@linkcode Pokemon.isActive | active} on-field pokemon
   * @returns array of {@linkcode PlayerPokemon}
   */
  public getPlayerField(active = false): PlayerPokemon[] {
    const party = this.getPlayerParty();
    return party
      .slice(0, Math.min(party.length, this.currentBattle?.double ? 2 : 1))
      .filter(p => !active || p.isActive());
  }

  public getEnemyParty(): EnemyPokemon[] {
    return this.currentBattle?.enemyParty ?? [];
  }

  /**
   * @returns The first {@linkcode EnemyPokemon} that is {@linkcode getEnemyField | on the field}
   * and {@linkcode EnemyPokemon.isActive | is active}
   * (aka {@linkcode EnemyPokemon.isAllowedInBattle | is allowed in battle}),
   * or `undefined` if there are no valid pokemon
   * @param includeSwitching Whether a pokemon that is currently switching out is valid, default `true`
   */
  public getEnemyPokemon(includeSwitching = true): EnemyPokemon | undefined {
    return this.getEnemyField().find(p => p.isActive() && (includeSwitching || p.switchOutStatus === false));
  }

  /**
   * Returns an array of EnemyPokemon of length 1 or 2 depending on if in a double battle or not.
   * Does not actually check if the pokemon are on the field or not.
   * @returns array of {@linkcode EnemyPokemon}
   */
  public getEnemyField(): EnemyPokemon[] {
    const party = this.getEnemyParty();
    return party.slice(0, Math.min(party.length, this.currentBattle?.double ? 2 : 1));
  }

  /**
   * Returns an array of Pokemon on both sides of the battle - player first, then enemy.
   * Does not actually check if the pokemon are on the field or not, and always has length 4 regardless of battle type.
   * @param activeOnly - Whether to consider only active pokemon (as described by {@linkcode Pokemon.isActive()}); default `false`.
   * If `true`, will also remove all `null` values from the array.
   * @returns An array of {@linkcode Pokemon}, as described above.
   */
  public getField(activeOnly = false): Pokemon[] {
    const ret: Pokemon[] = new Array(4).fill(null);
    const playerField = this.getPlayerField();
    const enemyField = this.getEnemyField();
    ret.splice(0, playerField.length, ...playerField);
    ret.splice(2, enemyField.length, ...enemyField);
    return activeOnly ? ret.filter(p => p?.isActive()) : ret;
  }

  /**
   * Attempt to redirect a move in double battles from a fainted/removed Pokemon to its ally.
   * @param removedPokemon - The {@linkcode Pokemon} having been removed from the field.
   * @param allyPokemon - The {@linkcode Pokemon} allied with the removed Pokemon; will have moves redirected to it
   */
  redirectPokemonMoves(removedPokemon: Pokemon, allyPokemon: Pokemon): void {
    // failsafe: if not a double battle just return
    if (this.currentBattle.double === false) {
      return;
    }
    if (allyPokemon?.isActive(true)) {
      let targetingMovePhase: MovePhase;
      do {
        targetingMovePhase = this.phaseManager.findPhase(
          mp =>
            mp.is("MovePhase")
            && mp.targets.length === 1
            && mp.targets[0] === removedPokemon.getBattlerIndex()
            && mp.pokemon.isPlayer() !== allyPokemon.isPlayer(),
        ) as MovePhase;
        if (targetingMovePhase && targetingMovePhase.targets[0] !== allyPokemon.getBattlerIndex()) {
          targetingMovePhase.targets[0] = allyPokemon.getBattlerIndex();
        }
      } while (targetingMovePhase);
    }
  }

  /**
   * Returns the ModifierBar of this scene, which is declared private and therefore not accessible elsewhere
   * @param isEnemy - Whether to return the enemy modifier bar instead of the player bar; default `false`
   * @returns The {@linkcode ModifierBar} for the given side of the field
   */
  getModifierBar(isEnemy = false): ModifierBar {
    return isEnemy ? this.enemyModifierBar : this.modifierBar;
  }

  // store info toggles to be accessible by the ui
  addInfoToggle(...infoToggles: InfoToggle[]): void {
    this.infoToggles.push(...infoToggles);
  }

  // return the stored info toggles; used by ui-inputs
  getInfoToggles(activeOnly = false): InfoToggle[] {
    return activeOnly ? this.infoToggles.filter(t => t?.isActive()) : this.infoToggles;
  }

  /**
   * Return the {@linkcode Pokemon} associated with a given ID.
   * @param pokemonId - The ID whose Pokemon will be retrieved.
   * @returns The {@linkcode Pokemon} associated with the given id.
   * Returns `null` if the ID is `undefined` or not present in either party.
   * @todo Change the `null` to `undefined` and update callers' signatures -
   * this is weird and causes a lot of random jank
   */
  getPokemonById(pokemonId: number | undefined): Pokemon | null {
    if (isNullOrUndefined(pokemonId)) {
      return null;
    }

    const party = (this.getPlayerParty() as Pokemon[]).concat(this.getEnemyParty());
    return party.find(p => p.id === pokemonId) ?? null;
  }

  addPlayerPokemon(
    species: PokemonSpecies,
    level: number,
    abilityIndex?: number,
    formIndex?: number,
    gender?: Gender,
    shiny?: boolean,
    variant?: Variant,
    ivs?: number[],
    nature?: Nature,
    dataSource?: Pokemon | PokemonData,
    postProcess?: (playerPokemon: PlayerPokemon) => void,
  ): PlayerPokemon {
    const pokemon = new PlayerPokemon(
      species,
      level,
      abilityIndex,
      formIndex,
      gender,
      shiny,
      variant,
      ivs,
      nature,
      dataSource,
    );

    if (postProcess) {
      postProcess(pokemon);
    }

    if (Overrides.IVS_OVERRIDE === null) {
      // do nothing
    } else if (Array.isArray(Overrides.IVS_OVERRIDE)) {
      if (Overrides.IVS_OVERRIDE.length !== 6) {
        throw new Error("The Player IVs override must be an array of length 6 or a number!");
      }
      if (Overrides.IVS_OVERRIDE.some(value => !isBetween(value, 0, 31))) {
        throw new Error("All IVs in the player IV override must be between 0 and 31!");
      }
      pokemon.ivs = Overrides.IVS_OVERRIDE;
    } else {
      if (!isBetween(Overrides.IVS_OVERRIDE, 0, 31)) {
        throw new Error("The Player IV override must be a value between 0 and 31!");
      }
      pokemon.ivs = new Array(6).fill(Overrides.IVS_OVERRIDE);
    }

    if (Overrides.NATURE_OVERRIDE !== null) {
      pokemon.nature = Overrides.NATURE_OVERRIDE;
    }

    pokemon.init();
    return pokemon;
  }

  addEnemyPokemon(
    species: PokemonSpecies,
    level: number,
    trainerSlot: TrainerSlot,
    boss = false,
    shinyLock = false,
    dataSource?: PokemonData,
    postProcess?: (enemyPokemon: EnemyPokemon) => void,
  ): EnemyPokemon {
    if (Overrides.ENEMY_LEVEL_OVERRIDE > 0) {
      level = Overrides.ENEMY_LEVEL_OVERRIDE;
    }
    if (Overrides.ENEMY_SPECIES_OVERRIDE) {
      species = getPokemonSpecies(Overrides.ENEMY_SPECIES_OVERRIDE);
      // The fact that a Pokemon is a boss or not can change based on its Species and level
      boss = this.getEncounterBossSegments(this.currentBattle.waveIndex, level, species) > 1;
    }

    const pokemon = new EnemyPokemon(species, level, trainerSlot, boss, shinyLock, dataSource);
    if (Overrides.ENEMY_FUSION_OVERRIDE) {
      pokemon.generateFusionSpecies();
    }

    if (boss && !dataSource) {
      const secondaryIvs = getIvsFromId(randSeedInt(4294967296));

      for (let s = 0; s < pokemon.ivs.length; s++) {
        pokemon.ivs[s] = Math.round(
          Phaser.Math.Linear(
            Math.min(pokemon.ivs[s], secondaryIvs[s]),
            Math.max(pokemon.ivs[s], secondaryIvs[s]),
            0.75,
          ),
        );
      }
    }
    if (postProcess) {
      postProcess(pokemon);
    }

    if (Overrides.ENEMY_IVS_OVERRIDE === null) {
      // do nothing
    } else if (Array.isArray(Overrides.ENEMY_IVS_OVERRIDE)) {
      if (Overrides.ENEMY_IVS_OVERRIDE.length !== 6) {
        throw new Error("The Enemy IVs override must be an array of length 6 or a number!");
      }
      if (Overrides.ENEMY_IVS_OVERRIDE.some(value => !isBetween(value, 0, 31))) {
        throw new Error("All IVs in the enemy IV override must be between 0 and 31!");
      }
      pokemon.ivs = Overrides.ENEMY_IVS_OVERRIDE;
    } else {
      if (!isBetween(Overrides.ENEMY_IVS_OVERRIDE, 0, 31)) {
        throw new Error("The Enemy IV override must be a value between 0 and 31!");
      }
      pokemon.ivs = new Array(6).fill(Overrides.ENEMY_IVS_OVERRIDE);
    }

    if (Overrides.ENEMY_NATURE_OVERRIDE !== null) {
      pokemon.nature = Overrides.ENEMY_NATURE_OVERRIDE;
    }

    pokemon.init();
    return pokemon;
  }

  /**
   * Removes a {@linkcode PlayerPokemon} from the party, and clears modifiers for that Pokemon's id
   * Useful for MEs/Challenges that remove Pokemon from the player party temporarily or permanently
   * @param pokemon
   * @param destroy Default true. If true, will destroy the {@linkcode PlayerPokemon} after removing
   */
  removePokemonFromPlayerParty(pokemon: PlayerPokemon, destroy = true) {
    if (!pokemon) {
      return;
    }

    const partyIndex = this.party.indexOf(pokemon);
    this.party.splice(partyIndex, 1);
    if (destroy) {
      this.field.remove(pokemon, true);
      pokemon.destroy();
    }
    this.updateModifiers(true);
  }

  addPokemonIcon(
    pokemon: Pokemon,
    x: number,
    y: number,
    originX = 0.5,
    originY = 0.5,
    ignoreOverride = true,
    useIllusion = false,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setName(`${pokemon.name}-icon`);

    const icon = this.add.sprite(0, 0, pokemon.getIconAtlasKey(ignoreOverride, useIllusion));
    icon.setName(`sprite-${pokemon.name}-icon`);
    icon.setFrame(pokemon.getIconId(ignoreOverride, useIllusion));
    // Temporary fix to show pokemon's default icon if variant icon doesn't exist
    if (icon.frame.name !== pokemon.getIconId(ignoreOverride, useIllusion)) {
      console.log(`${pokemon.name}'s variant icon does not exist. Replacing with default.`);
      const temp = pokemon.shiny;
      pokemon.shiny = false;
      icon.setTexture(pokemon.getIconAtlasKey(ignoreOverride, useIllusion));
      icon.setFrame(pokemon.getIconId(true, useIllusion));
      pokemon.shiny = temp;
    }
    icon.setOrigin(0.5, 0);

    container.add(icon);

    if (pokemon.isFusion(useIllusion)) {
      const fusionIcon = this.add.sprite(0, 0, pokemon.getFusionIconAtlasKey(ignoreOverride, useIllusion));
      fusionIcon.setName("sprite-fusion-icon");
      fusionIcon.setOrigin(0.5, 0);
      fusionIcon.setFrame(pokemon.getFusionIconId(ignoreOverride, useIllusion));

      const originalWidth = icon.width;
      const originalHeight = icon.height;
      const originalFrame = icon.frame;

      const iconHeight = (icon.frame.cutHeight <= fusionIcon.frame.cutHeight ? Math.ceil : Math.floor)(
        (icon.frame.cutHeight + fusionIcon.frame.cutHeight) / 4,
      );

      // Inefficient, but for some reason didn't work with only the unique properties as part of the name
      const iconFrameId = `${icon.frame.name}f${fusionIcon.frame.name}`;

      if (!icon.frame.texture.has(iconFrameId)) {
        icon.frame.texture.add(
          iconFrameId,
          icon.frame.sourceIndex,
          icon.frame.cutX,
          icon.frame.cutY,
          icon.frame.cutWidth,
          iconHeight,
        );
      }

      icon.setFrame(iconFrameId);

      fusionIcon.y = icon.frame.cutHeight;

      const originalFusionFrame = fusionIcon.frame;

      const fusionIconY = fusionIcon.frame.cutY + icon.frame.cutHeight;
      const fusionIconHeight = fusionIcon.frame.cutHeight - icon.frame.cutHeight;

      // Inefficient, but for some reason didn't work with only the unique properties as part of the name
      const fusionIconFrameId = `${fusionIcon.frame.name}f${icon.frame.name}`;

      if (!fusionIcon.frame.texture.has(fusionIconFrameId)) {
        fusionIcon.frame.texture.add(
          fusionIconFrameId,
          fusionIcon.frame.sourceIndex,
          fusionIcon.frame.cutX,
          fusionIconY,
          fusionIcon.frame.cutWidth,
          fusionIconHeight,
        );
      }
      fusionIcon.setFrame(fusionIconFrameId);

      const frameY = (originalFrame.y + originalFusionFrame.y) / 2;
      icon.frame.y = fusionIcon.frame.y = frameY;

      container.add(fusionIcon);

      if (originX !== 0.5) {
        container.x -= originalWidth * (originX - 0.5);
      }
      if (originY !== 0) {
        container.y -= originalHeight * originY;
      }
    } else {
      if (originX !== 0.5) {
        container.x -= icon.width * (originX - 0.5);
      }
      if (originY !== 0) {
        container.y -= icon.height * originY;
      }
    }

    return container;
  }

  setSeed(seed: string): void {
    this.seed = seed;
    this.rngCounter = 0;
    this.waveCycleOffset = this.getGeneratedWaveCycleOffset();
    this.offsetGym = this.gameMode.isClassic && this.getGeneratedOffsetGym();
  }

  /**
   * Generates a random number using the current battle's seed
   *
   * This calls {@linkcode Battle.randSeedInt}({@linkcode range}, {@linkcode min}) in `src/battle.ts`
   * which calls {@linkcode randSeedInt randSeedInt}({@linkcode range}, {@linkcode min}) in `src/utils.ts`
   *
   * @param range How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
   * @param min The minimum integer to pick, default `0`
   * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
   */
  randBattleSeedInt(range: number, min = 0): number {
    return this.currentBattle?.randSeedInt(range, min);
  }

  reset(clearScene = false, clearData = false, reloadI18n = false): void {
    if (clearData) {
      this.gameData = new GameData();
    }

    this.gameMode = getGameMode(GameModes.CLASSIC);

    this.disableMenu = false;

    this.score = 0;
    this.money = 0;

    this.lockModifierTiers = false;

    this.pokeballCounts = Object.fromEntries(
      getEnumValues(PokeballType)
        .filter(p => p <= PokeballType.MASTER_BALL)
        .map(t => [t, 0]),
    );
    this.pokeballCounts[PokeballType.POKEBALL] += 5;
    if (Overrides.POKEBALL_OVERRIDE.active) {
      this.pokeballCounts = Overrides.POKEBALL_OVERRIDE.pokeballs;
    }

    this.modifiers = [];
    this.enemyModifiers = [];
    this.modifierBar.removeAll(true);
    this.enemyModifierBar.removeAll(true);

    for (const p of this.getPlayerParty()) {
      p.destroy();
    }
    this.party = [];
    for (const p of this.getEnemyParty()) {
      p.destroy();
    }

    // If this is a ME, clear any residual visual sprites before reloading
    if (this.currentBattle?.mysteryEncounter?.introVisuals) {
      this.field.remove(this.currentBattle.mysteryEncounter?.introVisuals, true);
    }

    //@ts-expect-error  - allowing `null` for currentBattle causes a lot of trouble
    this.currentBattle = null; // TODO: resolve ts-ignore

    // Reset RNG after end of game or save & quit.
    // This needs to happen after clearing this.currentBattle or the seed will be affected by the last wave played
    this.setSeed(Overrides.SEED_OVERRIDE || randomString(24));
    console.log("Seed:", this.seed);
    this.resetSeed();

    this.biomeWaveText.setText(startingWave.toString());
    this.biomeWaveText.setVisible(false);

    this.updateMoneyText();
    this.moneyText.setVisible(false);

    this.updateScoreText();
    this.scoreText.setVisible(false);

    [this.luckLabelText, this.luckText].forEach(t => {
      t.setVisible(false);
    });

    this.newArena(Overrides.STARTING_BIOME_OVERRIDE || BiomeId.TOWN);

    this.field.setVisible(true);

    this.arenaBgTransition.setPosition(0, 0);
    this.arenaPlayer.setPosition(300, 0);
    this.arenaPlayerTransition.setPosition(0, 0);
    this.arenaEnemy.setPosition(-280, 0);
    this.arenaNextEnemy.setPosition(-280, 0);
    this.arenaNextEnemy.setVisible(false);

    this.arena.init();

    this.trainer.setTexture(`trainer_${this.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
    this.trainer.setPosition(406, 186);
    this.trainer.setVisible(true);

    this.mysteryEncounterSaveData = new MysteryEncounterSaveData();

    this.updateGameInfo();

    if (reloadI18n) {
      const localizable: Localizable[] = [
        ...allSpecies,
        ...allMoves,
        ...allAbilities,
        ...getEnumValues(ModifierPoolType)
          .map(mpt => getModifierPoolForType(mpt))
          .flatMap(mp =>
            Object.values(mp)
              .flat()
              .map(mt => mt.modifierType)
              .filter((mt): mt is ModifierType & Localizable => "localize" in mt && typeof mt.localize === "function"),
          ),
      ];
      for (const item of localizable) {
        item.localize();
      }
    }

    if (clearScene) {
      // Reload variant data in case sprite set has changed
      this.initVariantData();

      this.fadeOutBgm(250, false);
      this.tweens.add({
        targets: [this.uiContainer],
        alpha: 0,
        duration: 250,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.ui.freeUIData();
          this.uiContainer.remove(this.ui, true);
          this.uiContainer.destroy();
          this.children.removeAll(true);
          this.game.domContainer.innerHTML = "";
          // TODO: `launchBattle` calls `reset(false, false, true)`
          this.launchBattle();
        },
      });
    }
  }

  getDoubleBattleChance(newWaveIndex: number, playerField: PlayerPokemon[]) {
    const doubleChance = new NumberHolder(newWaveIndex % 10 === 0 ? 32 : 8);
    this.applyModifiers(DoubleBattleChanceBoosterModifier, true, doubleChance);
    for (const p of playerField) {
      applyAbAttrs("DoubleBattleChanceAbAttr", { pokemon: p, chance: doubleChance });
    }
    return Math.max(doubleChance.value, 1);
  }

  isNewBiome(currentBattle = this.currentBattle) {
    const isWaveIndexMultipleOfTen = !(currentBattle.waveIndex % 10);
    const isEndlessOrDaily = this.gameMode.hasShortBiomes || this.gameMode.isDaily;
    const isEndlessFifthWave = this.gameMode.hasShortBiomes && currentBattle.waveIndex % 5 === 0;
    const isWaveIndexMultipleOfFiftyMinusOne = currentBattle.waveIndex % 50 === 49;
    const isNewBiome =
      isWaveIndexMultipleOfTen || isEndlessFifthWave || (isEndlessOrDaily && isWaveIndexMultipleOfFiftyMinusOne);
    return isNewBiome;
  }

  newBattle(
    waveIndex?: number,
    battleType?: BattleType,
    trainerData?: TrainerData,
    double?: boolean,
    mysteryEncounterType?: MysteryEncounterType,
  ): Battle {
    const _startingWave = Overrides.STARTING_WAVE_OVERRIDE || startingWave;
    const newWaveIndex = waveIndex || (this.currentBattle?.waveIndex || _startingWave - 1) + 1;
    let newDouble: boolean | undefined;
    let newBattleType: BattleType;
    let newTrainer: Trainer | undefined;

    let battleConfig: FixedBattleConfig | null = null;

    this.resetSeed(newWaveIndex);

    const playerField = this.getPlayerField();

    if (this.gameMode.isFixedBattle(newWaveIndex) && trainerData === undefined) {
      battleConfig = this.gameMode.getFixedBattle(newWaveIndex);
      newDouble = battleConfig.double;
      newBattleType = battleConfig.battleType;
      this.executeWithSeedOffset(
        () => (newTrainer = battleConfig?.getTrainer()),
        (battleConfig.seedOffsetWaveIndex || newWaveIndex) << 8,
      );
      if (newTrainer) {
        this.field.add(newTrainer);
      }
    } else {
      if (
        !this.gameMode.hasTrainers
        || Overrides.BATTLE_TYPE_OVERRIDE === BattleType.WILD
        || (Overrides.DISABLE_STANDARD_TRAINERS_OVERRIDE && isNullOrUndefined(trainerData))
      ) {
        newBattleType = BattleType.WILD;
      } else {
        newBattleType =
          Overrides.BATTLE_TYPE_OVERRIDE
          ?? battleType
          ?? (this.gameMode.isWaveTrainer(newWaveIndex, this.arena) ? BattleType.TRAINER : BattleType.WILD);
      }

      if (newBattleType === BattleType.TRAINER) {
        const trainerType =
          Overrides.RANDOM_TRAINER_OVERRIDE?.trainerType ?? this.arena.randomTrainerType(newWaveIndex);
        let doubleTrainer = false;
        if (trainerConfigs[trainerType].doubleOnly) {
          doubleTrainer = true;
        } else if (trainerConfigs[trainerType].hasDouble) {
          doubleTrainer =
            Overrides.RANDOM_TRAINER_OVERRIDE?.alwaysDouble
            || !randSeedInt(this.getDoubleBattleChance(newWaveIndex, playerField));
          // Add a check that special trainers can't be double except for tate and liza - they should use the normal double chance
          if (
            trainerConfigs[trainerType].trainerTypeDouble
            && ![TrainerType.TATE, TrainerType.LIZA].includes(trainerType)
          ) {
            doubleTrainer = false;
          }
        }
        const variant = doubleTrainer
          ? TrainerVariant.DOUBLE
          : randSeedInt(2)
            ? TrainerVariant.FEMALE
            : TrainerVariant.DEFAULT;
        newTrainer = trainerData !== undefined ? trainerData.toTrainer() : new Trainer(trainerType, variant);
        this.field.add(newTrainer);
      }

      // Check for mystery encounter
      // Can only occur in place of a standard (non-boss) wild battle, waves 10-180
      if (
        !Overrides.BATTLE_TYPE_OVERRIDE
        && (this.isWaveMysteryEncounter(newBattleType, newWaveIndex) || newBattleType === BattleType.MYSTERY_ENCOUNTER)
      ) {
        newBattleType = BattleType.MYSTERY_ENCOUNTER;
        // Reset to base spawn weight
        this.mysteryEncounterSaveData.encounterSpawnChance = BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT;
      }
    }

    if (double === undefined && newWaveIndex > 1) {
      if (newBattleType === BattleType.WILD && !this.gameMode.isWaveFinal(newWaveIndex)) {
        newDouble = !randSeedInt(this.getDoubleBattleChance(newWaveIndex, playerField));
      } else if (newBattleType === BattleType.TRAINER) {
        newDouble = newTrainer?.variant === TrainerVariant.DOUBLE;
      }
    } else if (!battleConfig) {
      newDouble = !!double;
    }

    // Disable double battles on Endless/Endless Spliced Wave 50x boss battles (Introduced 1.2.0)
    if (this.gameMode.isEndlessBoss(newWaveIndex)) {
      newDouble = false;
    }

    if (!isNullOrUndefined(Overrides.BATTLE_STYLE_OVERRIDE)) {
      let doubleOverrideForWave: "single" | "double" | null = null;

      switch (Overrides.BATTLE_STYLE_OVERRIDE) {
        case "double":
          doubleOverrideForWave = "double";
          break;
        case "single":
          doubleOverrideForWave = "single";
          break;
        case "even-doubles":
          doubleOverrideForWave = newWaveIndex % 2 ? "single" : "double";
          break;
        case "odd-doubles":
          doubleOverrideForWave = newWaveIndex % 2 ? "double" : "single";
          break;
      }

      if (doubleOverrideForWave === "double") {
        newDouble = true;
      }
      /**
       * Override battles into single only if not fighting with trainers.
       * @see {@link https://github.com/pagefaultgames/pokerogue/issues/1948 GitHub Issue #1948}
       */
      if (newBattleType !== BattleType.TRAINER && doubleOverrideForWave === "single") {
        newDouble = false;
      }
    }

    const lastBattle = this.currentBattle;

    const maxExpLevel = this.getMaxExpLevel();

    this.lastEnemyTrainer = lastBattle?.trainer ?? null;
    this.lastMysteryEncounter = lastBattle?.mysteryEncounter;

    if (newBattleType === BattleType.MYSTERY_ENCOUNTER) {
      // Disable double battle on mystery encounters (it may be re-enabled as part of encounter)
      newDouble = false;
    }

    if (lastBattle?.double && !newDouble) {
      this.phaseManager.tryRemovePhase((p: Phase) => p.is("SwitchPhase"));
      for (const p of this.getPlayerField()) {
        p.lapseTag(BattlerTagType.COMMANDED);
      }
    }

    this.executeWithSeedOffset(
      () => {
        this.currentBattle = new Battle(this.gameMode, newWaveIndex, newBattleType, newTrainer, newDouble);
      },
      newWaveIndex << 3,
      this.waveSeed,
    );
    this.currentBattle.incrementTurn();

    if (newBattleType === BattleType.MYSTERY_ENCOUNTER) {
      // Will generate the actual Mystery Encounter during NextEncounterPhase, to ensure it uses proper biome
      this.currentBattle.mysteryEncounterType = mysteryEncounterType;
    }

    if (!waveIndex && lastBattle) {
      const isNewBiome = this.isNewBiome(lastBattle);
      /** Whether to reset and recall pokemon */
      const resetArenaState =
        isNewBiome
        || [BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(this.currentBattle.battleType)
        || this.currentBattle.battleSpec === BattleSpec.FINAL_BOSS;

      for (const enemyPokemon of this.getEnemyParty()) {
        enemyPokemon.destroy();
      }
      this.trySpreadPokerus();
      if (!isNewBiome && newWaveIndex % 10 === 5) {
        this.arena.updatePoolsForTimeOfDay();
      }
      if (resetArenaState) {
        this.arena.resetArenaEffects();

        for (const pokemon of playerField) {
          pokemon.lapseTag(BattlerTagType.COMMANDED);
        }

        playerField.forEach((pokemon, p) => {
          if (pokemon.isOnField()) {
            this.phaseManager.pushNew("ReturnPhase", p);
          }
        });

        for (const pokemon of this.getPlayerParty()) {
          pokemon.resetBattleAndWaveData();
          pokemon.resetTera();
          applyAbAttrs("PostBattleInitAbAttr", { pokemon });
          // Terapagos resets tera on each fight
          if (pokemon.hasSpecies(SpeciesId.TERAPAGOS)) {
            this.arena.playerTerasUsed = 0;
          }
        }

        if (!this.trainer.visible) {
          this.phaseManager.pushNew("ShowTrainerPhase");
        }
      }

      for (const pokemon of this.getPlayerParty()) {
        this.triggerPokemonFormChange(pokemon, SpeciesFormChangeTimeOfDayTrigger);
      }

      if (!this.gameMode.hasRandomBiomes && !isNewBiome) {
        this.phaseManager.pushNew("NextEncounterPhase");
      } else {
        this.phaseManager.pushNew("NewBiomeEncounterPhase");

        const newMaxExpLevel = this.getMaxExpLevel();
        if (newMaxExpLevel > maxExpLevel) {
          this.phaseManager.pushNew("LevelCapPhase");
        }
      }
    }

    return this.currentBattle;
  }

  newArena(biome: BiomeId, playerFaints = 0): Arena {
    this.arena = new Arena(biome, playerFaints);
    this.eventTarget.dispatchEvent(new NewArenaEvent());

    this.arenaBg.pipelineData = {
      terrainColorRatio: this.arena.getBgTerrainColorRatioForBiome(),
    };

    return this.arena;
  }

  updateFieldScale(): Promise<void> {
    return new Promise(resolve => {
      const fieldScale =
        Math.floor(
          Math.pow(
            1
              / this.getField(true)
                .map(p => p.getSpriteScale())
                .reduce((highestScale: number, scale: number) => (highestScale = Math.max(scale, highestScale)), 0),
            0.7,
          ) * 40,
        ) / 40;
      this.setFieldScale(fieldScale).then(() => resolve());
    });
  }

  setFieldScale(scale: number, instant = false): Promise<void> {
    return new Promise(resolve => {
      scale *= 6;
      if (this.field.scale === scale) {
        return resolve();
      }

      const defaultWidth = this.arenaBg.width * 6;
      const defaultHeight = 132 * 6;
      const scaledWidth = this.arenaBg.width * scale;
      const scaledHeight = 132 * scale;

      this.tweens.add({
        targets: this.field,
        scale,
        x: (defaultWidth - scaledWidth) / 2,
        y: defaultHeight - scaledHeight,
        duration: instant ? 0 : fixedInt(Math.abs(this.field.scale - scale) * 200),
        ease: "Sine.easeInOut",
        onComplete: () => resolve(),
      });
    });
  }

  getSpeciesFormIndex(species: PokemonSpecies, gender?: Gender, nature?: Nature, ignoreArena?: boolean): number {
    if (species.forms?.length === 0) {
      return 0;
    }

    const isEggPhase =
      this.phaseManager.getCurrentPhase().is("EggLapsePhase")
      || this.phaseManager.getCurrentPhase().is("EggHatchPhase");

    if (
      // Give trainers with specialty types an appropriately-typed form for Wormadam, Rotom, Arceus, Oricorio, Silvally, or Paldean Tauros.
      !isEggPhase
      && this.currentBattle?.battleType === BattleType.TRAINER
      && !isNullOrUndefined(this.currentBattle.trainer)
      && this.currentBattle.trainer.config.hasSpecialtyType()
    ) {
      if (species.speciesId === SpeciesId.WORMADAM) {
        switch (this.currentBattle.trainer.config.specialtyType) {
          case PokemonType.GROUND:
            return 1; // Sandy Cloak
          case PokemonType.STEEL:
            return 2; // Trash Cloak
          case PokemonType.GRASS:
            return 0; // Plant Cloak
        }
      }
      if (species.speciesId === SpeciesId.ROTOM) {
        switch (this.currentBattle.trainer.config.specialtyType) {
          case PokemonType.FLYING:
            return 4; // Fan Rotom
          case PokemonType.GHOST:
            return 0; // Lightbulb Rotom
          case PokemonType.FIRE:
            return 1; // Heat Rotom
          case PokemonType.GRASS:
            return 5; // Mow Rotom
          case PokemonType.WATER:
            return 2; // Wash Rotom
          case PokemonType.ICE:
            return 3; // Frost Rotom
        }
      }
      if (species.speciesId === SpeciesId.ORICORIO) {
        switch (this.currentBattle.trainer.config.specialtyType) {
          case PokemonType.GHOST:
            return 3; // Sensu Style
          case PokemonType.FIRE:
            return 0; // Baile Style
          case PokemonType.ELECTRIC:
            return 1; // Pom-Pom Style
          case PokemonType.PSYCHIC:
            return 2; // Pa'u Style
        }
      }
      if (species.speciesId === SpeciesId.PALDEA_TAUROS) {
        switch (this.currentBattle.trainer.config.specialtyType) {
          case PokemonType.FIRE:
            return 1; // Blaze Breed
          case PokemonType.WATER:
            return 2; // Aqua Breed
        }
      }
      if (species.speciesId === SpeciesId.SILVALLY || species.speciesId === SpeciesId.ARCEUS) {
        // Would probably never happen, but might as well
        return this.currentBattle.trainer.config.specialtyType;
      }
    }

    switch (species.speciesId) {
      case SpeciesId.UNOWN:
      case SpeciesId.SHELLOS:
      case SpeciesId.GASTRODON:
      case SpeciesId.BASCULIN:
      case SpeciesId.DEERLING:
      case SpeciesId.SAWSBUCK:
      case SpeciesId.SCATTERBUG:
      case SpeciesId.SPEWPA:
      case SpeciesId.VIVILLON:
      case SpeciesId.FLABEBE:
      case SpeciesId.FLOETTE:
      case SpeciesId.FLORGES:
      case SpeciesId.FURFROU:
      case SpeciesId.PUMPKABOO:
      case SpeciesId.GOURGEIST:
      case SpeciesId.ORICORIO:
      case SpeciesId.MAGEARNA:
      case SpeciesId.ZARUDE:
      case SpeciesId.SQUAWKABILLY:
      case SpeciesId.TATSUGIRI:
      case SpeciesId.PALDEA_TAUROS:
        return randSeedInt(species.forms.length);
      case SpeciesId.MAUSHOLD:
      case SpeciesId.DUDUNSPARCE:
        return !randSeedInt(4) ? 1 : 0;
      case SpeciesId.SINISTEA:
      case SpeciesId.POLTEAGEIST:
      case SpeciesId.POLTCHAGEIST:
      case SpeciesId.SINISTCHA:
        return !randSeedInt(16) ? 1 : 0;
      case SpeciesId.PIKACHU:
        if (this.currentBattle?.battleType === BattleType.TRAINER && this.currentBattle?.waveIndex < 30) {
          return 0; // Ban Cosplay and Partner Pika from Trainers before wave 30
        }
        return randSeedInt(8);
      case SpeciesId.EEVEE:
        if (
          this.currentBattle?.battleType === BattleType.TRAINER
          && this.currentBattle?.waveIndex < 30
          && !isEggPhase
        ) {
          return 0; // No Partner Eevee for Wave 12 Preschoolers
        }
        return randSeedInt(2);
      case SpeciesId.FROAKIE:
      case SpeciesId.FROGADIER:
      case SpeciesId.GRENINJA:
        if (this.currentBattle?.battleType === BattleType.TRAINER && !isEggPhase) {
          return 0; // Don't give trainers Battle Bond Greninja, Froakie or Frogadier
        }
        return randSeedInt(2);
      case SpeciesId.URSHIFU:
        return randSeedInt(2);
      case SpeciesId.ZYGARDE:
        return randSeedInt(4);
      case SpeciesId.MINIOR:
        return randSeedInt(7);
      case SpeciesId.ALCREMIE:
        return randSeedInt(9);
      case SpeciesId.MEOWSTIC:
      case SpeciesId.INDEEDEE:
      case SpeciesId.BASCULEGION:
      case SpeciesId.OINKOLOGNE:
        return gender === Gender.FEMALE ? 1 : 0;
      case SpeciesId.TOXTRICITY: {
        const lowkeyNatures = [
          Nature.LONELY,
          Nature.BOLD,
          Nature.RELAXED,
          Nature.TIMID,
          Nature.SERIOUS,
          Nature.MODEST,
          Nature.MILD,
          Nature.QUIET,
          Nature.BASHFUL,
          Nature.CALM,
          Nature.GENTLE,
          Nature.CAREFUL,
        ];
        if (nature !== undefined && lowkeyNatures.indexOf(nature) > -1) {
          return 1;
        }
        return 0;
      }
      case SpeciesId.GIMMIGHOUL:
        // Chest form can only be found in Mysterious Chest Encounter, if this is a game mode with MEs
        if (this.gameMode.hasMysteryEncounters && !isEggPhase) {
          return 1; // Wandering form
        }
        return randSeedInt(species.forms.length);
    }

    if (ignoreArena) {
      switch (species.speciesId) {
        case SpeciesId.BURMY:
        case SpeciesId.WORMADAM:
        case SpeciesId.ROTOM:
        case SpeciesId.LYCANROC:
          return randSeedInt(species.forms.length);
      }
      return 0;
    }

    return this.arena.getSpeciesFormIndex(species);
  }

  private getGeneratedOffsetGym(): boolean {
    let ret = false;
    this.executeWithSeedOffset(
      () => {
        ret = !randSeedInt(2);
      },
      0,
      this.seed.toString(),
    );
    return ret;
  }

  private getGeneratedWaveCycleOffset(): number {
    let ret = 0;
    this.executeWithSeedOffset(
      () => {
        ret = randSeedInt(8) * 5;
      },
      0,
      this.seed.toString(),
    );
    return ret;
  }

  getEncounterBossSegments(waveIndex: number, level: number, species?: PokemonSpecies, forceBoss = false): number {
    if (Overrides.ENEMY_HEALTH_SEGMENTS_OVERRIDE > 1) {
      return Overrides.ENEMY_HEALTH_SEGMENTS_OVERRIDE;
    }
    if (Overrides.ENEMY_HEALTH_SEGMENTS_OVERRIDE === 1) {
      // The rest of the code expects to be returned 0 and not 1 if the enemy is not a boss
      return 0;
    }

    if (this.gameMode.isDaily && this.gameMode.isWaveFinal(waveIndex)) {
      return 5;
    }

    let isBoss: boolean | undefined;
    if (forceBoss || (species && (species.subLegendary || species.legendary || species.mythical))) {
      isBoss = true;
    } else {
      this.executeWithSeedOffset(() => {
        isBoss =
          waveIndex % 10 === 0
          || (this.gameMode.hasRandomBosses
            && randSeedInt(100) < Math.min(Math.max(Math.ceil((waveIndex - 250) / 50), 0) * 2, 30));
      }, waveIndex << 2);
    }
    if (!isBoss) {
      return 0;
    }

    let ret = 2;

    if (level >= 100) {
      ret++;
    }
    if (species && species.baseTotal >= 670) {
      ret++;
    }
    ret += Math.floor(waveIndex / 250);

    return ret;
  }

  trySpreadPokerus(): void {
    const party = this.getPlayerParty();
    const infectedIndexes: number[] = [];
    const spread = (index: number, spreadTo: number) => {
      const partyMember = party[index + spreadTo];
      if (!partyMember.pokerus && !randSeedInt(10)) {
        partyMember.pokerus = true;
        infectedIndexes.push(index + spreadTo);
      }
    };
    party.forEach((pokemon, p) => {
      if (!pokemon.pokerus || infectedIndexes.indexOf(p) > -1) {
        return;
      }

      this.executeWithSeedOffset(
        () => {
          if (p) {
            spread(p, -1);
          }
          if (p < party.length - 1) {
            spread(p, 1);
          }
        },
        this.currentBattle.waveIndex + (p << 8),
      );
    });
  }

  resetSeed(waveIndex?: number): void {
    const wave = waveIndex ?? this.currentBattle?.waveIndex ?? 0;
    this.waveSeed = shiftCharCodes(this.seed, wave);
    Phaser.Math.RND.sow([this.waveSeed]);
    console.log("Wave Seed:", this.waveSeed, wave);
    this.rngCounter = 0;
  }

  executeWithSeedOffset(func: () => void, offset: number, seedOverride?: string): void {
    if (!func) {
      return;
    }
    const tempRngCounter = this.rngCounter;
    const tempRngOffset = this.rngOffset;
    const tempRngSeedOverride = this.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    Phaser.Math.RND.sow([shiftCharCodes(seedOverride || this.seed, offset)]);
    this.rngCounter = 0;
    this.rngOffset = offset;
    this.rngSeedOverride = seedOverride || "";
    func();
    Phaser.Math.RND.state(state);
    this.rngCounter = tempRngCounter;
    this.rngOffset = tempRngOffset;
    this.rngSeedOverride = tempRngSeedOverride;
  }

  addFieldSprite(
    x: number,
    y: number,
    texture: string | Phaser.Textures.Texture,
    frame?: string | number,
    terrainColorRatio = 0,
  ): Phaser.GameObjects.Sprite {
    const ret = this.add.sprite(x, y, texture, frame);
    ret.setPipeline(this.fieldSpritePipeline);
    if (terrainColorRatio) {
      ret.pipelineData["terrainColorRatio"] = terrainColorRatio;
    }

    return ret;
  }

  addPokemonSprite(
    pokemon: Pokemon,
    x: number,
    y: number,
    texture: string | Phaser.Textures.Texture,
    frame?: string | number,
    hasShadow = false,
    ignoreOverride = false,
  ): Phaser.GameObjects.Sprite {
    const ret = this.addFieldSprite(x, y, texture, frame);
    this.initPokemonSprite(ret, pokemon, hasShadow, ignoreOverride);
    return ret;
  }

  initPokemonSprite(
    sprite: Phaser.GameObjects.Sprite,
    pokemon?: Pokemon,
    hasShadow = false,
    ignoreOverride = false,
  ): Phaser.GameObjects.Sprite {
    sprite.setPipeline(this.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      hasShadow,
      ignoreOverride,
      teraColor: pokemon ? getTypeRgb(pokemon.getTeraType()) : undefined,
      isTerastallized: pokemon ? pokemon.isTerastallized : false,
    });
    this.spriteSparkleHandler.add(sprite);
    return sprite;
  }

  moveBelowOverlay<T extends Phaser.GameObjects.GameObject>(gameObject: T) {
    this.fieldUI.moveBelow<any>(gameObject, this.fieldOverlay);
  }
  processInfoButton(pressed: boolean): void {
    this.arenaFlyout.toggleFlyout(pressed);
  }

  showFieldOverlay(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.fieldOverlay,
        alpha: 0.5,
        ease: "Sine.easeOut",
        duration,
        onComplete: () => resolve(),
      });
    });
  }

  hideFieldOverlay(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.fieldOverlay,
        alpha: 0,
        duration,
        ease: "Cubic.easeIn",
        onComplete: () => resolve(),
      });
    });
  }

  updateShopOverlayOpacity(value: number): void {
    this.shopOverlayOpacity = value;

    if (this.shopOverlayShown) {
      this.shopOverlay.setAlpha(this.shopOverlayOpacity);
    }
  }

  showShopOverlay(duration: number): Promise<void> {
    this.shopOverlayShown = true;
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.shopOverlay,
        alpha: this.shopOverlayOpacity,
        ease: "Sine.easeOut",
        duration,
        onComplete: () => resolve(),
      });
    });
  }

  hideShopOverlay(duration: number): Promise<void> {
    this.shopOverlayShown = false;
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.shopOverlay,
        alpha: 0,
        duration,
        ease: "Cubic.easeIn",
        onComplete: () => resolve(),
      });
    });
  }

  showEnemyModifierBar(): void {
    this.enemyModifierBar.setVisible(true);
  }

  hideEnemyModifierBar(): void {
    this.enemyModifierBar.setVisible(false);
  }

  updateBiomeWaveText(): void {
    const isBoss = !(this.currentBattle.waveIndex % 10);
    const biomeString: string = getBiomeName(this.arena.biomeType);
    this.fieldUI.moveAbove(this.biomeWaveText, this.luckText);
    this.biomeWaveText.setText(biomeString + " - " + this.currentBattle.waveIndex.toString());
    this.biomeWaveText.setColor(!isBoss ? "#ffffff" : "#f89890");
    this.biomeWaveText.setShadowColor(!isBoss ? "#636363" : "#984038");
    this.biomeWaveText.setVisible(true);
  }

  updateMoneyText(forceVisible = true): void {
    if (this.money === undefined) {
      return;
    }
    const formattedMoney = formatMoney(this.moneyFormat, this.money);
    this.moneyText.setText(i18next.t("battleScene:moneyOwned", { formattedMoney }));
    this.fieldUI.moveAbove(this.moneyText, this.luckText);
    if (forceVisible) {
      this.moneyText.setVisible(true);
    }
  }

  animateMoneyChanged(positiveChange: boolean): void {
    if (this.tweens.getTweensOf(this.moneyText).length > 0) {
      return;
    }
    const deltaScale = this.moneyText.scale * 0.14 * (positiveChange ? 1 : -1);
    this.moneyText.setShadowColor(positiveChange ? "#008000" : "#FF0000");
    this.tweens.add({
      targets: this.moneyText,
      duration: 250,
      scale: this.moneyText.scale + deltaScale,
      loop: 0,
      yoyo: true,
      onComplete: _ => this.moneyText.setShadowColor(getTextColor(TextStyle.MONEY, true)),
    });
  }

  updateScoreText(): void {
    this.scoreText.setText(`Score: ${this.score.toString()}`);
    this.scoreText.setVisible(this.gameMode.isDaily);
  }

  /**
   * Displays the current luck value.
   * @param duration The time for this label to fade in, if it is not already visible.
   */
  updateAndShowText(duration: number): void {
    const labels = [this.luckLabelText, this.luckText];
    for (const label of labels) {
      label.setAlpha(0);
    }
    const luckValue = getPartyLuckValue(this.getPlayerParty());
    this.luckText.setText(getLuckString(luckValue));
    if (luckValue < 14) {
      this.luckText.setTint(getLuckTextTint(luckValue));
    } else {
      this.luckText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
    }
    this.luckLabelText.setX(this.scaledCanvas.width - 2 - (this.luckText.displayWidth + 2));
    this.tweens.add({
      targets: labels,
      duration,
      alpha: 1,
      onComplete: () => {
        for (const label of labels) {
          label.setVisible(true);
        }
      },
    });
  }

  hideLuckText(duration: number): void {
    if (this.reroll) {
      return;
    }
    const labels = [this.luckLabelText, this.luckText];
    this.tweens.add({
      targets: labels,
      duration,
      alpha: 0,
      onComplete: () => {
        for (const label of labels) {
          label.setVisible(false);
        }
      },
    });
  }

  updateUIPositions(): void {
    const enemyModifierCount = this.enemyModifiers.filter(m => m.isIconVisible()).length;
    const biomeWaveTextHeight = this.biomeWaveText.getBottomLeft().y - this.biomeWaveText.getTopLeft().y;
    this.biomeWaveText.setY(
      -this.scaledCanvas.height
        + (enemyModifierCount ? (enemyModifierCount <= 12 ? 15 : 24) : 0)
        + biomeWaveTextHeight / 2,
    );
    this.moneyText.setY(this.biomeWaveText.y + 10);
    this.scoreText.setY(this.moneyText.y + 10);
    [this.luckLabelText, this.luckText].map(l =>
      l.setY((this.scoreText.visible ? this.scoreText : this.moneyText).y + 10),
    );
    const offsetY = (this.scoreText.visible ? this.scoreText : this.moneyText).y + 15;
    this.partyExpBar.setY(offsetY);
    this.candyBar.setY(offsetY + 15);
    this.ui?.achvBar.setY(this.scaledCanvas.height + offsetY);
  }

  /**
   * Pushes all {@linkcode Phaser.GameObjects.Text} objects in the top right to the bottom of the canvas
   */
  sendTextToBack(): void {
    this.fieldUI.sendToBack(this.biomeWaveText);
    this.fieldUI.sendToBack(this.moneyText);
    this.fieldUI.sendToBack(this.scoreText);
  }

  addFaintedEnemyScore(enemy: EnemyPokemon): void {
    let scoreIncrease =
      enemy.getSpeciesForm().getBaseExp()
      * (enemy.level / this.getMaxExpLevel())
      * ((enemy.ivs.reduce((iv: number, total: number) => (total += iv), 0) / 93) * 0.2 + 0.8);
    this.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemy.id, false).map(
      m => (scoreIncrease *= (m as PokemonHeldItemModifier).getScoreMultiplier()),
    );
    if (enemy.isBoss()) {
      scoreIncrease *= Math.sqrt(enemy.bossSegments);
    }
    this.currentBattle.battleScore += Math.ceil(scoreIncrease);
  }

  getMaxExpLevel(ignoreLevelCap = false): number {
    const capOverride = Overrides.LEVEL_CAP_OVERRIDE ?? 0;
    if (capOverride > 0) {
      return capOverride;
    }

    if (ignoreLevelCap || capOverride < 0) {
      return Number.MAX_SAFE_INTEGER;
    }

    const waveIndex = Math.ceil((this.currentBattle?.waveIndex || 1) / 10) * 10;
    const difficultyWaveIndex = this.gameMode.getWaveForDifficulty(waveIndex);
    const baseLevel = (1 + difficultyWaveIndex / 2 + Math.pow(difficultyWaveIndex / 25, 2)) * 1.2;
    return Math.ceil(baseLevel / 2) * 2 + 2;
  }

  randomSpecies(
    waveIndex: number,
    level: number,
    fromArenaPool?: boolean,
    speciesFilter?: PokemonSpeciesFilter,
    filterAllEvolutions?: boolean,
  ): PokemonSpecies {
    if (fromArenaPool) {
      return this.arena.randomSpecies(waveIndex, level, undefined, getPartyLuckValue(this.party));
    }
    const filteredSpecies = speciesFilter
      ? [
          ...new Set(
            allSpecies
              .filter(s => s.isCatchable())
              .filter(speciesFilter)
              .map(s => {
                if (!filterAllEvolutions) {
                  while (pokemonPrevolutions.hasOwnProperty(s.speciesId)) {
                    s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
                  }
                }
                return s;
              }),
          ),
        ]
      : allSpecies.filter(s => s.isCatchable());
    // TODO: should this use `randSeedItem`?
    return filteredSpecies[randSeedInt(filteredSpecies.length)];
  }

  generateRandomBiome(waveIndex: number): BiomeId {
    const relWave = waveIndex % 250;
    const biomes = getEnumValues(BiomeId).filter(b => b !== BiomeId.TOWN && b !== BiomeId.END);
    const maxDepth = biomeDepths[BiomeId.END][0] - 2;
    const depthWeights = new Array(maxDepth + 1)
      .fill(null)
      .map((_, i: number) => ((1 - Math.min(Math.abs(i / (maxDepth - 1) - relWave / 250) + 0.25, 1)) / 0.75) * 250);
    const biomeThresholds: number[] = [];
    let totalWeight = 0;
    for (const biome of biomes) {
      totalWeight += Math.ceil(depthWeights[biomeDepths[biome][0] - 1] / biomeDepths[biome][1]);
      biomeThresholds.push(totalWeight);
    }

    const randInt = randSeedInt(totalWeight);

    for (let i = 0; i < biomes.length; i++) {
      if (randInt < biomeThresholds[i]) {
        return biomes[i];
      }
    }

    // TODO: should this use `randSeedItem`?
    return biomes[randSeedInt(biomes.length)];
  }

  isBgmPlaying(): boolean {
    return this.bgm?.isPlaying ?? false;
  }

  playBgm(bgmName?: string, fadeOut?: boolean): void {
    if (bgmName === undefined) {
      bgmName = this.currentBattle?.getBgmOverride() || this.arena?.bgm;
    }

    bgmName = timedEventManager.getEventBgmReplacement(bgmName);

    if (this.bgm && bgmName === this.bgm.key) {
      if (!this.bgm.isPlaying) {
        this.bgm.play({
          volume: this.masterVolume * this.bgmVolume,
        });
      }
      return;
    }
    if (fadeOut && !this.bgm) {
      fadeOut = false;
    }
    this.bgmCache.add(bgmName);
    this.loadBgm(bgmName);
    let loopPoint = 0;
    loopPoint = bgmName === this.arena.bgm ? this.arena.getBgmLoopPoint() : this.getBgmLoopPoint(bgmName);
    let loaded = false;
    const playNewBgm = () => {
      this.ui.bgmBar.setBgmToBgmBar(bgmName);
      if (bgmName === null && this.bgm && !this.bgm.pendingRemove) {
        this.bgm.play({
          volume: this.masterVolume * this.bgmVolume,
        });
        return;
      }
      if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying) {
        this.bgm.stop();
      }
      this.bgm = this.sound.add(bgmName, { loop: true });
      this.bgm.play({
        volume: this.masterVolume * this.bgmVolume,
      });
      if (loopPoint) {
        this.bgm.on("looped", () => this.bgm.play({ seek: loopPoint }));
      }
    };
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      loaded = true;
      if (!fadeOut || !this.bgm.isPlaying) {
        playNewBgm();
      }
    });
    if (fadeOut) {
      const onBgmFaded = () => {
        if (loaded && (!this.bgm.isPlaying || this.bgm.pendingRemove)) {
          playNewBgm();
        }
      };
      this.time.delayedCall(this.fadeOutBgm(500, true) ? 750 : 250, onBgmFaded);
    }
    if (!this.load.isLoading()) {
      this.load.start();
    }
  }

  pauseBgm(): boolean {
    if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying) {
      this.bgm.pause();
      return true;
    }
    return false;
  }

  resumeBgm(): boolean {
    if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPaused) {
      this.bgm.resume();
      return true;
    }
    return false;
  }

  updateSoundVolume(): void {
    if (this.sound) {
      for (const sound of this.sound.getAllPlaying() as AnySound[]) {
        if (this.bgmCache.has(sound.key)) {
          sound.setVolume(this.masterVolume * this.bgmVolume);
        } else {
          const soundDetails = sound.key.split("/");
          switch (soundDetails[0]) {
            case "battle_anims":
            case "cry":
              if (soundDetails[1].startsWith("PRSFX- ")) {
                sound.setVolume(this.masterVolume * this.fieldVolume * 0.5);
              } else {
                sound.setVolume(this.masterVolume * this.fieldVolume);
              }
              break;
            case "se":
            case "ui":
              sound.setVolume(this.masterVolume * this.seVolume);
          }
        }
      }
    }
  }

  fadeOutBgm(duration = 500, destroy = true): boolean {
    if (!this.bgm) {
      return false;
    }
    const bgm = this.sound.getAllPlaying().find(bgm => bgm.key === this.bgm.key);
    if (bgm) {
      SoundFade.fadeOut(this, this.bgm, duration, destroy);
      return true;
    }

    return false;
  }

  /**
   * Fades out current track for `delay` ms, then fades in new track.
   * @param newBgmKey
   * @param destroy
   * @param delay
   */
  fadeAndSwitchBgm(newBgmKey: string, destroy = false, delay = 2000) {
    this.fadeOutBgm(delay, destroy);
    this.time.delayedCall(delay, () => {
      this.playBgm(newBgmKey);
    });
  }

  playSound(sound: string | AnySound, config?: object): AnySound | null {
    const key = typeof sound === "string" ? sound : sound.key;
    config = config ?? {};
    try {
      const keyDetails = key.split("/");
      config["volume"] = config["volume"] ?? 1;
      switch (keyDetails[0]) {
        case "level_up_fanfare":
        case "item_fanfare":
        case "minor_fanfare":
        case "heal":
        case "evolution":
        case "evolution_fanfare":
          // These sounds are loaded in as BGM, but played as sound effects
          // When these sounds are updated in updateVolume(), they are treated as BGM however because they are placed in the BGM Cache through being called by playSoundWithoutBGM()
          config["volume"] *= this.masterVolume * this.bgmVolume;
          break;
        case "battle_anims":
        case "cry":
          config["volume"] *= this.masterVolume * this.fieldVolume;
          //PRSFX sound files are unusually loud
          if (keyDetails[1].startsWith("PRSFX- ")) {
            config["volume"] *= 0.5;
          }
          break;
        case "ui":
          //As of, right now this applies to the "select", "menu_open", "error" sound effects
          config["volume"] *= this.masterVolume * this.uiVolume;
          break;
        case "se":
          config["volume"] *= this.masterVolume * this.seVolume;
          break;
      }
      this.sound.play(key, config);
      return this.sound.get(key) as AnySound;
    } catch {
      console.warn(`${key} not found`);
      return null;
    }
  }

  playSoundWithoutBgm(soundName: string, pauseDuration?: number): AnySound | null {
    this.bgmCache.add(soundName);
    const resumeBgm = this.pauseBgm();
    this.playSound(soundName);
    const sound = this.sound.get(soundName);
    if (!sound) {
      return sound;
    }
    if (this.bgmResumeTimer) {
      this.bgmResumeTimer.destroy();
    }
    if (resumeBgm) {
      this.bgmResumeTimer = this.time.delayedCall(pauseDuration || fixedInt(sound.totalDuration * 1000), () => {
        this.resumeBgm();
        this.bgmResumeTimer = null;
      });
    }
    return sound as AnySound;
  }

  /** The loop point of any given battle, mystery encounter, or title track, read as seconds and milliseconds. */
  getBgmLoopPoint(bgmName: string): number {
    switch (bgmName) {
      case "title": //Firel PokéRogue Title
        return 46.5;
      case "battle_kanto_champion": //B2W2 Kanto Champion Battle
        return 13.95;
      case "battle_johto_champion": //B2W2 Johto Champion Battle
        return 23.498;
      case "battle_hoenn_champion_g5": //B2W2 Hoenn Champion Battle
        return 11.328;
      case "battle_hoenn_champion_g6": //ORAS Hoenn Champion Battle
        return 11.762;
      case "battle_sinnoh_champion": //B2W2 Sinnoh Champion Battle
        return 12.235;
      case "battle_champion_alder": //BW Unova Champion Battle
        return 27.653;
      case "battle_champion_iris": //B2W2 Unova Champion Battle
        return 10.145;
      case "battle_kalos_champion": //XY Kalos Champion Battle
        return 10.38;
      case "battle_champion_kukui": //SM Kukui Battle
        return 15.784;
      case "battle_alola_champion": //USUM Alola Champion Battle
        return 13.025;
      case "battle_galar_champion": //SWSH Galar Champion Battle
        return 61.635;
      case "battle_mustard": //SWSH Mustard Battle
        return 22.442;
      case "battle_champion_geeta": //SV Champion Geeta Battle
        return 37.447;
      case "battle_champion_nemona": //SV Champion Nemona Battle
        return 14.914;
      case "battle_champion_kieran": //SV Champion Kieran Battle
        return 7.206;
      case "battle_hoenn_elite": //ORAS Elite Four Battle
        return 11.35;
      case "battle_unova_elite": //BW Elite Four Battle
        return 17.73;
      case "battle_kalos_elite": //XY Elite Four Battle
        return 12.34;
      case "battle_alola_elite": //SM Elite Four Battle
        return 19.212;
      case "battle_galar_elite": //SWSH League Tournament Battle
        return 164.069;
      case "battle_paldea_elite": //SV Elite Four Battle
        return 12.77;
      case "battle_bb_elite": //SV BB League Elite Four Battle
        return 19.434;
      case "battle_final_encounter": //PMD RTDX Rayquaza's Domain
        return 19.159;
      case "battle_final": //BW Ghetsis Battle
        return 16.453;
      case "battle_kanto_gym": //B2W2 Kanto Gym Battle
        return 13.857;
      case "battle_johto_gym": //B2W2 Johto Gym Battle
        return 12.911;
      case "battle_hoenn_gym": //B2W2 Hoenn Gym Battle
        return 12.379;
      case "battle_sinnoh_gym": //B2W2 Sinnoh Gym Battle
        return 13.122;
      case "battle_unova_gym": //BW Unova Gym Battle
        return 19.145;
      case "battle_kalos_gym": //XY Kalos Gym Battle
        return 44.81;
      case "battle_galar_gym": //SWSH Galar Gym Battle
        return 171.262;
      case "battle_paldea_gym": //SV Paldea Gym Battle
        return 127.489;
      case "battle_legendary_kanto": //XY Kanto Legendary Battle
        return 32.966;
      case "battle_legendary_raikou": //HGSS Raikou Battle
        return 12.632;
      case "battle_legendary_entei": //HGSS Entei Battle
        return 2.905;
      case "battle_legendary_suicune": //HGSS Suicune Battle
        return 12.636;
      case "battle_legendary_lugia": //HGSS Lugia Battle
        return 19.77;
      case "battle_legendary_ho_oh": //HGSS Ho-oh Battle
        return 17.668;
      case "battle_legendary_regis_g5": //B2W2 Legendary Titan Battle
        return 49.5;
      case "battle_legendary_regis_g6": //ORAS Legendary Titan Battle
        return 21.13;
      case "battle_legendary_gro_kyo": //ORAS Groudon & Kyogre Battle
        return 10.547;
      case "battle_legendary_rayquaza": //ORAS Rayquaza Battle
        return 10.495;
      case "battle_legendary_deoxys": //ORAS Deoxys Battle
        return 13.333;
      case "battle_legendary_lake_trio": //ORAS Lake Guardians Battle
        return 16.887;
      case "battle_legendary_sinnoh": //ORAS Sinnoh Legendary Battle
        return 22.77;
      case "battle_legendary_dia_pal": //ORAS Dialga & Palkia Battle
        return 16.009;
      case "battle_legendary_origin_forme": //LA Origin Dialga & Palkia Battle
        return 18.961;
      case "battle_legendary_giratina": //ORAS Giratina Battle
        return 10.451;
      case "battle_legendary_arceus": //HGSS Arceus Battle
        return 9.595;
      case "battle_legendary_unova": //BW Unova Legendary Battle
        return 13.855;
      case "battle_legendary_kyurem": //BW Kyurem Battle
        return 18.314;
      case "battle_legendary_res_zek": //BW Reshiram & Zekrom Battle
        return 18.329;
      case "battle_legendary_xern_yvel": //XY Xerneas & Yveltal Battle
        return 26.468;
      case "battle_legendary_tapu": //SM Tapu Battle
        return 0.0;
      case "battle_legendary_sol_lun": //SM Solgaleo & Lunala Battle
        return 6.525;
      case "battle_legendary_ub": //SM Ultra Beast Battle
        return 9.818;
      case "battle_legendary_dusk_dawn": //USUM Dusk Mane & Dawn Wings Necrozma Battle
        return 5.211;
      case "battle_legendary_ultra_nec": //USUM Ultra Necrozma Battle
        return 10.344;
      case "battle_legendary_zac_zam": //SWSH Zacian & Zamazenta Battle
        return 11.424;
      case "battle_legendary_eternatus_p1": //SWSH Eternatus Battle
        return 11.102;
      case "battle_legendary_eternatus_p2": //SWSH Eternamax Eternatus Battle
        return 0.0;
      case "battle_legendary_glas_spec": //SWSH Glastrier & Spectrier Battle
        return 12.503;
      case "battle_legendary_calyrex": //SWSH Calyrex Battle
        return 50.641;
      case "battle_legendary_riders": //SWSH Ice & Shadow Rider Calyrex Battle
        return 18.155;
      case "battle_legendary_birds_galar": //SWSH Galarian Legendary Birds Battle
        return 0.175;
      case "battle_legendary_ruinous": //SV Treasures of Ruin Battle
        return 6.333;
      case "battle_legendary_kor_mir": //SV Depths of Area Zero Battle
        return 6.442;
      case "battle_legendary_loyal_three": //SV Loyal Three Battle
        return 6.5;
      case "battle_legendary_ogerpon": //SV Ogerpon Battle
        return 14.335;
      case "battle_legendary_terapagos": //SV Terapagos Battle
        return 24.377;
      case "battle_legendary_pecharunt": //SV Pecharunt Battle
        return 6.508;
      case "battle_rival": //BW Rival Battle
        return 14.11;
      case "battle_rival_2": //BW N Battle
        return 17.714;
      case "battle_rival_3": //BW Final N Battle
        return 17.586;
      case "battle_trainer": //BW Trainer Battle
        return 13.686;
      case "battle_wild": //BW Wild Battle
        return 12.703;
      case "battle_wild_strong": //BW Strong Wild Battle
        return 13.94;
      case "end_summit": //PMD RTDX Sky Tower Summit
        return 30.025;
      case "battle_rocket_grunt": //HGSS Team Rocket Battle
        return 12.707;
      case "battle_aqua_magma_grunt": //ORAS Team Aqua & Magma Battle
        return 12.062;
      case "battle_galactic_grunt": //BDSP Team Galactic Battle
        return 13.043;
      case "battle_plasma_grunt": //B2W2 Team Plasma Battle
        return 14.758;
      case "battle_flare_grunt": //XY Team Flare Battle
        return 4.228;
      case "battle_aether_grunt": // SM Aether Foundation Battle
        return 16.0;
      case "battle_skull_grunt": // SM Team Skull Battle
        return 20.87;
      case "battle_macro_grunt": // SWSH Trainer Battle
        return 11.56;
      case "battle_star_grunt": //SV Team Star Battle
        return 133.362;
      case "battle_galactic_admin": //BDSP Team Galactic Admin Battle
        return 11.997;
      case "battle_colress": //B2W2 Colress Battle
        return 12.234;
      case "battle_skull_admin": //SM Team Skull Admin Battle
        return 15.463;
      case "battle_oleana": //SWSH Oleana Battle
        return 14.11;
      case "battle_star_admin": //SV Team Star Boss Battle
        return 9.493;
      case "battle_rocket_boss": //USUM Giovanni Battle
        return 9.115;
      case "battle_aqua_magma_boss": //ORAS Archie & Maxie Battle
        return 14.847;
      case "battle_galactic_boss": //BDSP Cyrus Battle
        return 106.962;
      case "battle_plasma_boss": //B2W2 Ghetsis Battle
        return 25.624;
      case "battle_flare_boss": //XY Lysandre Battle
        return 8.085;
      case "battle_aether_boss": //SM Lusamine Battle
        return 11.33;
      case "battle_skull_boss": //SM Guzma Battle
        return 13.13;
      case "battle_macro_boss": //SWSH Rose Battle
        return 11.42;
      case "battle_star_boss": //SV Cassiopeia Battle
        return 25.764;
      case "mystery_encounter_gen_5_gts": // BW GTS
        return 8.52;
      case "mystery_encounter_gen_6_gts": // XY GTS
        return 9.24;
      case "mystery_encounter_fun_and_games": // EoS Guildmaster Wigglytuff
        return 4.78;
      case "mystery_encounter_weird_dream": // EoS Temporal Spire
        return 41.42;
      case "mystery_encounter_delibirdy": // Firel Delibirdy
        return 82.28;
      case "title_afd": // Andr06 - PokéRogue Title Remix (AFD)
        return 47.66;
      case "battle_rival_3_afd": // Andr06 - Final N Battle Remix (AFD)
        return 49.147;
    }

    return 0;
  }

  toggleInvert(invert: boolean): void {
    if (invert) {
      this.cameras.main.setPostPipeline(InvertPostFX);
    } else {
      this.cameras.main.removePostPipeline("InvertPostFX");
    }
  }

  addMoney(amount: number): void {
    this.money = Math.min(this.money + amount, Number.MAX_SAFE_INTEGER);
    this.updateMoneyText();
    this.animateMoneyChanged(true);
    this.validateAchvs(MoneyAchv);
  }

  getWaveMoneyAmount(moneyMultiplier: number): number {
    const waveIndex = this.currentBattle.waveIndex;
    const waveSetIndex = Math.ceil(waveIndex / 10) - 1;
    const moneyValue =
      Math.pow((waveSetIndex + 1 + (0.75 + (((waveIndex - 1) % 10) + 1) / 10)) * 100, 1 + 0.005 * waveSetIndex)
      * moneyMultiplier;
    return Math.floor(moneyValue / 10) * 10;
  }

  addModifier(
    modifier: Modifier | null,
    ignoreUpdate?: boolean,
    playSound?: boolean,
    virtual?: boolean,
    instant?: boolean,
    cost?: number,
  ): boolean {
    // We check against modifier.type to stop a bug related to loading in a pokemon that has a form change item, which prior to some patch
    // that changed form change modifiers worked, had previously set the `type` field to null.
    // TODO: This is not the right place to check for this; it should ideally go in a session migrator.
    if (!modifier || !modifier.type) {
      return false;
    }
    let success = false;
    const soundName = modifier.type.soundName;
    this.validateAchvs(ModifierAchv, modifier);
    const modifiersToRemove: PersistentModifier[] = [];
    if (modifier instanceof PersistentModifier) {
      if ((modifier as PersistentModifier).add(this.modifiers, !!virtual)) {
        if (modifier instanceof PokemonFormChangeItemModifier) {
          const pokemon = this.getPokemonById(modifier.pokemonId);
          if (pokemon) {
            success = modifier.apply(pokemon, true);
          }
        }
        if (playSound && !this.sound.get(soundName)) {
          this.playSound(soundName);
        }
      } else if (!virtual) {
        const defaultModifierType = getDefaultModifierTypeForTier(modifier.type.tier);
        this.phaseManager.queueMessage(
          i18next.t("battle:itemStackFull", {
            fullItemName: modifier.type.name,
            itemName: defaultModifierType.name,
          }),
          undefined,
          false,
          3000,
        );
        return this.addModifier(defaultModifierType.newModifier(), ignoreUpdate, playSound, false, instant);
      }

      for (const rm of modifiersToRemove) {
        this.removeModifier(rm);
      }

      if (!ignoreUpdate && !virtual) {
        this.updateModifiers(true, instant);
      }
    } else if (modifier instanceof ConsumableModifier) {
      if (playSound && !this.sound.get(soundName)) {
        this.playSound(soundName);
      }

      if (modifier instanceof ConsumablePokemonModifier) {
        for (const p in this.party) {
          const pokemon = this.party[p];

          const args: unknown[] = [];
          if (modifier instanceof PokemonHpRestoreModifier) {
            if (!(modifier as PokemonHpRestoreModifier).fainted) {
              const hpRestoreMultiplier = new NumberHolder(1);
              this.applyModifiers(HealingBoosterModifier, true, hpRestoreMultiplier);
              args.push(hpRestoreMultiplier.value);
            } else {
              args.push(1);
            }
          } else if (modifier instanceof FusePokemonModifier) {
            args.push(this.getPokemonById(modifier.fusePokemonId) as PlayerPokemon);
          } else if (modifier instanceof RememberMoveModifier && !isNullOrUndefined(cost)) {
            args.push(cost);
          }

          if (modifier.shouldApply(pokemon, ...args)) {
            const result = modifier.apply(pokemon, ...args);
            success ||= result;
          }
        }

        this.party.forEach(p => {
          p.updateInfo(instant);
        });
      } else {
        const args = [this];
        if (modifier.shouldApply(...args)) {
          const result = modifier.apply(...args);
          success ||= result;
        }
      }
    }
    return success;
  }

  addEnemyModifier(modifier: PersistentModifier, ignoreUpdate?: boolean, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      const modifiersToRemove: PersistentModifier[] = [];
      if ((modifier as PersistentModifier).add(this.enemyModifiers, false)) {
        if (modifier instanceof PokemonFormChangeItemModifier) {
          const pokemon = this.getPokemonById(modifier.pokemonId);
          if (pokemon) {
            modifier.apply(pokemon, true);
          }
        }
        for (const rm of modifiersToRemove) {
          this.removeModifier(rm, true);
        }
      }
      if (!ignoreUpdate) {
        this.updateModifiers(false, instant);
      }
      resolve();
    });
  }

  /**
   * Try to transfer a held item to another pokemon.
   * If the recepient already has the maximum amount allowed for this item, the transfer is cancelled.
   * The quantity to transfer is automatically capped at how much the recepient can take before reaching the maximum stack size for the item.
   * A transfer that moves a quantity smaller than what is specified in the transferQuantity parameter is still considered successful.
   * @param itemModifier {@linkcode PokemonHeldItemModifier} item to transfer (represents the whole stack)
   * @param target {@linkcode Pokemon} recepient in this transfer
   * @param playSound `true` to play a sound when transferring the item
   * @param transferQuantity How many items of the stack to transfer. Optional, defaults to `1`
   * @param instant ??? (Optional)
   * @param ignoreUpdate ??? (Optional)
   * @param itemLost If `true`, treat the item's current holder as losing the item (for now, this simply enables Unburden). Default is `true`.
   * @returns `true` if the transfer was successful
   */
  tryTransferHeldItemModifier(
    itemModifier: PokemonHeldItemModifier,
    target: Pokemon,
    playSound: boolean,
    transferQuantity = 1,
    instant?: boolean,
    ignoreUpdate?: boolean,
    itemLost = true,
  ): boolean {
    const source = itemModifier.pokemonId ? itemModifier.getPokemon() : null;
    const cancelled = new BooleanHolder(false);

    if (source && source.isPlayer() !== target.isPlayer()) {
      applyAbAttrs("BlockItemTheftAbAttr", { pokemon: source, cancelled });
    }

    if (cancelled.value) {
      return false;
    }

    const newItemModifier = itemModifier.clone() as PokemonHeldItemModifier;
    newItemModifier.pokemonId = target.id;
    const matchingModifier = this.findModifier(
      m => m instanceof PokemonHeldItemModifier && m.matchType(itemModifier) && m.pokemonId === target.id,
      target.isPlayer(),
    ) as PokemonHeldItemModifier;

    if (matchingModifier) {
      const maxStackCount = matchingModifier.getMaxStackCount();
      if (matchingModifier.stackCount >= maxStackCount) {
        return false;
      }
      const countTaken = Math.min(
        transferQuantity,
        itemModifier.stackCount,
        maxStackCount - matchingModifier.stackCount,
      );
      itemModifier.stackCount -= countTaken;
      newItemModifier.stackCount = matchingModifier.stackCount + countTaken;
    } else {
      const countTaken = Math.min(transferQuantity, itemModifier.stackCount);
      itemModifier.stackCount -= countTaken;
      newItemModifier.stackCount = countTaken;
    }

    const removeOld = itemModifier.stackCount === 0;

    if (!removeOld || !source || this.removeModifier(itemModifier, source.isEnemy())) {
      const addModifier = () => {
        if (!matchingModifier || this.removeModifier(matchingModifier, target.isEnemy())) {
          if (target.isPlayer()) {
            this.addModifier(newItemModifier, ignoreUpdate, playSound, false, instant);
            if (source && itemLost) {
              applyAbAttrs("PostItemLostAbAttr", { pokemon: source });
            }
            return true;
          }
          this.addEnemyModifier(newItemModifier, ignoreUpdate, instant);
          if (source && itemLost) {
            applyAbAttrs("PostItemLostAbAttr", { pokemon: source });
          }
          return true;
        }
        return false;
      };
      if (source && source.isPlayer() !== target.isPlayer() && !ignoreUpdate) {
        this.updateModifiers(source.isPlayer(), instant);
        addModifier();
      } else {
        addModifier();
      }
      return true;
    }
    return false;
  }
  /**
   * Attempt to discard one or more copies of a held item.
   * @param itemModifier - The {@linkcode PokemonHeldItemModifier} being discarded
   * @param discardQuantity - The number of copies to remove (up to the amount currently held); default `1`
   * @returns Whether the item was successfully discarded.
   * Removing fewer items than requested is still considered a success.
   */
  tryDiscardHeldItemModifier(itemModifier: PokemonHeldItemModifier, discardQuantity = 1): boolean {
    const countTaken = Math.min(discardQuantity, itemModifier.stackCount);
    itemModifier.stackCount -= countTaken;

    if (itemModifier.stackCount > 0) {
      return true;
    }

    return this.removeModifier(itemModifier);
  }

  canTransferHeldItemModifier(itemModifier: PokemonHeldItemModifier, target: Pokemon, transferQuantity = 1): boolean {
    const mod = itemModifier.clone() as PokemonHeldItemModifier;
    const source = mod.pokemonId ? mod.getPokemon() : null;
    const cancelled = new BooleanHolder(false);

    if (source && source.isPlayer() !== target.isPlayer()) {
      applyAbAttrs("BlockItemTheftAbAttr", { pokemon: source, cancelled });
    }

    if (cancelled.value) {
      return false;
    }

    const matchingModifier = this.findModifier(
      m => m instanceof PokemonHeldItemModifier && m.matchType(mod) && m.pokemonId === target.id,
      target.isPlayer(),
    ) as PokemonHeldItemModifier;

    if (matchingModifier) {
      const maxStackCount = matchingModifier.getMaxStackCount();
      if (matchingModifier.stackCount >= maxStackCount) {
        return false;
      }
      const countTaken = Math.min(transferQuantity, mod.stackCount, maxStackCount - matchingModifier.stackCount);
      mod.stackCount -= countTaken;
    } else {
      const countTaken = Math.min(transferQuantity, mod.stackCount);
      mod.stackCount -= countTaken;
    }

    const removeOld = mod.stackCount === 0;

    return !removeOld || !source || this.hasModifier(itemModifier, !source.isPlayer());
  }

  removePartyMemberModifiers(partyMemberIndex: number): Promise<void> {
    return new Promise(resolve => {
      const pokemonId = this.getPlayerParty()[partyMemberIndex].id;
      const modifiersToRemove = this.modifiers.filter(
        m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === pokemonId,
      );
      for (const m of modifiersToRemove) {
        this.modifiers.splice(this.modifiers.indexOf(m), 1);
      }
      this.updateModifiers();
      resolve();
    });
  }

  generateEnemyModifiers(heldModifiersConfigs?: HeldModifierConfig[][]): Promise<void> {
    return new Promise(resolve => {
      if (this.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
        return resolve();
      }
      const difficultyWaveIndex = this.gameMode.getWaveForDifficulty(this.currentBattle.waveIndex);
      const isFinalBoss = this.gameMode.isWaveFinal(this.currentBattle.waveIndex);
      let chances = Math.ceil(difficultyWaveIndex / 10);
      if (isFinalBoss) {
        chances = Math.ceil(chances * 2.5);
      }

      const party = this.getEnemyParty();

      if (this.currentBattle.trainer) {
        const modifiers = this.currentBattle.trainer.genModifiers(party);
        for (const modifier of modifiers) {
          this.addEnemyModifier(modifier, true, true);
        }
      }

      party.forEach((enemyPokemon: EnemyPokemon, i: number) => {
        if (heldModifiersConfigs && i < heldModifiersConfigs.length && heldModifiersConfigs[i]) {
          for (const mt of heldModifiersConfigs[i]) {
            let modifier: PokemonHeldItemModifier;
            if (mt.modifier instanceof PokemonHeldItemModifierType) {
              modifier = mt.modifier.newModifier(enemyPokemon);
            } else {
              modifier = mt.modifier as PokemonHeldItemModifier;
              modifier.pokemonId = enemyPokemon.id;
            }
            modifier.stackCount = mt.stackCount ?? 1;
            modifier.isTransferable = mt.isTransferable ?? modifier.isTransferable;
            this.addEnemyModifier(modifier, true);
          }
        } else {
          const isBoss =
            enemyPokemon.isBoss()
            || (this.currentBattle.battleType === BattleType.TRAINER && !!this.currentBattle.trainer?.config.isBoss);
          let upgradeChance = 32;
          if (isBoss) {
            upgradeChance /= 2;
          }
          if (isFinalBoss) {
            upgradeChance /= 8;
          }
          let count = 0;
          for (let c = 0; c < chances; c++) {
            if (!randSeedInt(this.gameMode.getEnemyModifierChance(isBoss))) {
              count++;
            }
          }
          if (isBoss) {
            count = Math.max(count, Math.floor(chances / 2));
          }
          getEnemyModifierTypesForWave(
            difficultyWaveIndex,
            count,
            [enemyPokemon],
            this.currentBattle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD,
            upgradeChance,
          ).map(mt => mt.newModifier(enemyPokemon).add(this.enemyModifiers, false));
        }
        return true;
      });
      this.updateModifiers(false);
      resolve();
    });
  }

  /**
   * Removes all modifiers from enemy pokemon of {@linkcode PersistentModifier} type
   */
  clearEnemyModifiers(): void {
    const modifiersToRemove = this.enemyModifiers.filter(m => m instanceof PersistentModifier);
    for (const m of modifiersToRemove) {
      this.enemyModifiers.splice(this.enemyModifiers.indexOf(m), 1);
    }
    this.updateModifiers(false);
    this.updateUIPositions();
  }

  /**
   * Removes all modifiers from enemy pokemon of {@linkcode PokemonHeldItemModifier} type
   * @param pokemon - If specified, only removes held items from that {@linkcode Pokemon}
   */
  clearEnemyHeldItemModifiers(pokemon?: Pokemon): void {
    const modifiersToRemove = this.enemyModifiers.filter(
      m => m instanceof PokemonHeldItemModifier && (!pokemon || m.getPokemon() === pokemon),
    );
    for (const m of modifiersToRemove) {
      this.enemyModifiers.splice(this.enemyModifiers.indexOf(m), 1);
    }
    this.updateModifiers(false);
    this.updateUIPositions();
  }

  setModifiersVisible(visible: boolean) {
    [this.modifierBar, this.enemyModifierBar].map(m => m.setVisible(visible));
  }

  // TODO: Document this
  updateModifiers(player = true, instant?: boolean): void {
    const modifiers = player ? this.modifiers : (this.enemyModifiers as PersistentModifier[]);
    for (let m = 0; m < modifiers.length; m++) {
      const modifier = modifiers[m];
      if (
        modifier instanceof PokemonHeldItemModifier
        && !this.getPokemonById((modifier as PokemonHeldItemModifier).pokemonId)
      ) {
        modifiers.splice(m--, 1);
      }
      if (
        modifier instanceof PokemonHeldItemModifier
        && !isNullOrUndefined(modifier.getSpecies())
        && !this.getPokemonById(modifier.pokemonId)?.hasSpecies(modifier.getSpecies()!)
      ) {
        modifiers.splice(m--, 1);
      }
    }
    for (const modifier of modifiers) {
      if (modifier instanceof PersistentModifier) {
        (modifier as PersistentModifier).virtualStackCount = 0;
      }
    }

    const modifiersClone = modifiers.slice(0);
    for (const modifier of modifiersClone) {
      if (!modifier.getStackCount()) {
        modifiers.splice(modifiers.indexOf(modifier), 1);
      }
    }

    this.updatePartyForModifiers(player ? this.getPlayerParty() : this.getEnemyParty(), instant);
    (player ? this.modifierBar : this.enemyModifierBar).updateModifiers(modifiers);
    if (!player) {
      this.updateUIPositions();
    }
  }

  updatePartyForModifiers(party: Pokemon[], instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      Promise.allSettled(
        party.map(p => {
          p.calculateStats();
          return p.updateInfo(instant);
        }),
      ).then(() => resolve());
    });
  }

  hasModifier(modifier: PersistentModifier, enemy = false): boolean {
    const modifiers = !enemy ? this.modifiers : this.enemyModifiers;
    return modifiers.indexOf(modifier) > -1;
  }

  /**
   * Removes a currently owned item. If the item is stacked, the entire item stack
   * gets removed. This function does NOT apply in-battle effects, such as Unburden.
   * If in-battle effects are needed, use {@linkcode Pokemon.loseHeldItem} instead.
   * @param modifier The item to be removed.
   * @param enemy `true` to remove an item owned by the enemy rather than the player; default `false`.
   * @returns `true` if the item exists and was successfully removed, `false` otherwise
   */
  removeModifier(modifier: PersistentModifier, enemy = false): boolean {
    const modifiers = !enemy ? this.modifiers : this.enemyModifiers;
    const modifierIndex = modifiers.indexOf(modifier);
    if (modifierIndex > -1) {
      modifiers.splice(modifierIndex, 1);
      if (modifier instanceof PokemonFormChangeItemModifier) {
        const pokemon = this.getPokemonById(modifier.pokemonId);
        if (pokemon) {
          modifier.apply(pokemon, false);
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Get all of the modifiers that match `modifierType`
   * @param modifierType The type of modifier to apply; must extend {@linkcode PersistentModifier}
   * @param player Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @returns the list of all modifiers that matched `modifierType`.
   */
  getModifiers<T extends PersistentModifier>(modifierType: Constructor<T>, player = true): T[] {
    return (player ? this.modifiers : this.enemyModifiers).filter((m): m is T => m instanceof modifierType);
  }

  /**
   * Get all of the modifiers that pass the `modifierFilter` function
   * @param modifierFilter The function used to filter a target's modifiers
   * @param isPlayer Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @returns the list of all modifiers that passed the `modifierFilter` function
   */
  findModifiers(modifierFilter: ModifierPredicate, isPlayer = true): PersistentModifier[] {
    return (isPlayer ? this.modifiers : this.enemyModifiers).filter(modifierFilter);
  }

  /**
   * Find the first modifier that pass the `modifierFilter` function
   * @param modifierFilter The function used to filter a target's modifiers
   * @param player Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @returns the first modifier that passed the `modifierFilter` function; `undefined` if none passed
   */
  findModifier(modifierFilter: ModifierPredicate, player = true): PersistentModifier | undefined {
    return (player ? this.modifiers : this.enemyModifiers).find(modifierFilter);
  }

  /**
   * Apply all modifiers that match `modifierType` in a random order
   * @param modifierType The type of modifier to apply; must extend {@linkcode PersistentModifier}
   * @param player Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @param ...args The list of arguments needed to invoke `modifierType.apply`
   * @returns the list of all modifiers that matched `modifierType` and were applied.
   */
  applyShuffledModifiers<T extends PersistentModifier>(
    modifierType: Constructor<T>,
    player = true,
    ...args: Parameters<T["apply"]>
  ): T[] {
    let modifiers = (player ? this.modifiers : this.enemyModifiers).filter(
      (m): m is T => m instanceof modifierType && m.shouldApply(...args),
    );
    this.executeWithSeedOffset(
      () => {
        const shuffleModifiers = mods => {
          if (mods.length === 0) {
            return mods;
          }
          const rand = randSeedInt(mods.length);
          return [mods[rand], ...shuffleModifiers(mods.filter((_, i) => i !== rand))];
        };
        modifiers = shuffleModifiers(modifiers);
      },
      this.currentBattle.turn << 4,
      this.waveSeed,
    );
    return this.applyModifiersInternal(modifiers, player, args);
  }

  /**
   * Apply all modifiers that match `modifierType`
   * @param modifierType The type of modifier to apply; must extend {@linkcode PersistentModifier}
   * @param player Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @param ...args The list of arguments needed to invoke `modifierType.apply`
   * @returns the list of all modifiers that matched `modifierType` and were applied.
   */
  applyModifiers<T extends PersistentModifier>(
    modifierType: Constructor<T>,
    player = true,
    ...args: Parameters<T["apply"]>
  ): T[] {
    const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(
      (m): m is T => m instanceof modifierType && m.shouldApply(...args),
    );
    return this.applyModifiersInternal(modifiers, player, args);
  }

  /** Helper function to apply all passed modifiers */
  applyModifiersInternal<T extends PersistentModifier>(
    modifiers: T[],
    player: boolean,
    args: Parameters<T["apply"]>,
  ): T[] {
    const appliedModifiers: T[] = [];
    for (const modifier of modifiers) {
      if (modifier.apply(...args)) {
        console.log("Applied", modifier.type.name, !player ? "(enemy)" : "");
        appliedModifiers.push(modifier);
      }
    }

    return appliedModifiers;
  }

  /**
   * Apply the first modifier that matches `modifierType`
   * @param modifierType The type of modifier to apply; must extend {@linkcode PersistentModifier}
   * @param player Whether to search the player (`true`) or the enemy (`false`); Defaults to `true`
   * @param ...args The list of arguments needed to invoke `modifierType.apply`
   * @returns the first modifier that matches `modifierType` and was applied; return `null` if none matched
   */
  applyModifier<T extends PersistentModifier>(
    modifierType: Constructor<T>,
    player = true,
    ...args: Parameters<T["apply"]>
  ): T | null {
    const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(
      (m): m is T => m instanceof modifierType && m.shouldApply(...args),
    );
    for (const modifier of modifiers) {
      if (modifier.apply(...args)) {
        console.log("Applied", modifier.type.name, !player ? "(enemy)" : "");
        return modifier;
      }
    }

    return null;
  }

  triggerPokemonFormChange(
    pokemon: Pokemon,
    formChangeTriggerType: Constructor<SpeciesFormChangeTrigger>,
    delayed = false,
    modal = false,
  ): boolean {
    if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)) {
      // in case this is NECROZMA, determine which forms this
      const matchingFormChangeOpts = pokemonFormChanges[pokemon.species.speciesId].filter(
        fc => fc.findTrigger(formChangeTriggerType) && fc.canChange(pokemon),
      );
      let matchingFormChange: SpeciesFormChange | null;
      if (pokemon.species.speciesId === SpeciesId.NECROZMA && matchingFormChangeOpts.length > 1) {
        // Ultra Necrozma is changing its form back, so we need to figure out into which form it devolves.
        const formChangeItemModifiers = (
          this.findModifiers(
            m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id,
          ) as PokemonFormChangeItemModifier[]
        )
          .filter(m => m.active)
          .map(m => m.formChangeItem);

        matchingFormChange = formChangeItemModifiers.includes(FormChangeItem.N_LUNARIZER)
          ? matchingFormChangeOpts[0]
          : formChangeItemModifiers.includes(FormChangeItem.N_SOLARIZER)
            ? matchingFormChangeOpts[1]
            : null;
      } else {
        matchingFormChange = matchingFormChangeOpts[0];
      }
      if (matchingFormChange) {
        let phase: Phase;
        if (pokemon.isPlayer() && !matchingFormChange.quiet) {
          phase = this.phaseManager.create("FormChangePhase", pokemon, matchingFormChange, modal);
        } else {
          phase = this.phaseManager.create("QuietFormChangePhase", pokemon, matchingFormChange);
        }
        if (pokemon.isPlayer() && !matchingFormChange.quiet && modal) {
          this.phaseManager.overridePhase(phase);
        } else if (delayed) {
          this.phaseManager.pushPhase(phase);
        } else {
          this.phaseManager.unshiftPhase(phase);
        }
        return true;
      }
    }

    return false;
  }

  triggerPokemonBattleAnim(
    pokemon: Pokemon,
    battleAnimType: PokemonAnimType,
    fieldAssets?: Phaser.GameObjects.Sprite[],
    delayed = false,
  ): boolean {
    const phaseManager = this.phaseManager;
    const phase: Phase = phaseManager.create("PokemonAnimPhase", battleAnimType, pokemon, fieldAssets);
    if (delayed) {
      phaseManager.pushPhase(phase);
    } else {
      phaseManager.unshiftPhase(phase);
    }
    return true;
  }

  validateAchvs(achvType: Constructor<Achv>, ...args: unknown[]): void {
    const filteredAchvs = Object.values(achvs).filter(a => a instanceof achvType);
    for (const achv of filteredAchvs) {
      this.validateAchv(achv, args);
    }
  }

  validateAchv(achv: Achv, args?: unknown[]): boolean {
    if (
      (!this.gameData.achvUnlocks.hasOwnProperty(achv.id) || Overrides.ACHIEVEMENTS_REUNLOCK_OVERRIDE)
      && achv.validate(args)
    ) {
      this.gameData.achvUnlocks[achv.id] = Date.now();
      this.ui.achvBar.showAchv(achv);
      if (vouchers.hasOwnProperty(achv.id)) {
        this.validateVoucher(vouchers[achv.id]);
      }
      return true;
    }

    return false;
  }

  validateVoucher(voucher: Voucher, args?: unknown[]): boolean {
    if (!this.gameData.voucherUnlocks.hasOwnProperty(voucher.id) && voucher.validate(args)) {
      this.gameData.voucherUnlocks[voucher.id] = Date.now();
      this.ui.achvBar.showAchv(voucher);
      this.gameData.voucherCounts[voucher.voucherType]++;
      return true;
    }

    return false;
  }

  updateGameInfo(): void {
    const gameInfo = {
      playTime: this.sessionPlayTime ?? 0,
      gameMode: this.currentBattle ? this.gameMode.getName() : "Title",
      biome: this.currentBattle ? getBiomeName(this.arena.biomeType) : "",
      wave: this.currentBattle?.waveIndex ?? 0,
      party:
        this.party?.map(p => ({
          name: p.name,
          form: p.getFormKey(),
          types: p.getTypes().map(type => PokemonType[type]),
          teraType: PokemonType[p.getTeraType()],
          isTerastallized: p.isTerastallized,
          level: p.level,
          currentHP: p.hp,
          maxHP: p.getMaxHp(),
          status: p.status?.effect ? StatusEffect[p.status.effect] : "",
        })) ?? [], // TODO: review if this can be nullish
      modeChain: this.ui?.getModeChain() ?? [],
    };
    (window as any).gameInfo = gameInfo;
  }

  /**
   * This function retrieves the sprite and audio keys for active Pokemon.
   * Active Pokemon include both enemy and player Pokemon of the current wave.
   * Note: Questions on garbage collection go to @frutescens
   * @returns a string array of active sprite and audio keys that should not be deleted
   */
  getActiveKeys(): string[] {
    const keys: string[] = [];
    let activePokemon: (PlayerPokemon | EnemyPokemon)[] = this.getPlayerParty();
    activePokemon = activePokemon.concat(this.getEnemyParty());
    for (const p of activePokemon) {
      keys.push(p.getSpriteKey(true));
      if (p.isPlayer()) {
        keys.push(p.getBattleSpriteKey(true, true));
      }
      keys.push(p.species.getCryKey(p.formIndex));
      if (p.fusionSpecies) {
        keys.push(p.fusionSpecies.getCryKey(p.fusionFormIndex));
      }
    }
    return keys;
  }

  /**
   * Initialized the 2nd phase of the final boss (e.g. form-change for Eternatus)
   * @param pokemon The (enemy) pokemon
   */
  initFinalBossPhaseTwo(pokemon: Pokemon): void {
    if (pokemon.isEnemy() && pokemon.isBoss() && !pokemon.formIndex && pokemon.bossSegmentIndex < 1) {
      this.fadeOutBgm(fixedInt(2000), false);
      this.ui.showDialogue(
        battleSpecDialogue[BattleSpec.FINAL_BOSS].firstStageWin,
        pokemon.species.name,
        undefined,
        () => {
          const finalBossMBH = getModifierType(modifierTypes.MINI_BLACK_HOLE).newModifier(
            pokemon,
          ) as TurnHeldItemTransferModifier;
          finalBossMBH.setTransferrableFalse();
          this.addEnemyModifier(finalBossMBH, false, true);
          pokemon.generateAndPopulateMoveset(1);
          this.setFieldScale(0.75);
          this.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
          this.currentBattle.double = true;
          const availablePartyMembers = this.getPlayerParty().filter(p => p.isAllowedInBattle());
          if (availablePartyMembers.length > 1) {
            this.phaseManager.pushNew("ToggleDoublePositionPhase", true);
            if (!availablePartyMembers[1].isOnField()) {
              this.phaseManager.pushNew("SummonPhase", 1);
            }
          }

          this.phaseManager.shiftPhase();
        },
      );
      return;
    }

    this.phaseManager.shiftPhase();
  }

  /**
   * Updates Exp and level values for Player's party, adding new level up phases as required
   * @param expValue raw value of exp to split among participants, OR the base multiplier to use with waveIndex
   * @param pokemonDefeated If true, will increment Macho Brace stacks and give the party Pokemon friendship increases
   * @param useWaveIndexMultiplier Default false. If true, will multiply expValue by a scaling waveIndex multiplier. Not needed if expValue is already scaled by level/wave
   * @param pokemonParticipantIds Participants. If none are defined, no exp will be given. To spread evenly among the party, should pass all ids of party members.
   */
  applyPartyExp(
    expValue: number,
    pokemonDefeated: boolean,
    useWaveIndexMultiplier?: boolean,
    pokemonParticipantIds?: Set<number>,
  ): void {
    const participantIds = pokemonParticipantIds ?? this.currentBattle.playerParticipantIds;
    const party = this.getPlayerParty();
    const expShareModifier = this.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = this.findModifier(
      m => m instanceof MultipleParticipantExpBonusModifier,
    ) as MultipleParticipantExpBonusModifier;
    const nonFaintedPartyMembers = party.filter(p => p.hp);
    const expPartyMembers = nonFaintedPartyMembers.filter(p => p.level < this.getMaxExpLevel());
    const partyMemberExp: number[] = [];
    // EXP value calculation is based off Pokemon.getExpValue
    if (useWaveIndexMultiplier) {
      expValue = Math.floor((expValue * this.currentBattle.waveIndex) / 5 + 1);
    }

    if (participantIds.size > 0) {
      if (
        this.currentBattle.battleType === BattleType.TRAINER
        || this.currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
      ) {
        expValue = Math.floor(expValue * 1.5);
      } else if (this.currentBattle.isBattleMysteryEncounter() && this.currentBattle.mysteryEncounter) {
        expValue = Math.floor(expValue * this.currentBattle.mysteryEncounter.expMultiplier);
      }
      for (const partyMember of nonFaintedPartyMembers) {
        const pId = partyMember.id;
        const participated = participantIds.has(pId);
        if (participated && pokemonDefeated) {
          partyMember.addFriendship(FRIENDSHIP_GAIN_FROM_BATTLE);
          const machoBraceModifier = partyMember.getHeldItems().find(m => m instanceof PokemonIncrementingStatModifier);
          if (machoBraceModifier && machoBraceModifier.stackCount < machoBraceModifier.getMaxStackCount()) {
            machoBraceModifier.stackCount++;
            this.updateModifiers(true, true);
            partyMember.updateInfo();
          }
        }
        if (!expPartyMembers.includes(partyMember)) {
          continue;
        }
        if (!participated && !expShareModifier) {
          partyMemberExp.push(0);
          continue;
        }
        let expMultiplier = 0;
        if (participated) {
          expMultiplier += 1 / participantIds.size;
          if (participantIds.size > 1 && multipleParticipantExpBonusModifier) {
            expMultiplier += multipleParticipantExpBonusModifier.getStackCount() * 0.2;
          }
        } else if (expShareModifier) {
          expMultiplier += (expShareModifier.getStackCount() * 0.2) / participantIds.size;
        }
        if (partyMember.pokerus) {
          expMultiplier *= 1.5;
        }
        if (Overrides.XP_MULTIPLIER_OVERRIDE !== null) {
          expMultiplier = Overrides.XP_MULTIPLIER_OVERRIDE;
        }
        const pokemonExp = new NumberHolder(expValue * expMultiplier);
        this.applyModifiers(PokemonExpBoosterModifier, true, partyMember, pokemonExp);
        partyMemberExp.push(Math.floor(pokemonExp.value));
      }

      if (expBalanceModifier) {
        let totalLevel = 0;
        let totalExp = 0;
        expPartyMembers.forEach((expPartyMember, epm) => {
          totalExp += partyMemberExp[epm];
          totalLevel += expPartyMember.level;
        });

        const medianLevel = Math.floor(totalLevel / expPartyMembers.length);

        const recipientExpPartyMemberIndexes: number[] = [];
        expPartyMembers.forEach((expPartyMember, epm) => {
          if (expPartyMember.level <= medianLevel) {
            recipientExpPartyMemberIndexes.push(epm);
          }
        });

        const splitExp = Math.floor(totalExp / recipientExpPartyMemberIndexes.length);

        expPartyMembers.forEach((_partyMember, pm) => {
          partyMemberExp[pm] = Phaser.Math.Linear(
            partyMemberExp[pm],
            recipientExpPartyMemberIndexes.indexOf(pm) > -1 ? splitExp : 0,
            0.2 * expBalanceModifier.getStackCount(),
          );
        });
      }

      for (let pm = 0; pm < expPartyMembers.length; pm++) {
        const exp = partyMemberExp[pm];

        if (exp) {
          const partyMemberIndex = party.indexOf(expPartyMembers[pm]);
          this.phaseManager.unshiftPhase(
            expPartyMembers[pm].isOnField()
              ? this.phaseManager.create("ExpPhase", partyMemberIndex, exp)
              : this.phaseManager.create("ShowPartyExpBarPhase", partyMemberIndex, exp),
          );
        }
      }
    }
  }

  /**
   * Returns if a wave COULD spawn a {@linkcode MysteryEncounter}.
   * Even if returns `true`, does not guarantee that a wave will actually be a ME.
   * That check is made in {@linkcode BattleScene.isWaveMysteryEncounter} instead.
   */
  isMysteryEncounterValidForWave(battleType: BattleType, waveIndex: number): boolean {
    const [lowestMysteryEncounterWave, highestMysteryEncounterWave] = this.gameMode.getMysteryEncounterLegalWaves();
    return (
      this.gameMode.hasMysteryEncounters
      && battleType === BattleType.WILD
      && !this.gameMode.isBoss(waveIndex)
      && waveIndex % 10 !== 1
      && waveIndex < highestMysteryEncounterWave
      && waveIndex > lowestMysteryEncounterWave
    );
  }

  /**
   * Determines whether a wave should randomly generate a {@linkcode MysteryEncounter}.
   * Currently, the only modes that MEs are allowed in are Classic and Challenge.
   * Additionally, MEs cannot spawn outside of waves 10-180 in those modes
   * @param newBattleType
   * @param waveIndex
   */
  private isWaveMysteryEncounter(newBattleType: BattleType, waveIndex: number): boolean {
    const [lowestMysteryEncounterWave, highestMysteryEncounterWave] = this.gameMode.getMysteryEncounterLegalWaves();
    if (this.isMysteryEncounterValidForWave(newBattleType, waveIndex)) {
      // Base spawn weight is BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT/256, and increases by WEIGHT_INCREMENT_ON_SPAWN_MISS/256 for each missed attempt at spawning an encounter on a valid floor
      const sessionEncounterRate = this.mysteryEncounterSaveData.encounterSpawnChance;
      const encounteredEvents = this.mysteryEncounterSaveData.encounteredEvents;

      // If total number of encounters is lower than expected for the run, slightly favor a new encounter spawn (reverse as well)
      // Reduces occurrence of runs with total encounters significantly different from AVERAGE_ENCOUNTERS_PER_RUN_TARGET
      // Favored rate changes can never exceed 50%. So if base rate is 15/256 and favored rate would add 200/256, result will be (15 + 128)/256
      const expectedEncountersByFloor =
        (AVERAGE_ENCOUNTERS_PER_RUN_TARGET / (highestMysteryEncounterWave - lowestMysteryEncounterWave))
        * (waveIndex - lowestMysteryEncounterWave);
      const currentRunDiffFromAvg = expectedEncountersByFloor - encounteredEvents.length;
      const favoredEncounterRate =
        sessionEncounterRate
        + Math.min(currentRunDiffFromAvg * ANTI_VARIANCE_WEIGHT_MODIFIER, MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT / 2);

      const successRate = Overrides.MYSTERY_ENCOUNTER_RATE_OVERRIDE ?? favoredEncounterRate;

      // MEs can only spawn 3 or more waves after the previous ME, barring overrides
      const canSpawn = encounteredEvents.length === 0 || waveIndex - encounteredEvents.at(-1)!.waveIndex > 3;

      if (canSpawn || Overrides.MYSTERY_ENCOUNTER_RATE_OVERRIDE !== null) {
        let roll = MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT;
        // Always rolls the check on the same offset to ensure no RNG changes from reloading session
        this.executeWithSeedOffset(
          () => {
            roll = randSeedInt(MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT);
          },
          waveIndex * 3 * 1000,
        );
        return roll < successRate;
      }
    }

    return false;
  }

  /**
   * Loads or generates a mystery encounter
   * @param encounterType used to load session encounter when restarting game, etc.
   * @param canBypass optional boolean to indicate that the request is coming from a function that needs to access a Mystery Encounter outside of gameplay requirements
   * @returns
   */
  getMysteryEncounter(encounterType?: MysteryEncounterType, canBypass?: boolean): MysteryEncounter {
    // Loading override or session encounter
    let encounter: MysteryEncounter | null;
    if (
      !isNullOrUndefined(Overrides.MYSTERY_ENCOUNTER_OVERRIDE)
      && allMysteryEncounters.hasOwnProperty(Overrides.MYSTERY_ENCOUNTER_OVERRIDE)
    ) {
      encounter = allMysteryEncounters[Overrides.MYSTERY_ENCOUNTER_OVERRIDE];
      if (canBypass) {
        return encounter;
      }
    } else if (canBypass) {
      encounter = allMysteryEncounters[encounterType ?? -1];
      return encounter;
    } else {
      encounter = !isNullOrUndefined(encounterType) ? allMysteryEncounters[encounterType] : null;
    }

    // Check for queued encounters first
    if (
      !encounter
      && this.mysteryEncounterSaveData?.queuedEncounters
      && this.mysteryEncounterSaveData.queuedEncounters.length > 0
    ) {
      let i = 0;
      while (i < this.mysteryEncounterSaveData.queuedEncounters.length && !!encounter) {
        const candidate = this.mysteryEncounterSaveData.queuedEncounters[i];
        const forcedChance = candidate.spawnPercent;
        if (randSeedInt(100) < forcedChance) {
          encounter = allMysteryEncounters[candidate.type];
        }

        i++;
      }
    }

    if (encounter) {
      encounter = new MysteryEncounter(encounter);
      encounter.populateDialogueTokensFromRequirements();
      return encounter;
    }

    // See Enum values for base tier weights
    const tierWeights = [
      MysteryEncounterTier.COMMON,
      MysteryEncounterTier.GREAT,
      MysteryEncounterTier.ULTRA,
      MysteryEncounterTier.ROGUE,
    ];

    // Adjust tier weights by previously encountered events to lower odds of only Common/Great in run
    // biome-ignore format: biome sucks at formatting this line
    for (const seenEncounterData of this.mysteryEncounterSaveData.encounteredEvents) {
      if (seenEncounterData.tier === MysteryEncounterTier.COMMON) {
        tierWeights[0] = tierWeights[0] - 6;
      } else if (seenEncounterData.tier === MysteryEncounterTier.GREAT) {
        tierWeights[1] = tierWeights[1] - 4;
      }
    }

    const totalWeight = tierWeights.reduce((a, b) => a + b);
    const tierValue = randSeedInt(totalWeight);
    const commonThreshold = totalWeight - tierWeights[0];
    const greatThreshold = totalWeight - tierWeights[0] - tierWeights[1];
    const ultraThreshold = totalWeight - tierWeights[0] - tierWeights[1] - tierWeights[2];
    let tier: MysteryEncounterTier | null =
      tierValue > commonThreshold
        ? MysteryEncounterTier.COMMON
        : tierValue > greatThreshold
          ? MysteryEncounterTier.GREAT
          : tierValue > ultraThreshold
            ? MysteryEncounterTier.ULTRA
            : MysteryEncounterTier.ROGUE;

    if (!isNullOrUndefined(Overrides.MYSTERY_ENCOUNTER_TIER_OVERRIDE)) {
      tier = Overrides.MYSTERY_ENCOUNTER_TIER_OVERRIDE;
    }

    let availableEncounters: MysteryEncounter[] = [];
    const previousEncounter = this.mysteryEncounterSaveData.encounteredEvents.at(-1)?.type ?? null; // TODO: This being `null` is a bit weird
    const disabledEncounters = this.eventManager.getEventMysteryEncountersDisabled();
    const biomeMysteryEncounters =
      mysteryEncountersByBiome.get(this.arena.biomeType)?.filter(enc => !disabledEncounters.includes(enc)) ?? [];
    // If no valid encounters exist at tier, checks next tier down, continuing until there are some encounters available
    while (availableEncounters.length === 0 && tier !== null) {
      availableEncounters = biomeMysteryEncounters
        .filter(encounterType => {
          const encounterCandidate = allMysteryEncounters[encounterType];
          if (!encounterCandidate) {
            return false;
          }
          if (
            this.eventManager.getMysteryEncounterTierForEvent(encounterType, encounterCandidate.encounterTier) !== tier
          ) {
            return false;
          }
          const disallowedGameModes = encounterCandidate.disallowedGameModes;
          if (
            disallowedGameModes
            && disallowedGameModes.length > 0
            && disallowedGameModes.includes(this.gameMode.modeId)
          ) {
            return false;
          }
          if (encounterCandidate.disallowedChallenges?.some(challenge => this.gameMode.hasChallenge(challenge))) {
            return false;
          }
          if (!encounterCandidate.meetsRequirements()) {
            return false;
          }
          if (previousEncounter !== null && encounterType === previousEncounter) {
            return false;
          }
          return !(
            this.mysteryEncounterSaveData.encounteredEvents.length > 0
            && encounterCandidate.maxAllowedEncounters
            && encounterCandidate.maxAllowedEncounters > 0
            && this.mysteryEncounterSaveData.encounteredEvents.filter(e => e.type === encounterType).length
              >= encounterCandidate.maxAllowedEncounters
          );
        })
        .map(m => allMysteryEncounters[m]);
      // Decrement tier
      if (tier === MysteryEncounterTier.ROGUE) {
        tier = MysteryEncounterTier.ULTRA;
      } else if (tier === MysteryEncounterTier.ULTRA) {
        tier = MysteryEncounterTier.GREAT;
      } else if (tier === MysteryEncounterTier.GREAT) {
        tier = MysteryEncounterTier.COMMON;
      } else {
        tier = null; // Ends loop
      }
    }

    // If absolutely no encounters are available, spawn 0th encounter
    if (availableEncounters.length === 0) {
      console.log("No Mystery Encounters found, falling back to Mysterious Challengers.");
      return allMysteryEncounters[MysteryEncounterType.MYSTERIOUS_CHALLENGERS];
    }
    // TODO: should this use `randSeedItem`?
    encounter = availableEncounters[randSeedInt(availableEncounters.length)];
    // New encounter object to not dirty flags
    encounter = new MysteryEncounter(encounter);
    encounter.populateDialogueTokensFromRequirements();
    return encounter;
  }
}
