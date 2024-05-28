import Phaser from "phaser";
import UI  from "./ui/ui";
import { NextEncounterPhase, NewBiomeEncounterPhase, SelectBiomePhase, MessagePhase, TurnInitPhase, ReturnPhase, LevelCapPhase, ShowTrainerPhase, LoginPhase, MovePhase, TitlePhase, SwitchPhase } from "./phases";
import Pokemon, { PlayerPokemon, EnemyPokemon } from "./field/pokemon";
import PokemonSpecies, { PokemonSpeciesFilter, allSpecies, getPokemonSpecies } from "./data/pokemon-species";
import * as Utils from "./utils";
import { Modifier, ModifierBar, ConsumablePokemonModifier, ConsumableModifier, PokemonHpRestoreModifier, HealingBoosterModifier, PersistentModifier, PokemonHeldItemModifier, ModifierPredicate, DoubleBattleChanceBoosterModifier, FusePokemonModifier, PokemonFormChangeItemModifier, TerastallizeModifier, overrideModifiers, overrideHeldItems } from "./modifier/modifier";
import { PokeballType } from "./data/pokeball";
import { initCommonAnims, initMoveAnim, loadCommonAnimAssets, loadMoveAnimAssets, populateAnims } from "./data/battle-anims";
import { Phase } from "./phase";
import { initGameSpeed } from "./system/game-speed";
import { Biome } from "./data/enums/biome";
import { Arena, ArenaBase } from "./field/arena";
import { GameData, PlayerGender } from "./system/game-data";
import { TextStyle, addTextObject } from "./ui/text";
import { Moves } from "./data/enums/moves";
import { allMoves } from "./data/move";
import { ModifierPoolType, getDefaultModifierTypeForTier, getEnemyModifierTypesForWave, getLuckString, getLuckTextTint, getModifierPoolForType, getPartyLuckValue } from "./modifier/modifier-type";
import AbilityBar from "./ui/ability-bar";
import { BlockItemTheftAbAttr, DoubleBattleChanceAbAttr, IncrementMovePriorityAbAttr, PostBattleInitAbAttr, applyAbAttrs, applyPostBattleInitAbAttrs } from "./data/ability";
import { allAbilities } from "./data/ability";
import Battle, { BattleType, FixedBattleConfig, fixedBattles } from "./battle";
import { GameMode, GameModes, gameModes } from "./game-mode";
import FieldSpritePipeline from "./pipelines/field-sprite";
import SpritePipeline from "./pipelines/sprite";
import PartyExpBar from "./ui/party-exp-bar";
import { TrainerSlot, trainerConfigs } from "./data/trainer-config";
import Trainer, { TrainerVariant } from "./field/trainer";
import TrainerData from "./system/trainer-data";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { pokemonPrevolutions } from "./data/pokemon-evolutions";
import PokeballTray from "./ui/pokeball-tray";
import { Species } from "./data/enums/species";
import InvertPostFX from "./pipelines/invert";
import { Achv, ModifierAchv, MoneyAchv, achvs } from "./system/achv";
import { Voucher, vouchers } from "./system/voucher";
import { Gender } from "./data/gender";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import { addUiThemeOverrides } from "./ui/ui-theme";
import PokemonData from "./system/pokemon-data";
import { Nature } from "./data/nature";
import { SpeciesFormChangeTimeOfDayTrigger, SpeciesFormChangeTrigger, pokemonFormChanges } from "./data/pokemon-forms";
import { FormChangePhase, QuietFormChangePhase } from "./form-change-phase";
import { BattleSpec } from "./enums/battle-spec";
import { getTypeRgb } from "./data/type";
import PokemonSpriteSparkleHandler from "./field/pokemon-sprite-sparkle-handler";
import CharSprite from "./ui/char-sprite";
import DamageNumberHandler from "./field/damage-number-handler";
import PokemonInfoContainer from "./ui/pokemon-info-container";
import { biomeDepths, getBiomeName } from "./data/biomes";
import { UiTheme } from "./enums/ui-theme";
import { SceneBase } from "./scene-base";
import CandyBar from "./ui/candy-bar";
import { Variant, variantData } from "./data/variant";
import { Localizable } from "./plugins/i18n";
import * as Overrides from "./overrides";
import {InputsController} from "./inputs-controller";
import {UiInputs} from "./ui-inputs";
import { MoneyFormat } from "./enums/money-format";
import { NewArenaEvent } from "./battle-scene-events";

export const bypassLogin = import.meta.env.VITE_BYPASS_LOGIN === "1";

const DEBUG_RNG = false;

export const startingWave = Overrides.STARTING_WAVE_OVERRIDE || 1;

const expSpriteKeys: string[] = [];

export let starterColors: StarterColors;
interface StarterColors {
	[key: string]: [string, string]
}

export interface PokeballCounts {
	[pb: string]: integer;
}

export type AnySound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

export default class BattleScene extends SceneBase {
  public rexUI: UIPlugin;
  public inputController: InputsController;
  public uiInputs: UiInputs;

  public sessionPlayTime: integer = null;
  public lastSavePlayTime: integer = null;
  public masterVolume: number = 0.5;
  public bgmVolume: number = 1;
  public seVolume: number = 1;
  public gameSpeed: integer = 1;
  public damageNumbersMode: integer = 0;
  public showLevelUpStats: boolean = true;
  public enableTutorials: boolean = import.meta.env.VITE_BYPASS_TUTORIAL === "1";
  public enableRetries: boolean = false;
  /**
   * Determines the condition for a notification should be shown for Candy Upgrades
   * - 0 = 'Off'
   * - 1 = 'Passives Only'
   * - 2 = 'On'
   */
  public candyUpgradeNotification: integer = 0;
  /**
   * Determines what type of notification is used for Candy Upgrades
   * - 0 = 'Icon'
   * - 1 = 'Animation'
   */
  public candyUpgradeDisplay: integer = 0;
  public moneyFormat: MoneyFormat = MoneyFormat.NORMAL;
  public uiTheme: UiTheme = UiTheme.DEFAULT;
  public windowType: integer = 0;
  public experimentalSprites: boolean = false;
  public moveAnimations: boolean = true;
  public expGainsSpeed: integer = 0;
  /**
	 * Defines the experience gain display mode.
	 *
	 * @remarks
	 * The `expParty` can have several modes:
	 * - `0` - Default: The normal experience gain display, nothing changed.
	 * - `1` - Level Up Notification: Displays the level up in the small frame instead of a message.
	 * - `2` - Skip: No level up frame nor message.
	 *
	 * Modes `1` and `2` are still compatible with stats display, level up, new move, etc.
	 * @default 0 - Uses the default normal experience gain display.
	 */
  public expParty: integer = 0;
  public hpBarSpeed: integer = 0;
  public fusionPaletteSwaps: boolean = true;
  public enableTouchControls: boolean = false;
  public enableVibration: boolean = false;
  public abSwapped: boolean = false;

  public disableMenu: boolean = false;

  public gameData: GameData;
  public sessionSlotId: integer;

  private phaseQueue: Phase[];
  private phaseQueuePrepend: Phase[];
  private phaseQueuePrependSpliceIndex: integer;
  private nextCommandPhaseQueue: Phase[];
  private currentPhase: Phase;
  private standbyPhase: Phase;
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
  public score: integer;
  public lockModifierTiers: boolean;
  public trainer: Phaser.GameObjects.Sprite;
  public lastEnemyTrainer: Trainer;
  public currentBattle: Battle;
  public pokeballCounts: PokeballCounts;
  public money: integer;
  public pokemonInfoContainer: PokemonInfoContainer;
  private party: PlayerPokemon[];
  /** Combined Biome and Wave count text */
  private biomeWaveText: Phaser.GameObjects.Text;
  private moneyText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private luckLabelText: Phaser.GameObjects.Text;
  private luckText: Phaser.GameObjects.Text;
  private modifierBar: ModifierBar;
  private enemyModifierBar: ModifierBar;
  private fieldOverlay: Phaser.GameObjects.Rectangle;
  private modifiers: PersistentModifier[];
  private enemyModifiers: PersistentModifier[];
  public uiContainer: Phaser.GameObjects.Container;
  public ui: UI;

  public seed: string;
  public waveSeed: string;
  public waveCycleOffset: integer;
  public offsetGym: boolean;

  public damageNumberHandler: DamageNumberHandler;
  private spriteSparkleHandler: PokemonSpriteSparkleHandler;

  public fieldSpritePipeline: FieldSpritePipeline;
  public spritePipeline: SpritePipeline;

  private bgm: AnySound;
  private bgmResumeTimer: Phaser.Time.TimerEvent;
  private bgmCache: Set<string> = new Set();
  private playTimeTimer: Phaser.Time.TimerEvent;

  public rngCounter: integer = 0;
  public rngSeedOverride: string = "";
  public rngOffset: integer = 0;

  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode BattleSceneEventType.MOVE_USED} {@linkcode MoveUsedEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor() {
    super("battle");
    this.phaseQueue = [];
    this.phaseQueuePrepend = [];
    this.phaseQueuePrependSpliceIndex = -1;
    this.nextCommandPhaseQueue = [];
    this.updateGameInfo();
  }

  loadPokemonAtlas(key: string, atlasPath: string, experimental?: boolean) {
    if (experimental === undefined) {
      experimental = this.experimentalSprites;
    }
    const variant = atlasPath.includes("variant/") || /_[0-3]$/.test(atlasPath);
    if (experimental) {
      experimental = this.hasExpSprite(key);
    }
    if (variant) {
      atlasPath = atlasPath.replace("variant/", "");
    }
    this.load.atlas(key, `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.png`,  `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}.json`);
  }

  async preload() {
    if (DEBUG_RNG) {
      const scene = this;
      const originalRealInRange = Phaser.Math.RND.realInRange;
      Phaser.Math.RND.realInRange = function (min: number, max: number): number {
        const ret = originalRealInRange.apply(this, [ min, max ]);
        const args = [ "RNG", ++scene.rngCounter, ret / (max - min), `min: ${min} / max: ${max}` ];
        args.push(`seed: ${scene.rngSeedOverride || scene.waveSeed || scene.seed}`);
        if (scene.rngOffset) {
          args.push(`offset: ${scene.rngOffset}`);
        }
        console.log(...args);
        return ret;
      };
    }

    populateAnims();

    await this.initVariantData();
  }

  create() {
    initGameSpeed.apply(this);
    this.inputController = new InputsController(this);
    this.uiInputs = new UiInputs(this, this.inputController);

    this.gameData = new GameData(this);

    addUiThemeOverrides(this);

    this.load.setBaseURL();

    this.spritePipeline = new SpritePipeline(this.game);
    (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add("Sprite", this.spritePipeline);

    this.fieldSpritePipeline = new FieldSpritePipeline(this.game);
    (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add("FieldSprite", this.fieldSpritePipeline);

    this.time.delayedCall(20, () => this.launchBattle());
  }

  update() {
    this.inputController.update();
    this.ui?.update();
  }

  launchBattle() {
    this.arenaBg = this.add.sprite(0, 0, "plains_bg");
    this.arenaBgTransition = this.add.sprite(0, 0, "plains_bg");

    [ this.arenaBgTransition, this.arenaBg ].forEach(a => {
      a.setPipeline(this.fieldSpritePipeline);
      a.setScale(6);
      a.setOrigin(0);
      a.setSize(320, 240);
    });

    const field = this.add.container(0, 0);
    field.setScale(6);

    this.field = field;

    const fieldUI = this.add.container(0, this.game.canvas.height);
    fieldUI.setDepth(1);
    fieldUI.setScale(6);

    this.fieldUI = fieldUI;

    const transition = this.make.rexTransitionImagePack({
      x: 0,
      y: 0,
      scale: 6,
      key: "loading_bg",
      origin: { x: 0, y: 0 }
    }, true);

    transition.transit({
      mode: "blinds",
      ease: "Cubic.easeInOut",
      duration: 1250,
      oncomplete: () => transition.destroy()
    });

    this.add.existing(transition);

    const uiContainer = this.add.container(0, 0);
    uiContainer.setDepth(2);
    uiContainer.setScale(6);

    this.uiContainer = uiContainer;

    const overlayWidth = this.game.canvas.width / 6;
    const overlayHeight = (this.game.canvas.height / 6) - 48;
    this.fieldOverlay = this.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x424242);
    this.fieldOverlay.setOrigin(0, 0);
    this.fieldOverlay.setAlpha(0);
    this.fieldUI.add(this.fieldOverlay);

    this.modifiers = [];
    this.enemyModifiers = [];

    this.modifierBar = new ModifierBar(this);
    this.add.existing(this.modifierBar);
    uiContainer.add(this.modifierBar);

    this.enemyModifierBar = new ModifierBar(this, true);
    this.add.existing(this.enemyModifierBar);
    uiContainer.add(this.enemyModifierBar);

    this.charSprite = new CharSprite(this);
    this.charSprite.setup();

    this.fieldUI.add(this.charSprite);

    this.pbTray = new PokeballTray(this, true);
    this.pbTray.setup();

    this.pbTrayEnemy = new PokeballTray(this, false);
    this.pbTrayEnemy.setup();

    this.fieldUI.add(this.pbTray);
    this.fieldUI.add(this.pbTrayEnemy);

    this.abilityBar = new AbilityBar(this);
    this.abilityBar.setup();
    this.fieldUI.add(this.abilityBar);

    this.partyExpBar = new PartyExpBar(this);
    this.partyExpBar.setup();
    this.fieldUI.add(this.partyExpBar);

    this.candyBar = new CandyBar(this);
    this.candyBar.setup();
    this.fieldUI.add(this.candyBar);

    this.biomeWaveText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, startingWave.toString(), TextStyle.BATTLE_INFO);
    this.biomeWaveText.setOrigin(1, 0);
    this.fieldUI.add(this.biomeWaveText);

    this.moneyText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, "", TextStyle.MONEY);
    this.moneyText.setOrigin(1, 0);
    this.fieldUI.add(this.moneyText);

    this.scoreText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, "", TextStyle.PARTY, { fontSize: "54px" });
    this.scoreText.setOrigin(1, 0);
    this.fieldUI.add(this.scoreText);

    this.luckText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, "", TextStyle.PARTY, { fontSize: "54px" });
    this.luckText.setOrigin(1, 0);
    this.luckText.setVisible(false);
    this.fieldUI.add(this.luckText);

    this.luckLabelText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, "Luck:", TextStyle.PARTY, { fontSize: "54px" });
    this.luckLabelText.setOrigin(1, 0);
    this.luckLabelText.setVisible(false);
    this.fieldUI.add(this.luckLabelText);

    this.updateUIPositions();

    this.damageNumberHandler = new DamageNumberHandler();

    this.spriteSparkleHandler = new PokemonSpriteSparkleHandler();
    this.spriteSparkleHandler.setup(this);

    this.pokemonInfoContainer = new PokemonInfoContainer(this, (this.game.canvas.width / 6) + 52, -(this.game.canvas.height / 6) + 66);
    this.pokemonInfoContainer.setup();

    this.fieldUI.add(this.pokemonInfoContainer);

    this.party = [];

    const loadPokemonAssets = [];

    this.arenaPlayer = new ArenaBase(this, true);
    this.arenaPlayerTransition = new ArenaBase(this, true);
    this.arenaEnemy = new ArenaBase(this, false);
    this.arenaNextEnemy = new ArenaBase(this, false);

    this.arenaBgTransition.setVisible(false);
    this.arenaPlayerTransition.setVisible(false);
    this.arenaNextEnemy.setVisible(false);

    [ this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy ].forEach(a => {
      if (a instanceof Phaser.GameObjects.Sprite) {
        a.setOrigin(0, 0);
      }
      field.add(a);
    });

    const trainer = this.addFieldSprite(0, 0, `trainer_${this.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
    trainer.setOrigin(0.5, 1);

    field.add(trainer);

    this.trainer = trainer;

    this.anims.create({
      key: "prompt",
      frames: this.anims.generateFrameNumbers("prompt", { start: 1, end: 4 }),
      frameRate: 6,
      repeat: -1,
      showOnStart: true
    });

    this.anims.create({
      key: "tera_sparkle",
      frames: this.anims.generateFrameNumbers("tera_sparkle", { start: 0, end: 12 }),
      frameRate: 18,
      repeat: 0,
      showOnStart: true,
      hideOnComplete: true
    });

    this.reset(false, false, true);

    const ui = new UI(this);
    this.uiContainer.add(ui);

    this.ui = ui;

    ui.setup();

    const defaultMoves = [ Moves.TACKLE, Moves.TAIL_WHIP, Moves.FOCUS_ENERGY, Moves.STRUGGLE ];

    Promise.all([
      Promise.all(loadPokemonAssets),
      initCommonAnims(this).then(() => loadCommonAnimAssets(this, true)),
      Promise.all([ Moves.TACKLE, Moves.TAIL_WHIP, Moves.FOCUS_ENERGY, Moves.STRUGGLE ].map(m => initMoveAnim(this, m))).then(() => loadMoveAnimAssets(this, defaultMoves, true)),
      this.initStarterColors()
    ]).then(() => {
      this.pushPhase(new LoginPhase(this));
      this.pushPhase(new TitlePhase(this));

      this.shiftPhase();
    });
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
      delay: Utils.fixedInt(1000),
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
      }
    });

    this.updateBiomeWaveText();
    this.updateMoneyText();
    this.updateScoreText();
  }

  async initExpSprites(): Promise<void> {
    if (expSpriteKeys.length) {
      return;
    }
    this.cachedFetch("./exp-sprites.json").then(res => res.json()).then(keys => {
      if (Array.isArray(keys)) {
        expSpriteKeys.push(...keys);
      }
      Promise.resolve();
    });
  }

  async initVariantData(): Promise<void> {
    Object.keys(variantData).forEach(key => delete variantData[key]);
    await this.cachedFetch("./images/pokemon/variant/_masterlist.json").then(res => res.json())
      .then(v => {
        Object.keys(v).forEach(k => variantData[k] = v[k]);
        if (this.experimentalSprites) {
          const expVariantData = variantData["exp"];
          const traverseVariantData = (keys: string[]) => {
            let variantTree = variantData;
            let expTree = expVariantData;
            keys.map((k: string, i: integer) => {
              if (i < keys.length - 1) {
                variantTree = variantTree[k];
                expTree = expTree[k];
              } else if (variantTree.hasOwnProperty(k) && expTree.hasOwnProperty(k)) {
                if ([ "back", "female" ].includes(k)) {
                  traverseVariantData(keys.concat(k));
                } else {
                  variantTree[k] = expTree[k];
                }
              }
            });
          };
          Object.keys(expVariantData).forEach(ek => traverseVariantData([ ek ]));
        }
        Promise.resolve();
      });
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

  initStarterColors(): Promise<void> {
    return new Promise(resolve => {
      if (starterColors) {
        return resolve();
      }

      this.cachedFetch("./starter-colors.json").then(res => res.json()).then(sc => {
        starterColors = {};
        Object.keys(sc).forEach(key => {
          starterColors[key] = sc[key];
        });

        /*const loadPokemonAssets: Promise<void>[] = [];

				for (let s of Object.keys(speciesStarters)) {
					const species = getPokemonSpecies(parseInt(s));
					loadPokemonAssets.push(species.loadAssets(this, false, 0, false));
				}

				Promise.all(loadPokemonAssets).then(() => {
					const starterCandyColors = {};
					const rgbaToHexFunc = (r, g, b) => [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

					for (let s of Object.keys(speciesStarters)) {
						const species = getPokemonSpecies(parseInt(s));

						starterCandyColors[species.speciesId] = species.generateCandyColors(this).map(c => rgbaToHexFunc(c[0], c[1], c[2]));
					}

					console.log(JSON.stringify(starterCandyColors));

					resolve();
				});*/

        resolve();
      });
    });
  }

  hasExpSprite(key: string): boolean {
    const keyMatch = /^pkmn__?(back__)?(shiny__)?(female__)?(\d+)(\-.*?)?(?:_[1-3])?$/g.exec(key);
    let k = keyMatch[4];
    if (keyMatch[2]) {
      k += "s";
    }
    if (keyMatch[1]) {
      k += "b";
    }
    if (keyMatch[3]) {
      k += "f";
    }
    if (keyMatch[5]) {
      k += keyMatch[5];
    }
    if (!expSpriteKeys.includes(k)) {
      return false;
    }
    return true;
  }

  getParty(): PlayerPokemon[] {
    return this.party;
  }

  getPlayerPokemon(): PlayerPokemon {
    return this.getPlayerField().find(p => p.isActive());
  }

  getPlayerField(): PlayerPokemon[] {
    const party = this.getParty();
    return party.slice(0, Math.min(party.length, this.currentBattle?.double ? 2 : 1));
  }

  getEnemyParty(): EnemyPokemon[] {
    return this.currentBattle?.enemyParty || [];
  }

  getEnemyPokemon(): EnemyPokemon {
    return this.getEnemyField().find(p => p.isActive());
  }

  getEnemyField(): EnemyPokemon[] {
    const party = this.getEnemyParty();
    return party.slice(0, Math.min(party.length, this.currentBattle?.double ? 2 : 1));
  }

  getField(activeOnly: boolean = false): Pokemon[] {
    const ret = new Array(4).fill(null);
    const playerField = this.getPlayerField();
    const enemyField = this.getEnemyField();
    ret.splice(0, playerField.length, ...playerField);
    ret.splice(2, enemyField.length, ...enemyField);
    return activeOnly
      ? ret.filter(p => p?.isActive())
      : ret;
  }

  getPokemonById(pokemonId: integer): Pokemon {
    const findInParty = (party: Pokemon[]) => party.find(p => p.id === pokemonId);
    return findInParty(this.getParty()) || findInParty(this.getEnemyParty());
  }

  addPlayerPokemon(species: PokemonSpecies, level: integer, abilityIndex: integer, formIndex: integer, gender?: Gender, shiny?: boolean, variant?: Variant, ivs?: integer[], nature?: Nature, dataSource?: Pokemon | PokemonData, postProcess?: (playerPokemon: PlayerPokemon) => void): PlayerPokemon {
    const pokemon = new PlayerPokemon(this, species, level, abilityIndex, formIndex, gender, shiny, variant, ivs, nature, dataSource);
    if (postProcess) {
      postProcess(pokemon);
    }
    pokemon.init();
    return pokemon;
  }

  addEnemyPokemon(species: PokemonSpecies, level: integer, trainerSlot: TrainerSlot, boss: boolean = false, dataSource?: PokemonData, postProcess?: (enemyPokemon: EnemyPokemon) => void): EnemyPokemon {
    if (Overrides.OPP_SPECIES_OVERRIDE) {
      species = getPokemonSpecies(Overrides.OPP_SPECIES_OVERRIDE);
    }
    const pokemon = new EnemyPokemon(this, species, level, trainerSlot, boss, dataSource);
    if (Overrides.OPP_GENDER_OVERRIDE !== null) {
      pokemon.gender = Overrides.OPP_GENDER_OVERRIDE;
    }
    overrideModifiers(this, false);
    overrideHeldItems(this, pokemon, false);
    if (boss && !dataSource) {
      const secondaryIvs = Utils.getIvsFromId(Utils.randSeedInt(4294967295));

      for (let s = 0; s < pokemon.ivs.length; s++) {
        pokemon.ivs[s] = Math.round(Phaser.Math.Linear(Math.min(pokemon.ivs[s], secondaryIvs[s]), Math.max(pokemon.ivs[s], secondaryIvs[s]), 0.75));
      }
    }
    if (postProcess) {
      postProcess(pokemon);
    }
    pokemon.init();
    return pokemon;
  }

  addPokemonIcon(pokemon: Pokemon, x: number, y: number, originX: number = 0.5, originY: number = 0.5, ignoreOverride: boolean = false): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const icon = this.add.sprite(0, 0, pokemon.getIconAtlasKey(ignoreOverride));
    	icon.setFrame(pokemon.getIconId(true));
    // Temporary fix to show pokemon's default icon if variant icon doesn't exist
    if (icon.frame.name !== pokemon.getIconId(true)) {
      console.log(`${pokemon.name}'s variant icon does not exist. Replacing with default.`);
      const temp = pokemon.shiny;
      pokemon.shiny = false;
      icon.setTexture(pokemon.getIconAtlasKey(ignoreOverride));
      icon.setFrame(pokemon.getIconId(true));
      pokemon.shiny = temp;
    }
    icon.setOrigin(0.5, 0);

    container.add(icon);

    if (pokemon.isFusion()) {
      const fusionIcon = this.add.sprite(0, 0, pokemon.getFusionIconAtlasKey(ignoreOverride));
      fusionIcon.setOrigin(0.5, 0);
      fusionIcon.setFrame(pokemon.getFusionIconId(true));

      const originalWidth = icon.width;
      const originalHeight = icon.height;
      const originalFrame = icon.frame;

      const iconHeight = (icon.frame.cutHeight <= fusionIcon.frame.cutHeight ? Math.ceil : Math.floor)((icon.frame.cutHeight + fusionIcon.frame.cutHeight) / 4);

      // Inefficient, but for some reason didn't work with only the unique properties as part of the name
      const iconFrameId = `${icon.frame.name}f${fusionIcon.frame.name}`;

      if (!icon.frame.texture.has(iconFrameId)) {
        icon.frame.texture.add(iconFrameId, icon.frame.sourceIndex, icon.frame.cutX, icon.frame.cutY, icon.frame.cutWidth, iconHeight);
      }

      icon.setFrame(iconFrameId);

      fusionIcon.y = icon.frame.cutHeight;

      const originalFusionFrame = fusionIcon.frame;

      const fusionIconY = fusionIcon.frame.cutY + icon.frame.cutHeight;
      const fusionIconHeight = fusionIcon.frame.cutHeight - icon.frame.cutHeight;

      // Inefficient, but for some reason didn't work with only the unique properties as part of the name
      const fusionIconFrameId = `${fusionIcon.frame.name}f${icon.frame.name}`;

      if (!fusionIcon.frame.texture.has(fusionIconFrameId)) {
        fusionIcon.frame.texture.add(fusionIconFrameId, fusionIcon.frame.sourceIndex, fusionIcon.frame.cutX, fusionIconY, fusionIcon.frame.cutWidth, fusionIconHeight);
      }
      fusionIcon.setFrame(fusionIconFrameId);

      const frameY = (originalFrame.y + originalFusionFrame.y) / 2;
      icon.frame.y = fusionIcon.frame.y = frameY;

      container.add(fusionIcon);

      if (originX !== 0.5) {
        container.x -= originalWidth * (originX - 0.5);
      }
      if (originY !== 0) {
        container.y -= (originalHeight) * originY;
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

  randBattleSeedInt(range: integer, min: integer = 0): integer {
    return this.currentBattle.randSeedInt(this, range, min);
  }

  reset(clearScene: boolean = false, clearData: boolean = false, reloadI18n: boolean = false): void {
    if (clearData) {
      this.gameData = new GameData(this);
    }

    this.gameMode = gameModes[GameModes.CLASSIC];

    this.setSeed(Overrides.SEED_OVERRIDE || Utils.randomString(24));
    console.log("Seed:", this.seed);

    this.disableMenu = false;

    this.score = 0;
    this.money = 0;

    this.lockModifierTiers = false;

    this.pokeballCounts = Object.fromEntries(Utils.getEnumValues(PokeballType).filter(p => p <= PokeballType.MASTER_BALL).map(t => [ t, 0 ]));
    this.pokeballCounts[PokeballType.POKEBALL] += 5;
    if (Overrides.POKEBALL_OVERRIDE.active) {
      this.pokeballCounts = Overrides.POKEBALL_OVERRIDE.pokeballs;
    }

    this.modifiers = [];
    this.enemyModifiers = [];
    this.modifierBar.removeAll(true);
    this.enemyModifierBar.removeAll(true);

    for (const p of this.getParty()) {
      p.destroy();
    }
    this.party = [];
    for (const p of this.getEnemyParty()) {
      p.destroy();
    }

    this.currentBattle = null;

    this.biomeWaveText.setText(startingWave.toString());
    this.biomeWaveText.setVisible(false);

    this.updateMoneyText();
    this.moneyText.setVisible(false);

    this.updateScoreText();
    this.scoreText.setVisible(false);

    [ this.luckLabelText, this.luckText ].map(t => t.setVisible(false));

    this.newArena(Overrides.STARTING_BIOME_OVERRIDE || Biome.TOWN);

    this.field.setVisible(true);

    this.arenaBgTransition.setPosition(0, 0);
    this.arenaPlayer.setPosition(300, 0);
    this.arenaPlayerTransition.setPosition(0, 0);
    [ this.arenaEnemy, this.arenaNextEnemy ].forEach(a => a.setPosition(-280, 0));
    this.arenaNextEnemy.setVisible(false);

    this.arena.init();

    this.trainer.setTexture(`trainer_${this.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
    this.trainer.setPosition(406, 186);
    this.trainer.setVisible(true);

    this.updateGameInfo();

    if (reloadI18n) {
      const localizable: Localizable[] = [
        ...allSpecies,
        ...allMoves,
        ...allAbilities,
        ...Utils.getEnumValues(ModifierPoolType).map(mpt => getModifierPoolForType(mpt)).map(mp => Object.values(mp).flat().map(mt => mt.modifierType).filter(mt => "localize" in mt).map(lpb => lpb as unknown as Localizable)).flat()
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
        targets: [ this.uiContainer ],
        alpha: 0,
        duration: 250,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.clearPhaseQueue();

          this.children.removeAll(true);
          this.game.domContainer.innerHTML = "";
          this.launchBattle();
        }
      });
    }
  }

  newBattle(waveIndex?: integer, battleType?: BattleType, trainerData?: TrainerData, double?: boolean): Battle {
    const newWaveIndex = waveIndex || ((this.currentBattle?.waveIndex || (startingWave - 1)) + 1);
    let newDouble: boolean;
    let newBattleType: BattleType;
    let newTrainer: Trainer;

    let battleConfig: FixedBattleConfig = null;

    this.resetSeed(newWaveIndex);

    const playerField = this.getPlayerField();

    if (this.gameMode.hasFixedBattles && fixedBattles.hasOwnProperty(newWaveIndex) && trainerData === undefined) {
      battleConfig = fixedBattles[newWaveIndex];
      newDouble = battleConfig.double;
      newBattleType = battleConfig.battleType;
      this.executeWithSeedOffset(() => newTrainer = battleConfig.getTrainer(this), (battleConfig.seedOffsetWaveIndex || newWaveIndex) << 8);
      if (newTrainer) {
        this.field.add(newTrainer);
      }
    } else {
      if (!this.gameMode.hasTrainers) {
        newBattleType = BattleType.WILD;
      } else if (battleType === undefined) {
        newBattleType = this.gameMode.isWaveTrainer(newWaveIndex, this.arena) ? BattleType.TRAINER : BattleType.WILD;
      } else {
        newBattleType = battleType;
      }

      if (newBattleType === BattleType.TRAINER) {
        const trainerType = this.arena.randomTrainerType(newWaveIndex);
        let doubleTrainer = false;
        if (trainerConfigs[trainerType].doubleOnly) {
          doubleTrainer = true;
        } else if (trainerConfigs[trainerType].hasDouble) {
          const doubleChance = new Utils.IntegerHolder(newWaveIndex % 10 === 0 ? 32 : 8);
          this.applyModifiers(DoubleBattleChanceBoosterModifier, true, doubleChance);
          playerField.forEach(p => applyAbAttrs(DoubleBattleChanceAbAttr, p, null, doubleChance));
          doubleTrainer = !Utils.randSeedInt(doubleChance.value);
        }
        newTrainer = trainerData !== undefined ? trainerData.toTrainer(this) : new Trainer(this, trainerType, doubleTrainer ? TrainerVariant.DOUBLE : Utils.randSeedInt(2) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT);
        this.field.add(newTrainer);
      }
    }

    if (double === undefined && newWaveIndex > 1) {
      if (newBattleType === BattleType.WILD && !this.gameMode.isWaveFinal(newWaveIndex)) {
        const doubleChance = new Utils.IntegerHolder(newWaveIndex % 10 === 0 ? 32 : 8);
        this.applyModifiers(DoubleBattleChanceBoosterModifier, true, doubleChance);
        playerField.forEach(p => applyAbAttrs(DoubleBattleChanceAbAttr, p, null, doubleChance));
        newDouble = !Utils.randSeedInt(doubleChance.value);
      } else if (newBattleType === BattleType.TRAINER) {
        newDouble = newTrainer.variant === TrainerVariant.DOUBLE;
      }
    } else if (!battleConfig) {
      newDouble = !!double;
    }

    if (Overrides.DOUBLE_BATTLE_OVERRIDE) {
      newDouble = true;
    }

    const lastBattle = this.currentBattle;

    if (lastBattle?.double && !newDouble) {
      this.tryRemovePhase(p => p instanceof SwitchPhase);
    }

    const maxExpLevel = this.getMaxExpLevel();

    this.lastEnemyTrainer = lastBattle?.trainer ?? null;

    this.executeWithSeedOffset(() => {
      this.currentBattle = new Battle(this.gameMode, newWaveIndex, newBattleType, newTrainer, newDouble);
    }, newWaveIndex << 3, this.waveSeed);
    this.currentBattle.incrementTurn(this);

    //this.pushPhase(new TrainerMessageTestPhase(this, TrainerType.RIVAL, TrainerType.RIVAL_2, TrainerType.RIVAL_3, TrainerType.RIVAL_4, TrainerType.RIVAL_5, TrainerType.RIVAL_6));

    if (!waveIndex && lastBattle) {
      let isNewBiome = !(lastBattle.waveIndex % 10) || ((this.gameMode.hasShortBiomes || this.gameMode.isDaily) && (lastBattle.waveIndex % 50) === 49);
      if (!isNewBiome && this.gameMode.hasShortBiomes && (lastBattle.waveIndex % 10) < 9) {
        let w = lastBattle.waveIndex - ((lastBattle.waveIndex % 10) - 1);
        let biomeWaves = 1;
        while (w < lastBattle.waveIndex) {
          let wasNewBiome = false;
          this.executeWithSeedOffset(() => {
            wasNewBiome = !Utils.randSeedInt(6 - biomeWaves);
          }, w << 4);
          if (wasNewBiome) {
            biomeWaves = 1;
          } else {
            biomeWaves++;
          }
          w++;
        }

        this.executeWithSeedOffset(() => {
          isNewBiome = !Utils.randSeedInt(6 - biomeWaves);
        }, lastBattle.waveIndex << 4);
      }
      const resetArenaState = isNewBiome || this.currentBattle.battleType === BattleType.TRAINER || this.currentBattle.battleSpec === BattleSpec.FINAL_BOSS;
      this.getEnemyParty().forEach(enemyPokemon => enemyPokemon.destroy());
      this.trySpreadPokerus();
      if (!isNewBiome && (newWaveIndex % 10) === 5) {
        this.arena.updatePoolsForTimeOfDay();
      }
      if (resetArenaState) {
        this.arena.removeAllTags();
        playerField.forEach((_, p) => this.unshiftPhase(new ReturnPhase(this, p)));
        this.unshiftPhase(new ShowTrainerPhase(this));
      }
      for (const pokemon of this.getParty()) {
        if (pokemon) {
          if (resetArenaState) {
            pokemon.resetBattleData();
            applyPostBattleInitAbAttrs(PostBattleInitAbAttr, pokemon, true);
          }
          this.triggerPokemonFormChange(pokemon, SpeciesFormChangeTimeOfDayTrigger);
        }
      }
      if (!this.gameMode.hasRandomBiomes && !isNewBiome) {
        this.pushPhase(new NextEncounterPhase(this));
      } else {
        this.pushPhase(new SelectBiomePhase(this));
        this.pushPhase(new NewBiomeEncounterPhase(this));

        const newMaxExpLevel = this.getMaxExpLevel();
        if (newMaxExpLevel > maxExpLevel) {
          this.pushPhase(new LevelCapPhase(this));
        }
      }
    }

    return this.currentBattle;
  }

  newArena(biome: Biome): Arena {
    this.arena = new Arena(this, biome, Biome[biome].toLowerCase());
    this.eventTarget.dispatchEvent(new NewArenaEvent());

    this.arenaBg.pipelineData = { terrainColorRatio: this.arena.getBgTerrainColorRatioForBiome() };

    return this.arena;
  }

  updateFieldScale(): Promise<void> {
    return new Promise(resolve => {
      const fieldScale = Math.floor(Math.pow(1 / this.getField(true)
        .map(p => p.getSpriteScale())
        .reduce((highestScale: number, scale: number) => highestScale = Math.max(scale, highestScale), 0), 0.7) * 40
      ) / 40;
      this.setFieldScale(fieldScale).then(() => resolve());
    });
  }

  setFieldScale(scale: number, instant: boolean = false): Promise<void> {
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
        scale: scale,
        x: (defaultWidth - scaledWidth) / 2,
        y: defaultHeight - scaledHeight,
        duration: !instant ? Utils.fixedInt(Math.abs(this.field.scale - scale) * 200) : 0,
        ease: "Sine.easeInOut",
        onComplete: () => resolve()
      });
    });
  }

  getSpeciesFormIndex(species: PokemonSpecies, gender?: Gender, nature?: Nature, ignoreArena?: boolean): integer {
    if (!species.forms?.length) {
      return 0;
    }

    switch (species.speciesId) {
    case Species.UNOWN:
    case Species.SHELLOS:
    case Species.GASTRODON:
    case Species.BASCULIN:
    case Species.DEERLING:
    case Species.SAWSBUCK:
    case Species.FROAKIE:
    case Species.FROGADIER:
    case Species.SCATTERBUG:
    case Species.SPEWPA:
    case Species.VIVILLON:
    case Species.FLABEBE:
    case Species.FLOETTE:
    case Species.FLORGES:
    case Species.FURFROU:
    case Species.ORICORIO:
    case Species.MAGEARNA:
    case Species.ZARUDE:
    case Species.SQUAWKABILLY:
    case Species.TATSUGIRI:
    case Species.PALDEA_TAUROS:
      return Utils.randSeedInt(species.forms.length);
    case Species.PIKACHU:
      return Utils.randSeedInt(8);
    case Species.EEVEE:
      return Utils.randSeedInt(2);
    case Species.GRENINJA:
      return Utils.randSeedInt(2);
    case Species.ZYGARDE:
      return Utils.randSeedInt(3);
    case Species.MINIOR:
      return Utils.randSeedInt(6);
    case Species.ALCREMIE:
      return Utils.randSeedInt(9);
    case Species.MEOWSTIC:
    case Species.INDEEDEE:
    case Species.BASCULEGION:
    case Species.OINKOLOGNE:
      return gender === Gender.FEMALE ? 1 : 0;
    case Species.TOXTRICITY:
      const lowkeyNatures = [ Nature.LONELY, Nature.BOLD, Nature.RELAXED, Nature.TIMID, Nature.SERIOUS, Nature.MODEST, Nature.MILD, Nature.QUIET, Nature.BASHFUL, Nature.CALM, Nature.GENTLE, Nature.CAREFUL ];
      if (nature !== undefined && lowkeyNatures.indexOf(nature) > -1) {
        return 1;
      }
      return 0;
    }

    if (ignoreArena) {
      switch (species.speciesId) {
      case Species.BURMY:
      case Species.WORMADAM:
      case Species.ROTOM:
      case Species.LYCANROC:
        return Utils.randSeedInt(species.forms.length);
      }
      return 0;
    }

    return this.arena.getSpeciesFormIndex(species);
  }

  private getGeneratedOffsetGym(): boolean {
    let ret = false;
    this.executeWithSeedOffset(() => {
      ret = !Utils.randSeedInt(2);
    }, 0, this.seed.toString());
    return ret;
  }

  private getGeneratedWaveCycleOffset(): integer {
    let ret = 0;
    this.executeWithSeedOffset(() => {
      ret = Utils.randSeedInt(8) * 5;
    }, 0, this.seed.toString());
    return ret;
  }

  getEncounterBossSegments(waveIndex: integer, level: integer, species?: PokemonSpecies, forceBoss: boolean = false): integer {
    if (this.gameMode.isDaily && this.gameMode.isWaveFinal(waveIndex)) {
      return 5;
    }

    let isBoss: boolean;
    if (forceBoss || (species && (species.subLegendary || species.legendary || species.mythical))) {
      isBoss = true;
    } else {
      this.executeWithSeedOffset(() => {
        isBoss = waveIndex % 10 === 0 || (this.gameMode.hasRandomBosses && Utils.randSeedInt(100) < Math.min(Math.max(Math.ceil((waveIndex - 250) / 50), 0) * 2, 30));
      }, waveIndex << 2);
    }
    if (!isBoss) {
      return 0;
    }

    let ret: integer = 2;

    if (level >= 100) {
      ret++;
    }
    if (species) {
      if (species.baseTotal >= 670) {
        ret++;
      }
    }
    ret += Math.floor(waveIndex / 250);

    return ret;
  }

  trySpreadPokerus(): void {
    const party = this.getParty();
    const infectedIndexes: integer[] = [];
    const spread = (index: number, spreadTo: number) => {
      const partyMember = party[index + spreadTo];
      if (!partyMember.pokerus && !Utils.randSeedInt(10)) {
        partyMember.pokerus = true;
        infectedIndexes.push(index + spreadTo);
      }
    };
    party.forEach((pokemon, p) => {
      if (!pokemon.pokerus || infectedIndexes.indexOf(p) > -1) {
        return;
      }

      this.executeWithSeedOffset(() => {
        if (p) {
          spread(p, -1);
        }
        if (p < party.length - 1) {
          spread(p, 1);
        }
      }, this.currentBattle.waveIndex + (p << 8));
    });
  }

  resetSeed(waveIndex?: integer): void {
    const wave = waveIndex || this.currentBattle?.waveIndex || 0;
    this.waveSeed = Utils.shiftCharCodes(this.seed, wave);
    Phaser.Math.RND.sow([ this.waveSeed ]);
    console.log("Wave Seed:", this.waveSeed, wave);
    this.rngCounter = 0;
  }

  executeWithSeedOffset(func: Function, offset: integer, seedOverride?: string): void {
    if (!func) {
      return;
    }
    const tempRngCounter = this.rngCounter;
    const tempRngOffset = this.rngOffset;
    const tempRngSeedOverride = this.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    Phaser.Math.RND.sow([ Utils.shiftCharCodes(seedOverride || this.seed, offset) ]);
    this.rngCounter = 0;
    this.rngOffset = offset;
    this.rngSeedOverride = seedOverride || "";
    func();
    Phaser.Math.RND.state(state);
    this.rngCounter = tempRngCounter;
    this.rngOffset = tempRngOffset;
    this.rngSeedOverride = tempRngSeedOverride;
  }

  addFieldSprite(x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number, terrainColorRatio: number = 0): Phaser.GameObjects.Sprite {
    const ret = this.add.sprite(x, y, texture, frame);
    ret.setPipeline(this.fieldSpritePipeline);
    if (terrainColorRatio) {
      ret.pipelineData["terrainColorRatio"] = terrainColorRatio;
    }

    return ret;
  }

  addPokemonSprite(pokemon: Pokemon, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number, hasShadow: boolean = false, ignoreOverride: boolean = false): Phaser.GameObjects.Sprite {
    const ret = this.addFieldSprite(x, y, texture, frame);
    this.initPokemonSprite(ret, pokemon, hasShadow, ignoreOverride);
    return ret;
  }

  initPokemonSprite(sprite: Phaser.GameObjects.Sprite, pokemon?: Pokemon, hasShadow: boolean = false, ignoreOverride: boolean = false): Phaser.GameObjects.Sprite {
    sprite.setPipeline(this.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: hasShadow, ignoreOverride: ignoreOverride, teraColor: pokemon ? getTypeRgb(pokemon.getTeraType()) : undefined });
    this.spriteSparkleHandler.add(sprite);
    return sprite;
  }

  showFieldOverlay(duration: integer): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.fieldOverlay,
        alpha: 0.5,
        ease: "Sine.easeOut",
        duration: duration,
        onComplete: () => resolve()
      });
    });
  }

  hideFieldOverlay(duration: integer): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: this.fieldOverlay,
        alpha: 0,
        duration: duration,
        ease: "Cubic.easeIn",
        onComplete: () => resolve()
      });
    });
  }

  updateBiomeWaveText(): void {
    const isBoss = !(this.currentBattle.waveIndex % 10);
    const biomeString: string = getBiomeName(this.arena.biomeType);
    this.biomeWaveText.setText( biomeString + " - " + this.currentBattle.waveIndex.toString());
    this.biomeWaveText.setColor(!isBoss ? "#ffffff" : "#f89890");
    this.biomeWaveText.setShadowColor(!isBoss ? "#636363" : "#984038");
    this.biomeWaveText.setVisible(true);
  }

  updateMoneyText(forceVisible: boolean = true): void {
    if (this.money === undefined) {
      return;
    }
    const formattedMoney =
			this.moneyFormat === MoneyFormat.ABBREVIATED ? Utils.formatFancyLargeNumber(this.money, 3) : this.money.toLocaleString();
    this.moneyText.setText(`₽${formattedMoney}`);
    if (forceVisible) {
      this.moneyText.setVisible(true);
    }
  }

  updateScoreText(): void {
    this.scoreText.setText(`Score: ${this.score.toString()}`);
    this.scoreText.setVisible(this.gameMode.isDaily);
  }

  updateAndShowLuckText(duration: integer): void {
    const labels = [ this.luckLabelText, this.luckText ];
    labels.map(t => {
      t.setAlpha(0);
      t.setVisible(true);
    });
    const luckValue = getPartyLuckValue(this.getParty());
    this.luckText.setText(getLuckString(luckValue));
    if (luckValue < 14) {
      this.luckText.setTint(getLuckTextTint(luckValue));
    } else {
      this.luckText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
    }
    this.luckLabelText.setX((this.game.canvas.width / 6) - 2 - (this.luckText.displayWidth + 2));
    this.tweens.add({
      targets: labels,
      duration: duration,
      alpha: 1
    });
  }

  hideLuckText(duration: integer): void {
    const labels = [ this.luckLabelText, this.luckText ];
    this.tweens.add({
      targets: labels,
      duration: duration,
      alpha: 0,
      onComplete: () => {
        labels.map(l => l.setVisible(false));
      }
    });
  }

  updateUIPositions(): void {
    const enemyModifierCount = this.enemyModifiers.filter(m => m.isIconVisible(this)).length;
    this.biomeWaveText.setY(-(this.game.canvas.height / 6) + (enemyModifierCount ? enemyModifierCount <= 12 ? 15 : 24 : 0));
    this.moneyText.setY(this.biomeWaveText.y + 10);
    this.scoreText.setY(this.moneyText.y + 10);
    [ this.luckLabelText, this.luckText ].map(l => l.setY((this.scoreText.visible ? this.scoreText : this.moneyText).y + 10));
    const offsetY = (this.scoreText.visible ? this.scoreText : this.moneyText).y + 15;
    this.partyExpBar.setY(offsetY);
    this.candyBar.setY(offsetY + 15);
    this.ui?.achvBar.setY(this.game.canvas.height / 6 + offsetY);
  }

  addFaintedEnemyScore(enemy: EnemyPokemon): void {
    let scoreIncrease = enemy.getSpeciesForm().getBaseExp() * (enemy.level / this.getMaxExpLevel()) * ((enemy.ivs.reduce((iv: integer, total: integer) => total += iv, 0) / 93) * 0.2 + 0.8);
    this.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemy.id, false).map(m => scoreIncrease *= (m as PokemonHeldItemModifier).getScoreMultiplier());
    if (enemy.isBoss()) {
      scoreIncrease *= Math.sqrt(enemy.bossSegments);
    }
    this.currentBattle.battleScore += Math.ceil(scoreIncrease);
  }

  getMaxExpLevel(ignoreLevelCap?: boolean): integer {
    if (ignoreLevelCap) {
      return Number.MAX_SAFE_INTEGER;
    }
    const waveIndex = Math.ceil((this.currentBattle?.waveIndex || 1) / 10) * 10;
    const difficultyWaveIndex = this.gameMode.getWaveForDifficulty(waveIndex);
    const baseLevel = (1 + difficultyWaveIndex / 2 + Math.pow(difficultyWaveIndex / 25, 2)) * 1.2;
    return Math.ceil(baseLevel / 2) * 2 + 2;
  }

  randomSpecies(waveIndex: integer, level: integer, fromArenaPool?: boolean, speciesFilter?: PokemonSpeciesFilter, filterAllEvolutions?: boolean): PokemonSpecies {
    if (fromArenaPool) {
      return this.arena.randomSpecies(waveIndex, level);
    }
    const filteredSpecies = speciesFilter ? [...new Set(allSpecies.filter(s => s.isCatchable()).filter(speciesFilter).map(s => {
      if (!filterAllEvolutions) {
        while (pokemonPrevolutions.hasOwnProperty(s.speciesId)) {
          s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
        }
      }
      return s;
    }))] : allSpecies.filter(s => s.isCatchable());
    return filteredSpecies[Utils.randSeedInt(filteredSpecies.length)];
  }

  generateRandomBiome(waveIndex: integer): Biome {
    const relWave = waveIndex % 250;
    const biomes = Utils.getEnumValues(Biome).slice(1, Utils.getEnumValues(Biome).filter(b => b >= 40).length * -1);
    const maxDepth = biomeDepths[Biome.END][0] - 2;
    const depthWeights = new Array(maxDepth + 1).fill(null)
      .map((_, i: integer) => ((1 - Math.min(Math.abs((i / (maxDepth - 1)) - (relWave / 250)) + 0.25, 1)) / 0.75) * 250);
    const biomeThresholds: integer[] = [];
    let totalWeight = 0;
    for (const biome of biomes) {
      totalWeight += Math.ceil(depthWeights[biomeDepths[biome][0] - 1] / biomeDepths[biome][1]);
      biomeThresholds.push(totalWeight);
    }

    const randInt = Utils.randSeedInt(totalWeight);

    for (const biome of biomes) {
      if (randInt < biomeThresholds[biome]) {
        return biome;
      }
    }

    return biomes[Utils.randSeedInt(biomes.length)];
  }

  isBgmPlaying(): boolean {
    return this.bgm && this.bgm.isPlaying;
  }

  playBgm(bgmName?: string, fadeOut?: boolean): void {
    if (bgmName === undefined) {
      bgmName = this.currentBattle?.getBgmOverride(this) || this.arena?.bgm;
    }
    if (this.bgm && bgmName === this.bgm.key) {
      if (!this.bgm.isPlaying) {
        this.bgm.play({
          volume: this.masterVolume * this.bgmVolume
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
    loopPoint = bgmName === this.arena.bgm
      ? this.arena.getBgmLoopPoint()
      : this.getBgmLoopPoint(bgmName);
    let loaded = false;
    const playNewBgm = () => {
      if (bgmName === null && this.bgm && !this.bgm.pendingRemove) {
        this.bgm.play({
          volume: this.masterVolume * this.bgmVolume
        });
        return;
      }
      if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying) {
        this.bgm.stop();
      }
      this.bgm = this.sound.add(bgmName, { loop: true });
      this.bgm.play({
        volume: this.masterVolume * this.bgmVolume
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
      for (const sound of this.sound.getAllPlaying()) {
        (sound as AnySound).setVolume(this.masterVolume * (this.bgmCache.has(sound.key) ? this.bgmVolume : this.seVolume));
      }
    }
  }

  fadeOutBgm(duration: integer = 500, destroy: boolean = true): boolean {
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

  playSound(sound: string | AnySound, config?: object): AnySound {
    if (config) {
      if (config.hasOwnProperty("volume")) {
        config["volume"] *= this.masterVolume * this.seVolume;
      } else {
        config["volume"] = this.masterVolume * this.seVolume;
      }
    } else {
      config = { volume: this.masterVolume * this.seVolume };
    }
    // PRSFX sounds are mixed too loud
    if ((typeof sound === "string" ? sound : sound.key).startsWith("PRSFX- ")) {
      config["volume"] *= 0.5;
    }
    if (typeof sound === "string") {
      this.sound.play(sound, config);
      return this.sound.get(sound) as AnySound;
    } else {
      sound.play(config);
      return sound;
    }
  }

  playSoundWithoutBgm(soundName: string, pauseDuration?: integer): AnySound {
    this.bgmCache.add(soundName);
    const resumeBgm = this.pauseBgm();
    this.playSound(soundName);
    const sound = this.sound.get(soundName) as AnySound;
    if (this.bgmResumeTimer) {
      this.bgmResumeTimer.destroy();
    }
    if (resumeBgm) {
      this.bgmResumeTimer = this.time.delayedCall((pauseDuration || Utils.fixedInt(sound.totalDuration * 1000)), () => {
        this.resumeBgm();
        this.bgmResumeTimer = null;
      });
    }
    return sound;
  }

  getBgmLoopPoint(bgmName: string): number {
    switch (bgmName) {
    case "battle_kanto_champion":
      return 13.950;
    case "battle_johto_champion":
      return 23.498;
    case "battle_hoenn_champion":
      return 11.328;
    case "battle_sinnoh_champion":
      return 12.235;
    case "battle_champion_alder":
      return 27.653;
    case "battle_champion_iris":
      return 10.145;
    case "battle_elite":
      return 17.730;
    case "battle_final_encounter":
      return 19.159;
    case "battle_final":
      return 16.453;
    case "battle_kanto_gym":
      return 13.857;
    case "battle_johto_gym":
      return 12.911;
    case "battle_hoenn_gym":
      return 12.379;
    case "battle_sinnoh_gym":
      return 13.122;
    case "battle_unova_gym":
      return 19.145;
    case "battle_legendary_regis": //B2W2 Legendary Titan Battle
      return 49.500;
    case "battle_legendary_unova": //BW Unova Legendary Battle
      return 13.855;
    case "battle_legendary_kyurem": //BW Kyurem Battle
      return 18.314;
    case "battle_legendary_res_zek": //BW Reshiram & Zekrom Battle
      return 18.329;
    case "battle_rival":
      return 13.689;
    case "battle_rival_2":
      return 17.714;
    case "battle_rival_3":
      return 17.586;
    case "battle_trainer":
      return 13.686;
    case "battle_wild":
      return 12.703;
    case "battle_wild_strong":
      return 13.940;
    case "end_summit":
      return 30.025;
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

  /* Phase Functions */
  getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase {
    return this.standbyPhase;
  }

  pushPhase(phase: Phase, defer: boolean = false): void {
    (!defer ? this.phaseQueue : this.nextCommandPhaseQueue).push(phase);
  }

  unshiftPhase(phase: Phase): void {
    if (this.phaseQueuePrependSpliceIndex === -1) {
      this.phaseQueuePrepend.push(phase);
    } else {
      this.phaseQueuePrepend.splice(this.phaseQueuePrependSpliceIndex, 0, phase);
    }
  }

  clearPhaseQueue(): void {
    this.phaseQueue.splice(0, this.phaseQueue.length);
  }

  setPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = this.phaseQueuePrepend.length;
  }

  clearPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = -1;
  }

  shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    if (this.phaseQueuePrependSpliceIndex > -1) {
      this.clearPhaseQueueSplice();
    }
    if (this.phaseQueuePrepend.length) {
      while (this.phaseQueuePrepend.length) {
        this.phaseQueue.unshift(this.phaseQueuePrepend.pop());
      }
    }
    if (!this.phaseQueue.length) {
      this.populatePhaseQueue();
    }
    this.currentPhase = this.phaseQueue.shift();
    this.currentPhase.start();
  }

  overridePhase(phase: Phase): boolean {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    phase.start();

    return true;
  }

  findPhase(phaseFilter: (phase: Phase) => boolean): Phase {
    return this.phaseQueue.find(phaseFilter);
  }

  tryReplacePhase(phaseFilter: (phase: Phase) => boolean, phase: Phase): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue[phaseIndex] = phase;
      return true;
    }
    return false;
  }

  tryRemovePhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  pushMovePhase(movePhase: MovePhase, priorityOverride?: integer): void {
    const movePriority = new Utils.IntegerHolder(priorityOverride !== undefined ? priorityOverride : movePhase.move.getMove().priority);
    applyAbAttrs(IncrementMovePriorityAbAttr, movePhase.pokemon, null, movePhase.move.getMove(), movePriority);
    const lowerPriorityPhase = this.phaseQueue.find(p => p instanceof MovePhase && p.move.getMove().priority < movePriority.value);
    if (lowerPriorityPhase) {
      this.phaseQueue.splice(this.phaseQueue.indexOf(lowerPriorityPhase), 0, movePhase);
    } else {
      this.pushPhase(movePhase);
    }
  }

  queueMessage(message: string, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer, defer?: boolean) {
    const phase = new MessagePhase(this, message, callbackDelay, prompt, promptDelay);
    if (!defer) {
      this.unshiftPhase(phase);
    } else {
      this.pushPhase(phase);
    }
  }

  populatePhaseQueue(): void {
    if (this.nextCommandPhaseQueue.length) {
      this.phaseQueue.push(...this.nextCommandPhaseQueue);
      this.nextCommandPhaseQueue.splice(0, this.nextCommandPhaseQueue.length);
    }
    this.phaseQueue.push(new TurnInitPhase(this));
  }

  addMoney(amount: integer): void {
    this.money = Math.min(this.money + amount, Number.MAX_SAFE_INTEGER);
    this.updateMoneyText();
    this.validateAchvs(MoneyAchv);
  }

  getWaveMoneyAmount(moneyMultiplier: number): integer {
    const waveIndex = this.currentBattle.waveIndex;
    const waveSetIndex = Math.ceil(waveIndex / 10) - 1;
    const moneyValue = Math.pow((waveSetIndex + 1 + (0.75 + (((waveIndex - 1) % 10) + 1) / 10)) * 100, 1 + 0.005 * waveSetIndex) * moneyMultiplier;
    return Math.floor(moneyValue / 10) * 10;
  }

  addModifier(modifier: Modifier, ignoreUpdate?: boolean, playSound?: boolean, virtual?: boolean, instant?: boolean): Promise<boolean> {
    return new Promise(resolve => {
      let success = false;
      const soundName = modifier.type.soundName;
      this.validateAchvs(ModifierAchv, modifier);
      const modifiersToRemove: PersistentModifier[] = [];
      const modifierPromises: Promise<boolean>[] = [];
      if (modifier instanceof PersistentModifier) {
        if (modifier instanceof TerastallizeModifier) {
          modifiersToRemove.push(...(this.findModifiers(m => m instanceof TerastallizeModifier && m.pokemonId === modifier.pokemonId)));
        }
        if ((modifier as PersistentModifier).add(this.modifiers, !!virtual, this)) {
          if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier) {
            success = modifier.apply([ this.getPokemonById(modifier.pokemonId), true ]);
          }
          if (playSound && !this.sound.get(soundName)) {
            this.playSound(soundName);
          }
        } else if (!virtual) {
          const defaultModifierType = getDefaultModifierTypeForTier(modifier.type.tier);
          this.queueMessage(`The stack for this item is full.\n You will receive ${defaultModifierType.name} instead.`, null, true);
          return this.addModifier(defaultModifierType.newModifier(), ignoreUpdate, playSound, false, instant).then(success => resolve(success));
        }

        for (const rm of modifiersToRemove) {
          this.removeModifier(rm);
        }

        if (!ignoreUpdate && !virtual) {
          return this.updateModifiers(true, instant).then(() => resolve(success));
        }
      } else if (modifier instanceof ConsumableModifier) {
        if (playSound && !this.sound.get(soundName)) {
          this.playSound(soundName);
        }

        if (modifier instanceof ConsumablePokemonModifier) {
          for (const p in this.party) {
            const pokemon = this.party[p];

            const args: any[] = [ pokemon ];
            if (modifier instanceof PokemonHpRestoreModifier) {
              if (!(modifier as PokemonHpRestoreModifier).fainted) {
                const hpRestoreMultiplier = new Utils.IntegerHolder(1);
                this.applyModifiers(HealingBoosterModifier, true, hpRestoreMultiplier);
                args.push(hpRestoreMultiplier.value);
              } else {
                args.push(1);
              }
            } else if (modifier instanceof FusePokemonModifier) {
              args.push(this.getPokemonById(modifier.fusePokemonId) as PlayerPokemon);
            }

            if (modifier.shouldApply(args)) {
              const result = modifier.apply(args);
              if (result instanceof Promise) {
                modifierPromises.push(result.then(s => success ||= s));
              } else {
                success ||= result;
              }
            }
          }

          return Promise.allSettled([this.party.map(p => p.updateInfo(instant)), ...modifierPromises]).then(() => resolve(success));
        } else {
          const args = [ this ];
          if (modifier.shouldApply(args)) {
            const result = modifier.apply(args);
            if (result instanceof Promise) {
              return result.then(success => resolve(success));
            } else {
              success ||= result;
            }
          }
        }
      }

      resolve(success);
    });
  }

  addEnemyModifier(modifier: PersistentModifier, ignoreUpdate?: boolean, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      const modifiersToRemove: PersistentModifier[] = [];
      if (modifier instanceof TerastallizeModifier) {
        modifiersToRemove.push(...(this.findModifiers(m => m instanceof TerastallizeModifier && m.pokemonId === modifier.pokemonId, false)));
      }
      if ((modifier as PersistentModifier).add(this.enemyModifiers, false, this)) {
        if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier) {
          modifier.apply([ this.getPokemonById(modifier.pokemonId), true ]);
        }
        for (const rm of modifiersToRemove) {
          this.removeModifier(rm, true);
        }
      }
      if (!ignoreUpdate) {
        this.updateModifiers(false, instant).then(() => resolve());
      } else {
        resolve();
      }
    });
  }

  tryTransferHeldItemModifier(itemModifier: PokemonHeldItemModifier, target: Pokemon, transferStack: boolean, playSound: boolean, instant?: boolean, ignoreUpdate?: boolean): Promise<boolean> {
    return new Promise(resolve => {
      const source = itemModifier.pokemonId ? itemModifier.getPokemon(target.scene) : null;
      const cancelled = new Utils.BooleanHolder(false);
      Utils.executeIf(source && source.isPlayer() !== target.isPlayer(), () => applyAbAttrs(BlockItemTheftAbAttr, source, cancelled)).then(() => {
        if (cancelled.value) {
          return resolve(false);
        }
        const newItemModifier = itemModifier.clone() as PokemonHeldItemModifier;
        newItemModifier.pokemonId = target.id;
        const matchingModifier = target.scene.findModifier(m => m instanceof PokemonHeldItemModifier
					&& (m as PokemonHeldItemModifier).matchType(itemModifier) && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier;
        let removeOld = true;
        if (matchingModifier) {
          const maxStackCount = matchingModifier.getMaxStackCount(target.scene);
          if (matchingModifier.stackCount >= maxStackCount) {
            return resolve(false);
          }
          const countTaken = transferStack ? Math.min(itemModifier.stackCount, maxStackCount - matchingModifier.stackCount) : 1;
          itemModifier.stackCount -= countTaken;
          newItemModifier.stackCount = matchingModifier.stackCount + countTaken;
          removeOld = !itemModifier.stackCount;
        } else if (!transferStack) {
          newItemModifier.stackCount = 1;
          removeOld = !(--itemModifier.stackCount);
        }
        if (!removeOld || !source || this.removeModifier(itemModifier, !source.isPlayer())) {
          const addModifier = () => {
            if (!matchingModifier || this.removeModifier(matchingModifier, !target.isPlayer())) {
              if (target.isPlayer()) {
                this.addModifier(newItemModifier, ignoreUpdate, playSound, false, instant).then(() => resolve(true));
              } else {
                this.addEnemyModifier(newItemModifier, ignoreUpdate, instant).then(() => resolve(true));
              }
            } else {
              resolve(false);
            }
          };
          if (source && source.isPlayer() !== target.isPlayer() && !ignoreUpdate) {
            this.updateModifiers(source.isPlayer(), instant).then(() => addModifier());
          } else {
            addModifier();
          }
          return;
        }
        resolve(false);
      });
    });
  }

  removePartyMemberModifiers(partyMemberIndex: integer): Promise<void> {
    return new Promise(resolve => {
      const pokemonId = this.getParty()[partyMemberIndex].id;
      const modifiersToRemove = this.modifiers.filter(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === pokemonId);
      for (const m of modifiersToRemove) {
        this.modifiers.splice(this.modifiers.indexOf(m), 1);
      }
      this.updateModifiers().then(() => resolve());
    });
  }

  generateEnemyModifiers(): Promise<void> {
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

      party.forEach((enemyPokemon: EnemyPokemon, i: integer) => {
        const isBoss = enemyPokemon.isBoss() || (this.currentBattle.battleType === BattleType.TRAINER && this.currentBattle.trainer.config.isBoss);
        let upgradeChance = 32;
        if (isBoss) {
          upgradeChance /= 2;
        }
        if (isFinalBoss) {
          upgradeChance /= 8;
        }
        const modifierChance = this.gameMode.getEnemyModifierChance(isBoss);
        let pokemonModifierChance = modifierChance;
        if (this.currentBattle.battleType === BattleType.TRAINER)
          pokemonModifierChance = Math.ceil(pokemonModifierChance * this.currentBattle.trainer.getPartyMemberModifierChanceMultiplier(i)); // eslint-disable-line
        let count = 0;
        for (let c = 0; c < chances; c++) {
          if (!Utils.randSeedInt(modifierChance)) {
            count++;
          }
        }
        if (isBoss) {
          count = Math.max(count, Math.floor(chances / 2));
        }
        getEnemyModifierTypesForWave(difficultyWaveIndex, count, [ enemyPokemon ], this.currentBattle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD, upgradeChance)
          .map(mt => mt.newModifier(enemyPokemon).add(this.enemyModifiers, false, this));
      });

      this.updateModifiers(false).then(() => resolve());
    });
  }

  /**
	* Removes all modifiers from enemy of PersistentModifier type
	*/
  clearEnemyModifiers(): void {
    const modifiersToRemove = this.enemyModifiers.filter(m => m instanceof PersistentModifier);
    for (const m of modifiersToRemove) {
      this.enemyModifiers.splice(this.enemyModifiers.indexOf(m), 1);
    }
    this.updateModifiers(false).then(() => this.updateUIPositions());
  }

  /**
	* Removes all modifiers from enemy of PokemonHeldItemModifier type
	*/
  clearEnemyHeldItemModifiers(): void {
    const modifiersToRemove = this.enemyModifiers.filter(m => m instanceof PokemonHeldItemModifier);
    for (const m of modifiersToRemove) {
      this.enemyModifiers.splice(this.enemyModifiers.indexOf(m), 1);
    }
    this.updateModifiers(false).then(() => this.updateUIPositions());
  }

  setModifiersVisible(visible: boolean) {
    [ this.modifierBar, this.enemyModifierBar ].map(m => m.setVisible(visible));
  }

  updateModifiers(player?: boolean, instant?: boolean): Promise<void> {
    if (player === undefined) {
      player = true;
    }
    return new Promise(resolve => {
      const modifiers = player ? this.modifiers : this.enemyModifiers as PersistentModifier[];
      for (let m = 0; m < modifiers.length; m++) {
        const modifier = modifiers[m];
        if (modifier instanceof PokemonHeldItemModifier && !this.getPokemonById((modifier as PokemonHeldItemModifier).pokemonId)) {
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

      this.updatePartyForModifiers(player ? this.getParty() : this.getEnemyParty(), instant).then(() => {
        (player ? this.modifierBar : this.enemyModifierBar).updateModifiers(modifiers);
        if (!player) {
          this.updateUIPositions();
        }
        resolve();
      });
    });
  }

  updatePartyForModifiers(party: Pokemon[], instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      Promise.allSettled(party.map(p => {
        if (p.scene) {
          p.calculateStats();
        }
        return p.updateInfo(instant);
      })).then(() => resolve());
    });
  }

  removeModifier(modifier: PersistentModifier, enemy?: boolean): boolean {
    const modifiers = !enemy ? this.modifiers : this.enemyModifiers;
    const modifierIndex = modifiers.indexOf(modifier);
    if (modifierIndex > -1) {
      modifiers.splice(modifierIndex, 1);
      if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier) {
        modifier.apply([ this.getPokemonById(modifier.pokemonId), false ]);
      }
      return true;
    }

    return false;
  }

  getModifiers(modifierType: { new(...args: any[]): Modifier }, player: boolean = true): PersistentModifier[] {
    return (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType);
  }

  findModifiers(modifierFilter: ModifierPredicate, player: boolean = true): PersistentModifier[] {
    return (player ? this.modifiers : this.enemyModifiers).filter(m => (modifierFilter as ModifierPredicate)(m));
  }

  findModifier(modifierFilter: ModifierPredicate, player: boolean = true): PersistentModifier {
    return (player ? this.modifiers : this.enemyModifiers).find(m => (modifierFilter as ModifierPredicate)(m));
  }

  applyShuffledModifiers(scene: BattleScene, modifierType: { new(...args: any[]): Modifier }, player: boolean = true, ...args: any[]): PersistentModifier[] {
    let modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
    scene.executeWithSeedOffset(() => {
      const shuffleModifiers = mods => {
        if (mods.length < 1) {
          return mods;
        }
        const rand = Math.floor(Utils.randSeedInt(mods.length));
        return [mods[rand], ...shuffleModifiers(mods.filter((_, i) => i !== rand))];
      };
      modifiers = shuffleModifiers(modifiers);
    }, scene.currentBattle.turn << 4, scene.waveSeed);
    return this.applyModifiersInternal(modifiers, player, args);
  }

  applyModifiers(modifierType: { new(...args: any[]): Modifier }, player: boolean = true, ...args: any[]): PersistentModifier[] {
    const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
    return this.applyModifiersInternal(modifiers, player, args);
  }

  applyModifiersInternal(modifiers: PersistentModifier[], player: boolean, args: any[]): PersistentModifier[] {
    const appliedModifiers: PersistentModifier[] = [];
    for (const modifier of modifiers) {
      if (modifier.apply(args)) {
        console.log("Applied", modifier.type.name, !player ? "(enemy)" : "");
        appliedModifiers.push(modifier);
      }
    }

    return appliedModifiers;
  }

  applyModifier(modifierType: { new(...args: any[]): Modifier }, player: boolean = true, ...args: any[]): PersistentModifier {
    const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
    for (const modifier of modifiers) {
      if (modifier.apply(args)) {
        console.log("Applied", modifier.type.name, !player ? "(enemy)" : "");
        return modifier;
      }
    }

    return null;
  }

  triggerPokemonFormChange(pokemon: Pokemon, formChangeTriggerType: { new(...args: any[]): SpeciesFormChangeTrigger }, delayed: boolean = false, modal: boolean = false): boolean {
    if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)) {
      const matchingFormChange = pokemonFormChanges[pokemon.species.speciesId].find(fc => fc.findTrigger(formChangeTriggerType) && fc.canChange(pokemon));
      if (matchingFormChange) {
        let phase: Phase;
        if (pokemon instanceof PlayerPokemon && !matchingFormChange.quiet) {
          phase = new FormChangePhase(this, pokemon, matchingFormChange, modal);
        } else {
          phase = new QuietFormChangePhase(this, pokemon, matchingFormChange);
        }
        if (pokemon instanceof PlayerPokemon && !matchingFormChange.quiet && modal) {
          this.overridePhase(phase);
        } else if (delayed) {
          this.pushPhase(phase);
        } else {
          this.unshiftPhase(phase);
        }
        return true;
      }
    }

    return false;
  }

  validateAchvs(achvType: { new(...args: any[]): Achv }, ...args: any[]): void {
    const filteredAchvs = Object.values(achvs).filter(a => a instanceof achvType);
    for (const achv of filteredAchvs) {
      this.validateAchv(achv, args);
    }
  }

  validateAchv(achv: Achv, args?: any[]): boolean {
    if (!this.gameData.achvUnlocks.hasOwnProperty(achv.id) && achv.validate(this, args)) {
      this.gameData.achvUnlocks[achv.id] = new Date().getTime();
      this.ui.achvBar.showAchv(achv);
      if (vouchers.hasOwnProperty(achv.id)) {
        this.validateVoucher(vouchers[achv.id]);
      }
      return true;
    }

    return false;
  }

  validateVoucher(voucher: Voucher, args?: any[]): boolean {
    if (!this.gameData.voucherUnlocks.hasOwnProperty(voucher.id) && voucher.validate(this, args)) {
      this.gameData.voucherUnlocks[voucher.id] = new Date().getTime();
      this.ui.achvBar.showAchv(voucher);
      this.gameData.voucherCounts[voucher.voucherType]++;
      return true;
    }

    return false;
  }

  updateGameInfo(): void {
    const gameInfo = {
      playTime: this.sessionPlayTime ? this.sessionPlayTime : 0,
      gameMode: this.currentBattle ? this.gameMode.getName() : "Title",
      biome: this.currentBattle ? getBiomeName(this.arena.biomeType) : "",
      wave: this.currentBattle?.waveIndex || 0,
      party: this.party ? this.party.map(p => {
        return { name: p.name, level: p.level };
      }) : []
    };
    (window as any).gameInfo = gameInfo;
  }
}
