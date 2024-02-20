import Phaser from 'phaser';
import UI, { Mode } from './ui/ui';
import { EncounterPhase, SummonPhase, NextEncounterPhase, NewBiomeEncounterPhase, SelectBiomePhase, MessagePhase, CheckLoadPhase, TurnInitPhase, ReturnPhase, LevelCapPhase, TestMessagePhase, ShowTrainerPhase, TrainerMessageTestPhase, LoginPhase, ConsolidateDataPhase, SelectGenderPhase } from './battle-phases';
import Pokemon, { PlayerPokemon, EnemyPokemon } from './pokemon';
import PokemonSpecies, { PokemonSpeciesFilter, allSpecies, getPokemonSpecies, initSpecies, speciesStarters } from './data/pokemon-species';
import * as Utils from './utils';
import { Modifier, ModifierBar, ConsumablePokemonModifier, ConsumableModifier, PokemonHpRestoreModifier, HealingBoosterModifier, PersistentModifier, PokemonHeldItemModifier, ModifierPredicate, DoubleBattleChanceBoosterModifier, FusePokemonModifier, PokemonFormChangeItemModifier, TerastallizeModifier } from './modifier/modifier';
import { PokeballType } from './data/pokeball';
import { initAutoPlay } from './system/auto-play';
import { initCommonAnims, initMoveAnim, loadCommonAnimAssets, loadMoveAnimAssets, populateAnims } from './data/battle-anims';
import { BattlePhase } from './battle-phase';
import { initGameSpeed } from './system/game-speed';
import { Biome } from "./data/enums/biome";
import { Arena, ArenaBase, getBiomeHasProps, getBiomeKey } from './arena';
import { GameData, PlayerGender } from './system/game-data';
import StarterSelectUiHandler from './ui/starter-select-ui-handler';
import { TextStyle, addTextObject } from './ui/text';
import { Moves } from "./data/enums/moves";
import { } from "./data/move";
import { initMoves } from './data/move';
import { ModifierPoolType, getDefaultModifierTypeForTier, getEnemyModifierTypesForWave } from './modifier/modifier-type';
import AbilityBar from './ui/ability-bar';
import { BlockItemTheftAbAttr, DoubleBattleChanceAbAttr, applyAbAttrs, initAbilities } from './data/ability';
import Battle, { BattleType, FixedBattleConfig, fixedBattles } from './battle';
import { GameMode } from './game-mode';
import FieldSpritePipeline from './pipelines/field-sprite';
import SpritePipeline from './pipelines/sprite';
import PartyExpBar from './ui/party-exp-bar';
import { trainerConfigs } from './data/trainer-config';
import { TrainerType } from "./data/enums/trainer-type";
import Trainer from './trainer';
import TrainerData from './system/trainer-data';
import SoundFade from 'phaser3-rex-plugins/plugins/soundfade';
import { pokemonPrevolutions } from './data/pokemon-evolutions';
import PokeballTray from './ui/pokeball-tray';
import { Setting, settingOptions } from './system/settings';
import SettingsUiHandler from './ui/settings-ui-handler';
import MessageUiHandler from './ui/message-ui-handler';
import { Species } from './data/enums/species';
import InvertPostFX from './pipelines/invert';
import { Achv, ModifierAchv, achvs } from './system/achv';
import { GachaType } from './data/egg';
import { Voucher, vouchers } from './system/voucher';
import { Gender } from './data/gender';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { WindowVariant, getWindowVariantSuffix } from './ui/window';
import PokemonData from './system/pokemon-data';
import { Nature } from './data/nature';
import { SpeciesFormChangeTimeOfDayTrigger, SpeciesFormChangeTrigger, pokemonFormChanges } from './data/pokemon-forms';
import { FormChangePhase, QuietFormChangePhase } from './form-change-phase';
import { BattleSpec } from './enums/battle-spec';
import { getTypeRgb } from './data/type';
import PokemonSpriteSparkleHandler from './sprite/pokemon-sprite-sparkle-handler';

const enableAuto = true;
const quickStart = false;
export const bypassLogin = false;
export const startingLevel = 5;
export const startingWave = 1;
export const startingBiome = Biome.TOWN;
export const startingMoney = 1000;

export enum Button {
	UP,
	DOWN,
	LEFT,
	RIGHT,
	SUBMIT,
	ACTION,
	CANCEL,
	MENU,
	CYCLE_SHINY,
	CYCLE_FORM,
	CYCLE_GENDER,
	CYCLE_ABILITY,
	CYCLE_NATURE,
	QUICK_START,
	AUTO,
	SPEED_UP,
	SLOW_DOWN
}

export interface PokeballCounts {
	[pb: string]: integer;
}

export type AnySound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

export default class BattleScene extends Phaser.Scene {
	public rexUI: UIPlugin;

	public auto: boolean;
	public sessionPlayTime: integer = null;
	public masterVolume: number = 0.5;
	public bgmVolume: number = 1;
	public seVolume: number = 1;
	public gameSpeed: integer = 1;
	public showLevelUpStats: boolean = true;
	public enableTutorials: boolean = true;
	public windowType: integer = 1;
	public enableTouchControls: boolean = false;
	public enableVibration: boolean = false;
	public quickStart: boolean = quickStart;
	public finalWave: integer = 200;
	
	public gameData: GameData;

	private phaseQueue: BattlePhase[];
	private phaseQueuePrepend: BattlePhase[];
	private phaseQueuePrependSpliceIndex: integer;
	private currentPhase: BattlePhase;
	private standbyPhase: BattlePhase;
	public field: Phaser.GameObjects.Container;
	public fieldUI: Phaser.GameObjects.Container;
	public pbTray: PokeballTray;
	public pbTrayEnemy: PokeballTray;
	public abilityBar: AbilityBar;
	public partyExpBar: PartyExpBar;
	public arenaBg: Phaser.GameObjects.Sprite;
	public arenaBgTransition: Phaser.GameObjects.Sprite;
	public arenaPlayer: ArenaBase;
	public arenaPlayerTransition: ArenaBase;
	public arenaEnemy: ArenaBase;
	public arenaNextEnemy: ArenaBase;
	public arena: Arena;
	public gameMode: GameMode;
	public trainer: Phaser.GameObjects.Sprite;
	public lastEnemyTrainer: Trainer;
	public currentBattle: Battle;
	public pokeballCounts: PokeballCounts;
	public money: integer;
	private party: PlayerPokemon[];
	private waveCountText: Phaser.GameObjects.Text;
	private moneyText: Phaser.GameObjects.Text;
	private modifierBar: ModifierBar;
	private enemyModifierBar: ModifierBar;
	private fieldOverlay: Phaser.GameObjects.Rectangle;
	private modifiers: PersistentModifier[];
	private enemyModifiers: PersistentModifier[];
	public uiContainer: Phaser.GameObjects.Container;
	public ui: UI;

	public seed: string;
	public waveSeed: string;

	private spriteSparkleHandler: PokemonSpriteSparkleHandler;

	public fieldSpritePipeline: FieldSpritePipeline;
	public spritePipeline: SpritePipeline;

	private bgm: AnySound;
	private bgmResumeTimer: Phaser.Time.TimerEvent;
	private bgmCache: Set<string> = new Set();
	private playTimeTimer: Phaser.Time.TimerEvent;
	
	private buttonKeys: Phaser.Input.Keyboard.Key[][];

	private blockInput: boolean;

	constructor() {
		super('battle');

		initSpecies();
		initMoves();
		initAbilities();
		
		this.phaseQueue = [];
		this.phaseQueuePrepend = [];
		this.phaseQueuePrependSpliceIndex = -1;
	}

	loadImage(key: string, folder: string, filename?: string) {
		if (!filename)
			filename = `${key}.png`;
		this.load.image(key, `images/${folder}/${filename}`);
	}

	loadAtlas(key: string, folder: string, filenameRoot?: string) {
		if (!filenameRoot)
			filenameRoot = key;
		if (folder)
			folder += '/';
		this.load.atlas(key, `images/${folder}${filenameRoot}.png`, `images/${folder}/${filenameRoot}.json`);
	}

	loadSpritesheet(key: string, folder: string, size: integer, filename?: string) {
		if (!filename)
			filename = `${key}.png`;
		this.load.spritesheet(key, `images/${folder}/${filename}`, { frameWidth: size, frameHeight: size });
	}

	loadSe(key: string, folder?: string, filenames?: string | string[]) {
		if (!filenames)
			filenames = `${key}.wav`;
		if (!folder)
			folder = '';
		else
			folder += '/';
		if (!Array.isArray(filenames))
			filenames = [ filenames ];
		for (let f of filenames as string[]) {
			this.load.audio(key, `audio/se/${folder}${f}`);
		}
	}

	loadBgm(key: string, filename?: string) {
		if (!filename)
			filename = `${key}.mp3`;
		this.load.audio(key, `audio/bgm/${filename}`);
	}

	preload() {
		// Load menu images
		this.loadImage('bg', 'ui');
		this.loadImage('command_fight_labels', 'ui');
		this.loadAtlas('prompt', 'ui');
		this.loadImage('cursor', 'ui');
		for (let wv of Utils.getEnumValues(WindowVariant)) {
			for (let w = 1; w <= 4; w++)
				this.loadImage(`window_${w}${getWindowVariantSuffix(wv)}`, 'ui/windows');
		}
		this.loadImage('namebox', 'ui');
		this.loadImage('pbinfo_player', 'ui');
		this.loadImage('pbinfo_player_mini', 'ui');
		this.loadImage('pbinfo_enemy_mini', 'ui');
		this.loadImage('pbinfo_enemy_boss', 'ui');
		this.loadImage('overlay_lv', 'ui');
		this.loadAtlas('numbers', 'ui');
		this.loadAtlas('numbers_red', 'ui');
		this.loadAtlas('overlay_hp', 'ui');
		this.loadAtlas('overlay_hp_boss', 'ui');
		this.loadImage('overlay_exp', 'ui');
		this.loadImage('icon_owned', 'ui');
		this.loadImage('ability_bar', 'ui');
		this.loadImage('party_exp_bar', 'ui');
		this.loadImage('achv_bar', 'ui');
		this.loadImage('achv_bar_2', 'ui');
		this.loadImage('achv_bar_3', 'ui');
		this.loadImage('achv_bar_4', 'ui');
		this.loadImage('shiny_star', 'ui', 'shiny.png');
		this.loadImage('icon_spliced', 'ui');
		this.loadImage('icon_tera', 'ui');
		this.loadImage('type_tera', 'ui');

		this.loadImage('pb_tray_overlay_player', 'ui');
		this.loadImage('pb_tray_overlay_enemy', 'ui');
		this.loadAtlas('pb_tray_ball', 'ui');

		this.loadImage('party_bg', 'ui');
		this.loadImage('party_bg_double', 'ui');
		this.loadAtlas('party_slot_main', 'ui');
		this.loadAtlas('party_slot', 'ui');
		this.loadImage('party_slot_overlay_lv', 'ui');
		this.loadImage('party_slot_hp_bar', 'ui');
		this.loadAtlas('party_slot_hp_overlay', 'ui');
		this.loadAtlas('party_pb', 'ui');
		this.loadAtlas('party_cancel', 'ui');

		this.loadImage('summary_bg', 'ui');
		this.loadImage('summary_overlay_shiny', 'ui');
		this.loadImage('summary_profile', 'ui');
		this.loadImage('summary_status', 'ui');
		this.loadImage('summary_stats', 'ui');
		this.loadImage('summary_stats_overlay_exp', 'ui');
		this.loadImage('summary_moves', 'ui');
		this.loadImage('summary_moves_effect', 'ui');
		this.loadImage('summary_moves_overlay_row', 'ui');
		this.loadImage('summary_moves_overlay_pp', 'ui');
		this.loadAtlas('summary_moves_cursor', 'ui');
		for (let t = 1; t <= 3; t++)
			this.loadImage(`summary_tabs_${t}`, 'ui');

		this.loadImage('starter_select_bg', 'ui');
		this.loadImage('starter_select_cursor', 'ui');
		this.loadImage('starter_select_cursor_highlight', 'ui');
		this.loadImage('starter_select_cursor_pokerus', 'ui');
		this.loadImage('starter_select_gen_cursor', 'ui');
		this.loadImage('starter_select_gen_cursor_highlight', 'ui');

		this.loadImage('default_bg', 'arenas');

		// Load arena images
		Utils.getEnumValues(Biome).map(bt => {
			const btKey = Biome[bt].toLowerCase();
			const isBaseAnimated = btKey === 'end';
			const baseAKey = `${btKey}_a`;
			const baseBKey = `${btKey}_b`;
			this.loadImage(`${btKey}_bg`, 'arenas');
			if (!isBaseAnimated)
				this.loadImage(baseAKey, 'arenas');
			else
				this.loadAtlas(baseAKey, 'arenas');
			if (!isBaseAnimated)
				this.loadImage(baseBKey, 'arenas');
			else
				this.loadAtlas(baseBKey, 'arenas');
			if (getBiomeHasProps(bt)) {
				for (let p = 1; p <= 3; p++) {
					const isPropAnimated = p === 3 && btKey === 'end';
					const propKey = `${btKey}_b_${p}`;
					if (!isPropAnimated)
						this.loadImage(propKey, 'arenas');
					else
						this.loadAtlas(propKey, 'arenas');
				}
			}
		});

		// Load trainer images
		this.loadAtlas('trainer_m_back', 'trainer');
		this.loadAtlas('trainer_m_back_pb', 'trainer');
		this.loadAtlas('trainer_f_back', 'trainer');
		this.loadAtlas('trainer_f_back_pb', 'trainer');

		Utils.getEnumValues(TrainerType).map(tt => {
			const config = trainerConfigs[tt];
			this.loadAtlas(config.getKey(), 'trainer');
			if (config.isDouble)
				this.loadAtlas(config.getKey(true), 'trainer');
		});

		// Load pokemon-related images
		this.loadImage(`pkmn__back__sub`, 'pokemon/back', 'sub.png');
		this.loadImage(`pkmn__sub`, 'pokemon', 'sub.png');
		this.loadAtlas('battle_stats', 'effects');
		this.loadAtlas('shiny', 'effects');
		this.loadImage('tera', 'effects');
		this.loadAtlas('pb_particles', 'effects');
		this.loadImage('evo_sparkle', 'effects');
		this.loadAtlas('tera_sparkle', 'effects');
		this.load.video('evo_bg', 'images/effects/evo_bg.mp4', true);

		this.loadAtlas('pb', '');
		this.loadAtlas('items', '');
		this.loadAtlas('types', '');
		this.loadAtlas('statuses', '');
		this.loadAtlas('categories', '');
		
		this.loadAtlas('egg', 'egg');
		this.loadAtlas('egg_crack', 'egg');
		this.loadAtlas('egg_icons', 'egg');
		this.loadAtlas('egg_shard', 'egg');
		this.loadAtlas('egg_lightrays', 'egg');
		Utils.getEnumKeys(GachaType).forEach(gt => {
			const key = gt.toLowerCase();
			this.loadImage(`gacha_${key}`, 'egg');
			this.loadAtlas(`gacha_underlay_${key}`, 'egg');
		});
		this.loadImage('gacha_glass', 'egg');
		this.loadImage('gacha_eggs', 'egg');
		this.loadAtlas('gacha_hatch', 'egg');
		this.loadImage('gacha_knob', 'egg');

		this.loadImage('egg_list_bg', 'ui');

		for (let i = 0; i < 10; i++)
			this.loadAtlas(`pokemon_icons_${i}`, 'ui');

		this.loadSe('select');
		this.loadSe('menu_open');
		this.loadSe('hit');
		this.loadSe('hit_strong');
		this.loadSe('hit_weak');
		this.loadSe('stat_up');
		this.loadSe('stat_down');
		this.loadSe('faint');
		this.loadSe('flee');
		this.loadSe('low_hp');
		this.loadSe('exp');
		this.loadSe('level_up');
		this.loadSe('sparkle');
		this.loadSe('restore');
		this.loadSe('shine');
		this.loadSe('charge');
		this.loadSe('beam');
		this.loadSe('upgrade');
		this.loadSe('buy');
		this.loadSe('achv');
		this.loadSe('error');

		this.loadSe('pb_rel');
		this.loadSe('pb_throw');
		this.loadSe('pb_bounce_1');
		this.loadSe('pb_bounce_2');
		this.loadSe('pb_move');
		this.loadSe('pb_catch');
		this.loadSe('pb_lock');

		this.loadSe('pb_tray_enter');
		this.loadSe('pb_tray_ball');
		this.loadSe('pb_tray_empty');

		this.loadSe('egg_crack');
		this.loadSe('egg_hatch');
		this.loadSe('gacha_dial');
		this.loadSe('gacha_running');
		this.loadSe('gacha_dispense');

		this.loadSe('PRSFX- Transform', 'battle_anims');

		this.loadBgm('menu');

		this.loadBgm('level_up_fanfare', 'bw/level_up_fanfare.mp3');
		this.loadBgm('item_fanfare', 'bw/item_fanfare.mp3');
		this.loadBgm('minor_fanfare', 'bw/minor_fanfare.mp3');
		this.loadBgm('heal', 'bw/heal.mp3');
		this.loadBgm('victory_trainer', 'bw/victory_trainer.mp3');
		this.loadBgm('victory_gym', 'bw/victory_gym.mp3');
		this.loadBgm('victory_champion', 'bw/victory_champion.mp3');
		this.loadBgm('evolution', 'bw/evolution.mp3');
		this.loadBgm('evolution_fanfare', 'bw/evolution_fanfare.mp3');
		
		populateAnims();

		this.load.plugin('rextexteditplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rextexteditplugin.min.js', true);
	}

	create() {
		initGameSpeed.apply(this);

		this.gameData = new GameData(this);

		this.setupControls();

		this.load.setBaseURL();

		this.spritePipeline = new SpritePipeline(this.game);
		(this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add('Sprite', this.spritePipeline);

		this.fieldSpritePipeline = new FieldSpritePipeline(this.game);
		(this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.add('FieldSprite', this.fieldSpritePipeline);

		this.time.delayedCall(20, () => this.launchBattle());
	}

	update() {
		this.checkInput();
		this.ui?.update();
	}

	launchBattle() {
		this.arenaBg = this.addFieldSprite(0, 0, 'plains_bg');
		this.arenaBgTransition = this.addFieldSprite(0, 0, `plains_bg`);

		[ this.arenaBgTransition, this.arenaBg ].forEach(a => {
			a.setScale(6);
			a.setOrigin(0);
		});

		const field = this.add.container(0, 0);
		field.setScale(6);

		this.field = field;

		const fieldUI = this.add.container(0, this.game.canvas.height);
		fieldUI.setDepth(1);
		fieldUI.setScale(6);

		this.fieldUI = fieldUI;

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

		this.waveCountText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, startingWave.toString(), TextStyle.BATTLE_INFO);
		this.waveCountText.setOrigin(1, 0);
		this.fieldUI.add(this.waveCountText);

		this.moneyText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, startingWave.toString(), TextStyle.MONEY);
		this.moneyText.setOrigin(1, 0);
		this.fieldUI.add(this.moneyText);

		this.updateUIPositions();

		this.spriteSparkleHandler = new PokemonSpriteSparkleHandler();
		this.spriteSparkleHandler.setup(this);

		this.party = [];

		let loadPokemonAssets = [];

		this.quickStart = this.quickStart || this.isButtonPressed(Button.QUICK_START);

		this.arenaPlayer = new ArenaBase(this, true);
		this.arenaPlayerTransition = new ArenaBase(this, true);
		this.arenaEnemy = new ArenaBase(this, false);
		this.arenaNextEnemy = new ArenaBase(this, false);

		this.arenaBgTransition.setVisible(false);
		this.arenaPlayerTransition.setVisible(false);
		this.arenaNextEnemy.setVisible(false);

		[ this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy ].forEach(a => {
			if (a instanceof Phaser.GameObjects.Sprite)
				a.setOrigin(0, 0);
			field.add(a);
		});

		const trainer = this.addFieldSprite(0, 0, `trainer_${this.gameData.gender === PlayerGender.FEMALE ? 'f' : 'm'}_back`);
		trainer.setOrigin(0.5, 1);

		field.add(trainer);

		this.trainer = trainer;

		this.anims.create({
			key: 'prompt',
			frames: this.anims.generateFrameNumbers('prompt', { start: 1, end: 4 }),
			frameRate: 6,
			repeat: -1,
			showOnStart: true
		});

		this.anims.create({
			key: 'tera_sparkle',
			frames: this.anims.generateFrameNumbers('tera_sparkle', { start: 0, end: 12 }),
			frameRate: 18,
			repeat: 0,
			showOnStart: true,
			hideOnComplete: true
		});

		this.reset();

		if (this.quickStart) {
			this.newBattle();

			for (let s = 0; s < 3; s++) {
				const playerSpecies = this.randomSpecies(startingWave, startingLevel);
				const playerPokemon = this.addPlayerPokemon(playerSpecies, startingLevel, 0, 0);
				playerPokemon.setVisible(false);
				this.party.push(playerPokemon);

				loadPokemonAssets.push(playerPokemon.loadAssets());
			}
		}

		const ui = new UI(this);
		this.uiContainer.add(ui);

		this.ui = ui;

		ui.setup();

		Promise.all([
			Promise.all(loadPokemonAssets),
			initCommonAnims().then(() => loadCommonAnimAssets(this, true)),
			initMoveAnim(Moves.STRUGGLE).then(() => loadMoveAnimAssets(this, [ Moves.STRUGGLE ], true))
		]).then(() => {
			if (enableAuto)
				initAutoPlay.apply(this);

			if (!this.quickStart) {
				this.pushPhase(new LoginPhase(this));
				if (!bypassLogin)
					this.pushPhase(new ConsolidateDataPhase(this)); // TODO: Remove
				this.pushPhase(new CheckLoadPhase(this));
			} else
				this.pushPhase(new EncounterPhase(this));

			this.shiftPhase();
		});
	}

	initSession(): void {
		this.sessionPlayTime = 0;

		if (this.playTimeTimer)
			this.playTimeTimer.destroy();

		this.playTimeTimer = this.time.addEvent({
			delay: Utils.fixedInt(1000),
			repeat: -1,
    	callback: () => {
				if (this.gameData)
					this.gameData.gameStats.playTime++;
				if (this.sessionPlayTime !== null)
					this.sessionPlayTime++;
			}
		});

		this.updateWaveCountText();
		this.updateMoneyText();
	}

	setupControls() {
		const keyCodes = Phaser.Input.Keyboard.KeyCodes;
		const keyConfig = {
			[Button.UP]: [keyCodes.UP, keyCodes.W],
			[Button.DOWN]: [keyCodes.DOWN, keyCodes.S],
			[Button.LEFT]: [keyCodes.LEFT, keyCodes.A],
			[Button.RIGHT]: [keyCodes.RIGHT, keyCodes.D],
			[Button.SUBMIT]: [keyCodes.ENTER],
			[Button.ACTION]: [keyCodes.SPACE, keyCodes.ENTER, keyCodes.Z],
			[Button.CANCEL]: [keyCodes.BACKSPACE, keyCodes.X],
			[Button.MENU]: [keyCodes.ESC, keyCodes.M],
			[Button.CYCLE_SHINY]: [keyCodes.R],
			[Button.CYCLE_FORM]: [keyCodes.F],
			[Button.CYCLE_GENDER]: [keyCodes.G],
			[Button.CYCLE_ABILITY]: [keyCodes.E],
			[Button.CYCLE_NATURE]: [keyCodes.N],
			[Button.QUICK_START]: [keyCodes.Q],
			[Button.AUTO]: [keyCodes.F2],
			[Button.SPEED_UP]: [keyCodes.PLUS],
			[Button.SLOW_DOWN]: [keyCodes.MINUS]
		};
		const mobileKeyConfig = {};
		this.buttonKeys = [];
		for (let b of Utils.getEnumValues(Button)) {
			const keys: Phaser.Input.Keyboard.Key[] = [];
			if (keyConfig.hasOwnProperty(b)) {
				for (let k of keyConfig[b])
					keys.push(this.input.keyboard.addKey(k, false));
				mobileKeyConfig[Button[b]] = keys[0];
			}
			this.buttonKeys[b] = keys;
		}

		initTouchControls(mobileKeyConfig);
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

	getField(): Pokemon[] {
		const ret = new Array(4).fill(null);
		const playerField = this.getPlayerField();
		const enemyField = this.getEnemyField();
		ret.splice(0, playerField.length, ...playerField);
		ret.splice(2, enemyField.length, ...enemyField);
		return ret;
	}

	getPokemonById(pokemonId: integer): Pokemon {
		const findInParty = (party: Pokemon[]) => party.find(p => p.id === pokemonId);
		return findInParty(this.getParty()) || findInParty(this.getEnemyParty());
	}

	addPlayerPokemon(species: PokemonSpecies, level: integer, abilityIndex: integer, formIndex: integer, gender?: Gender, shiny?: boolean, ivs?: integer[], nature?: Nature, dataSource?: Pokemon | PokemonData, postProcess?: (playerPokemon: PlayerPokemon) => void): PlayerPokemon {
		const pokemon = new PlayerPokemon(this, species, level, abilityIndex, formIndex, gender, shiny, ivs, nature, dataSource);
		if (postProcess)
			postProcess(pokemon);
		pokemon.init();
		return pokemon;
	}

	addEnemyPokemon(species: PokemonSpecies, level: integer, trainer: boolean, boss: boolean = false, dataSource?: PokemonData, postProcess?: (enemyPokemon: EnemyPokemon) => void): EnemyPokemon {
		const pokemon = new EnemyPokemon(this, species, level, trainer, boss, dataSource);
		if (postProcess)
			postProcess(pokemon);
		pokemon.init();
		return pokemon;
	}

	reset(clearScene?: boolean): void {
		this.seed = Utils.randomString(16);
		console.log('Seed:', this.seed);

		this.gameMode = GameMode.CLASSIC;

		this.money = startingMoney;

		this.pokeballCounts = Object.fromEntries(Utils.getEnumValues(PokeballType).filter(p => p <= PokeballType.MASTER_BALL).map(t => [ t, 0 ]));
		this.pokeballCounts[PokeballType.POKEBALL] += 5;

		this.modifiers = [];
		this.enemyModifiers = [];
		this.modifierBar.removeAll(true);
		this.enemyModifierBar.removeAll(true);

		for (let p of this.getParty())
			p.destroy();
		this.party = [];
		for (let p of this.getEnemyParty())
			p.destroy();
			
		this.currentBattle = null;
		this.waveCountText.setText(startingWave.toString());
		this.waveCountText.setVisible(false);

		this.updateMoneyText();
		this.moneyText.setVisible(false);

		this.newArena(startingBiome, true);

		this.arenaBgTransition.setPosition(0, 0);
		this.arenaPlayer.setPosition(300, 0);
		this.arenaPlayerTransition.setPosition(0, 0);
		[ this.arenaEnemy, this.arenaNextEnemy ].forEach(a => a.setPosition(-280, 0));
		this.arenaNextEnemy.setVisible(false);

		this.trainer.setTexture(`trainer_${this.gameData.gender === PlayerGender.FEMALE ? 'f' : 'm'}_back`);
		this.trainer.setPosition(406, 186);

		if (clearScene) {
			this.fadeOutBgm(250, false);
			this.tweens.add({
				targets: [ this.uiContainer ],
				alpha: 0,
				duration: 250,
				ease: 'Sine.easeInOut',
				onComplete: () => {
					this.clearPhaseQueue();

					this.children.removeAll(true);
					this.game.domContainer.innerHTML = '';
					this.launchBattle();
				}
			});
		}
	}

	newBattle(waveIndex?: integer, battleType?: BattleType, trainerData?: TrainerData, double?: boolean): Battle {
		let newWaveIndex = waveIndex || ((this.currentBattle?.waveIndex || (startingWave - 1)) + 1);
		let newDouble: boolean;
		let newBattleType: BattleType;
		let newTrainer: Trainer;

		let battleConfig: FixedBattleConfig = null;

		this.resetSeed(newWaveIndex);
		
		if (fixedBattles.hasOwnProperty(newWaveIndex) && this.gameMode === GameMode.CLASSIC && trainerData === undefined) {
			battleConfig = fixedBattles[newWaveIndex];
			newDouble = battleConfig.double;
			newBattleType = battleConfig.battleType;
			this.executeWithSeedOffset(() => newTrainer = battleConfig.getTrainer(this), (battleConfig.seedOffsetWaveIndex || newWaveIndex) << 8);
			if (newTrainer)
				this.field.add(newTrainer);
		} else {
			if (this.gameMode !== GameMode.CLASSIC)
				newBattleType = BattleType.WILD;
			else if (battleType === undefined) {
				if ((newWaveIndex % 30) === 20 && newWaveIndex !== 200)
					newBattleType = BattleType.TRAINER;
				else if (newWaveIndex % 10 !== 1 && newWaveIndex % 10) {
					const trainerChance = this.arena.getTrainerChance();
					let allowTrainerBattle = true;
					if (trainerChance && this.gameMode === GameMode.CLASSIC) {
						const waveBase = Math.floor(newWaveIndex / 10) * 10;
						for (let w = Math.max(newWaveIndex - 3, waveBase + 2); w <= Math.min(newWaveIndex + 3, waveBase + 9); w++) {
							if (w === newWaveIndex)
								continue;
							if ((w % 30) === 20 || fixedBattles.hasOwnProperty(w)) {
								allowTrainerBattle = false;
								break;
							} else if (w < newWaveIndex) {
								this.executeWithSeedOffset(() => {
									const waveTrainerChance = this.arena.getTrainerChance();
									if (!Utils.randSeedInt(waveTrainerChance))
										allowTrainerBattle = false;
								}, w);
								if (!allowTrainerBattle)
									break;
							}
						}
					}
					newBattleType = allowTrainerBattle && trainerChance && !Utils.randSeedInt(trainerChance) ? BattleType.TRAINER : BattleType.WILD;
				} else
					newBattleType = BattleType.WILD;
			} else
				newBattleType = battleType;

			if (newBattleType === BattleType.TRAINER) {
				newTrainer = trainerData !== undefined ? trainerData.toTrainer(this) : new Trainer(this, this.arena.randomTrainerType(newWaveIndex), !!Utils.randSeedInt(2));
				this.field.add(newTrainer);
			}
		}

		const playerField = this.getPlayerField();

		if (double === undefined && newWaveIndex > 1) {
			if (newBattleType === BattleType.WILD && (this.gameMode === GameMode.CLASSIC ? newWaveIndex !== 200 : newWaveIndex % 250)) {
				const doubleChance = new Utils.IntegerHolder(newWaveIndex % 10 === 0 ? 32 : 8);
				this.applyModifiers(DoubleBattleChanceBoosterModifier, true, doubleChance);
				playerField.forEach(p => applyAbAttrs(DoubleBattleChanceAbAttr, p, null, doubleChance));
				newDouble = !Utils.randSeedInt(doubleChance.value);
			} else if (newBattleType === BattleType.TRAINER)
				newDouble = newTrainer.config.isDouble;
		} else if (!battleConfig)
			newDouble = !!double;

		const lastBattle = this.currentBattle;

		const maxExpLevel = this.getMaxExpLevel();

		this.lastEnemyTrainer = lastBattle?.trainer ?? null;

		this.currentBattle = new Battle(this.gameMode, newWaveIndex, newBattleType, newTrainer, newDouble);
		this.currentBattle.incrementTurn(this);

		//this.pushPhase(new TrainerMessageTestPhase(this));

		if (!waveIndex && lastBattle) {
			const isNewBiome = !(lastBattle.waveIndex % 10);
			const resetArenaState = isNewBiome || this.currentBattle.battleType === BattleType.TRAINER || this.currentBattle.battleSpec === BattleSpec.FINAL_BOSS;
			this.getEnemyParty().forEach(enemyPokemon => enemyPokemon.destroy());
			this.trySpreadPokerus();
			if (!isNewBiome && (newWaveIndex % 10) == 5)
				this.arena.updatePoolsForTimeOfDay();
			if (resetArenaState) {
				this.arena.removeAllTags();
				playerField.forEach((_, p) => this.unshiftPhase(new ReturnPhase(this, p)));
				this.unshiftPhase(new ShowTrainerPhase(this));
			}
			for (let pokemon of this.getParty()) {
				if (pokemon) {
					if (resetArenaState)
						pokemon.resetBattleData();
					this.triggerPokemonFormChange(pokemon, SpeciesFormChangeTimeOfDayTrigger);
				}
			}
			if (this.gameMode === GameMode.CLASSIC && !isNewBiome)
				this.pushPhase(new NextEncounterPhase(this));
			else {
				this.pushPhase(new SelectBiomePhase(this));
				this.pushPhase(new NewBiomeEncounterPhase(this));

				const newMaxExpLevel = this.getMaxExpLevel();
				if (newMaxExpLevel > maxExpLevel)
					this.pushPhase(new LevelCapPhase(this));
			}
		}
		
		return this.currentBattle;
	}

	newArena(biome: Biome, init?: boolean): Arena {
		this.arena = new Arena(this, biome, Biome[biome].toLowerCase());

		if (init) {
			const biomeKey = getBiomeKey(biome);

			this.arenaBg.setTexture(`${biomeKey}_bg`);
			this.arenaBgTransition.setTexture(`${biomeKey}_bg`);
			this.arenaPlayer.setBiome(biome);
			this.arenaPlayerTransition.setBiome(biome);
			this.arenaEnemy.setBiome(biome);
			this.arenaNextEnemy.setBiome(biome);
		}

		return this.arena;
	}

	updateFieldScale(): Promise<void> {
		return new Promise(resolve => {
			const fieldScale = Math.floor(Math.pow(1 / this.getField().filter(p => p?.isActive())
				.map(p => p.getSpriteScale())
				.reduce((highestScale: number, scale: number) => highestScale = Math.max(scale, highestScale), 0), 0.7) * 40
			) / 40;
			this.setFieldScale(fieldScale).then(() => resolve());
		});
	}

	setFieldScale(scale: number, instant: boolean = false): Promise<void> {
		return new Promise(resolve => {
			scale *= 6;
			if (this.field.scale === scale)
				return resolve();

			const defaultWidth = this.arenaBg.width * 6;
			const defaultHeight = this.arenaBg.height * 6;
			const scaledWidth = this.arenaBg.width * scale;
			const scaledHeight = this.arenaBg.height * scale;

			this.tweens.add({
				targets: this.field,
				scale: scale,
				x: (defaultWidth - scaledWidth) / 2,
				y: defaultHeight - scaledHeight,
				duration: !instant ? Utils.fixedInt(Math.abs(this.field.scale - scale) * 200) : 0,
				ease: 'Sine.easeInOut',
				onComplete: () => resolve()
			});
		});
	}

	getSpeciesFormIndex(species: PokemonSpecies, gender?: Gender, nature?: Nature, ignoreArena?: boolean): integer {
		if (!species.forms?.length)
			return 0;

		switch (species.speciesId) {
			case Species.UNOWN:
			case Species.DEERLING:
			case Species.SAWSBUCK:
			case Species.ORICORIO:
			case Species.SQUAWKABILLY:
			case Species.TATSUGIRI:
			case Species.PALDEA_TAUROS:
				return Utils.randSeedInt(species.forms.length);
			case Species.MEOWSTIC:
			case Species.INDEEDEE:
			case Species.OINKOLOGNE:
				return gender === Gender.FEMALE ? 1 : 0;
			case Species.TOXTRICITY:
				const lowkeyNatures = [ Nature.LONELY, Nature.BOLD, Nature.RELAXED, Nature.TIMID, Nature.SERIOUS, Nature.MODEST, Nature.MILD, Nature.QUIET, Nature.BASHFUL, Nature.CALM, Nature.GENTLE, Nature.CAREFUL ];
				if (nature !== undefined && lowkeyNatures.indexOf(nature) > -1)
					return 1;
				return 0;
		}

		if (ignoreArena) {
			switch (species.speciesId) {
				case Species.BURMY:
				case Species.WORMADAM:
				case Species.LYCANROC:
				case Species.CALYREX:
					return Utils.randSeedInt(species.forms.length);
			}
			return 0;
		}

		return this.arena.getSpeciesFormIndex(species);
	}

	getWaveCycleOffset(): integer {
		let ret = 0;
		this.executeWithSeedOffset(() => {
			ret = Utils.randSeedInt(8) * 5;
		}, 0, this.seed.toString());
		return ret;
	}

	getEncounterBossSegments(waveIndex: integer, level: integer, species?: PokemonSpecies, forceBoss: boolean = false): integer {
		let isBoss: boolean;
		if (forceBoss || (species && (species.pseudoLegendary || species.legendary || species.mythical)))
			isBoss = true;
		else {
			this.executeWithSeedOffset(() => {
				isBoss = waveIndex % 10 === 0 || (this.gameMode !== GameMode.CLASSIC && Utils.randSeedInt(100) < Math.min(Math.max(Math.ceil((waveIndex - 250) / 50), 0) * 2, 30));
			}, waveIndex << 2);
		}
		if (!isBoss)
			return 0;

		let ret: integer = 2;

		if (level >= 100)
			ret++;
		if (species) {
			if (species.baseTotal >= 670)
				ret++;
		}
		ret += Math.floor(waveIndex / 250);

		return ret;
	}

	trySpreadPokerus(): void {
		const party = this.getParty();
		const infectedIndexes: integer[] = [];
		party.forEach((pokemon, p) => {
			if (!pokemon.pokerus || infectedIndexes.indexOf(p) > -1)
				return;
			
			this.executeWithSeedOffset(() => {
				if (p) {
					const partyMember = party[p - 1];
					if (!partyMember.pokerus && !Utils.randSeedInt(10)) {
						partyMember.pokerus = true;
						infectedIndexes.push(p - 1);
					}
				}

				if (p < party.length - 1) {
					const partyMember = party[p + 1];
					if (!partyMember.pokerus && !Utils.randSeedInt(10)) {
						partyMember.pokerus = true;
						infectedIndexes.push(p + 1);
					}
				}
			}, this.currentBattle.waveIndex + (p << 8));
		});
	}

	resetSeed(waveIndex?: integer): void {
		this.waveSeed = Utils.shiftCharCodes(this.seed, waveIndex || this.currentBattle?.waveIndex || 0);
		Phaser.Math.RND.sow([ this.waveSeed ]);
	}

	executeWithSeedOffset(func: Function, offset: integer, seedOverride?: string): void {
		if (!func)
			return;
		const state = Phaser.Math.RND.state();
		Phaser.Math.RND.sow([ Utils.shiftCharCodes(seedOverride || this.seed, offset) ]);
		func();
		Phaser.Math.RND.state(state);
	}

	addFieldSprite(x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number): Phaser.GameObjects.Sprite {
		const ret = this.add.sprite(x, y, texture, frame);
		ret.setPipeline(this.fieldSpritePipeline);

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
				ease: 'Sine.easeOut',
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
				ease: 'Cubic.easeIn',
				onComplete: () => resolve()
			});
		});
	}

	updateWaveCountText(): void {
		const isBoss = !(this.currentBattle.waveIndex % 10);
		this.waveCountText.setText(this.currentBattle.waveIndex.toString());
		this.waveCountText.setColor(!isBoss ? '#404040' : '#f89890');
		this.waveCountText.setShadowColor(!isBoss ? '#ded6b5' : '#984038');
		this.waveCountText.setVisible(true);
	}

	updateMoneyText(): void {
		this.moneyText.setText(`₽${this.money.toLocaleString('en-US')}`);
		this.moneyText.setVisible(true);
	}

	updateUIPositions(): void {
		const enemyModifierCount = this.enemyModifiers.filter(m => m.isIconVisible(this)).length;
		this.waveCountText.setY(-(this.game.canvas.height / 6) + (enemyModifierCount ? enemyModifierCount <= 12 ? 15 : 24 : 0));
		this.moneyText.setY(this.waveCountText.y + 10);
		this.partyExpBar.setY(this.moneyText.y + 15);
		this.ui?.achvBar.setY((this.game.canvas.height / 6 + this.moneyText.y + 15));
	}

	getMaxExpLevel(ignoreLevelCap?: boolean): integer {
		if (ignoreLevelCap)
			return 10000;
		const lastWaveIndex = Math.ceil((this.currentBattle?.waveIndex || 1) / 10) * 10;
		const baseLevel = (1 + lastWaveIndex / 2 + Math.pow(lastWaveIndex / 25, 2)) * 1.2;
		return Math.min(Math.ceil(baseLevel / 2) * 2 + 2, 10000);
	}

	randomSpecies(waveIndex: integer, level: integer, fromArenaPool?: boolean, speciesFilter?: PokemonSpeciesFilter, filterAllEvolutions?: boolean): PokemonSpecies {
		if (fromArenaPool)
			return this.arena.randomSpecies(waveIndex, level);
		const filteredSpecies = speciesFilter ? [...new Set(allSpecies.filter(s => s.isCatchable()).filter(speciesFilter).map(s => {
			if (!filterAllEvolutions) {
				while (pokemonPrevolutions.hasOwnProperty(s.speciesId))
					s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
			}
			return s;
		}))] : allSpecies.filter(s => s.isCatchable());
		return filteredSpecies[Utils.randSeedInt(filteredSpecies.length)];
	}

	checkInput(): boolean {
		if (this.blockInput)
			return;
		let inputSuccess = false;
		let vibrationLength = 0;
		if (this.isButtonPressed(Button.UP)) {
			inputSuccess = this.ui.processInput(Button.UP);
			vibrationLength = 5;
		} else if (this.isButtonPressed(Button.DOWN)) {
			inputSuccess = this.ui.processInput(Button.DOWN);
			vibrationLength = 5;
		} else if (this.isButtonPressed(Button.LEFT)) {
			inputSuccess = this.ui.processInput(Button.LEFT);
			vibrationLength = 5;
		} else if (this.isButtonPressed(Button.RIGHT)) {
			inputSuccess = this.ui.processInput(Button.RIGHT);
			vibrationLength = 5;
		} else if (this.isButtonPressed(Button.SUBMIT)) {
			inputSuccess = this.ui.processInput(Button.SUBMIT) || this.ui.processInput(Button.ACTION);
		} else if (this.isButtonPressed(Button.ACTION))
			inputSuccess = this.ui.processInput(Button.ACTION);
		else if (this.isButtonPressed(Button.CANCEL)) {
			inputSuccess = this.ui.processInput(Button.CANCEL);
		} else if (this.isButtonPressed(Button.MENU)) {
			switch (this.ui.getMode()) {
				case Mode.MESSAGE:
					if (!(this.ui.getHandler() as MessageUiHandler).pendingPrompt)
						return;
				case Mode.COMMAND:
				case Mode.FIGHT:
				case Mode.BALL:
				case Mode.TARGET_SELECT:
				case Mode.PARTY:
				case Mode.SUMMARY:
				case Mode.BIOME_SELECT:
				case Mode.STARTER_SELECT:
				case Mode.CONFIRM:
					this.ui.setOverlayMode(Mode.MENU);
					inputSuccess = true;
					break;
				case Mode.MENU:
				case Mode.SETTINGS:
				case Mode.ACHIEVEMENTS:
					this.ui.revertMode();
					this.playSound('select');
					inputSuccess = true;
					break;
				default:
					return;
			}
		} else if (this.ui?.getHandler() instanceof StarterSelectUiHandler) {
			if (this.isButtonPressed(Button.CYCLE_SHINY))
				inputSuccess = this.ui.processInput(Button.CYCLE_SHINY);
			else if (this.isButtonPressed(Button.CYCLE_FORM))
				inputSuccess = this.ui.processInput(Button.CYCLE_FORM);
			else if (this.isButtonPressed(Button.CYCLE_GENDER))
				inputSuccess = this.ui.processInput(Button.CYCLE_GENDER);
			else if (this.isButtonPressed(Button.CYCLE_ABILITY))
				inputSuccess = this.ui.processInput(Button.CYCLE_ABILITY);
			else if (this.isButtonPressed(Button.CYCLE_NATURE))
				inputSuccess = this.ui.processInput(Button.CYCLE_NATURE);
			else
				return;
		}	else if (this.isButtonPressed(Button.SPEED_UP)) {
			if (this.gameSpeed < 5) {
				this.gameData.saveSetting(Setting.Game_Speed, settingOptions[Setting.Game_Speed].indexOf(`${this.gameSpeed}x`) + 1);
				if (this.ui.getMode() === Mode.SETTINGS)
					(this.ui.getHandler() as SettingsUiHandler).show([]);
			}
		} else if (this.isButtonPressed(Button.SLOW_DOWN)) {
			if (this.gameSpeed > 1) {
				this.gameData.saveSetting(Setting.Game_Speed, Math.max(settingOptions[Setting.Game_Speed].indexOf(`${this.gameSpeed}x`) - 1, 0));
				if (this.ui.getMode() === Mode.SETTINGS)
					(this.ui.getHandler() as SettingsUiHandler).show([]);
			}
		} else if (enableAuto) {
			if (this.isButtonPressed(Button.AUTO)) {
				this.auto = !this.auto;
				if (this.auto)
					this.gameSpeed = Math.floor(this.gameSpeed);
				else if (this.gameSpeed > 5)
					this.gameSpeed = 5;
			} else
				return;
		} else
			return;
		if (inputSuccess && this.enableVibration)
			navigator.vibrate(vibrationLength || 10);
		this.blockInput = true;
		this.time.delayedCall(Utils.fixedInt(250), () => this.blockInput = false);
	}

	isButtonPressed(button: Button): boolean {
		return this.buttonKeys[button].filter(k => k.isDown).length >= 1;
	}

	isBgmPlaying(): boolean {
		return this.bgm && this.bgm.isPlaying;
	}

	playBgm(bgmName?: string, fadeOut?: boolean): void {
		if (bgmName === undefined)
			bgmName = this.currentBattle.getBgmOverride(this) || this.arena.bgm;
		if (this.bgm && bgmName === this.bgm.key) {
			if (!this.bgm.isPlaying) {
				this.bgm.play({
					volume: this.masterVolume * this.bgmVolume
				});
			}
			return;
		}
		if (fadeOut && !this.bgm)
			fadeOut = false;
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
			if (this.bgm && !this.bgm.pendingRemove && this.bgm.isPlaying)
				this.bgm.stop();
			this.bgm = this.sound.add(bgmName, { loop: true });
			this.bgm.play({
				volume: this.masterVolume * this.bgmVolume
			});
			if (loopPoint)
				this.bgm.on('looped', () => this.bgm.play({ seek: loopPoint }));
		};
		this.load.once(Phaser.Loader.Events.COMPLETE, () => {
			loaded = true;
			if (!fadeOut || !this.bgm.isPlaying)
				playNewBgm();
		});
		if (fadeOut) {
			const onBgmFaded = () => {
				if (loaded && (!this.bgm.isPlaying || this.bgm.pendingRemove))
					playNewBgm();
			};
			this.time.delayedCall(this.fadeOutBgm(500, true) ? 750 : 250, onBgmFaded);
		}
		if (!this.load.isLoading())
			this.load.start();
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
			for (let sound of this.sound.getAllPlaying())
				(sound as AnySound).setVolume(this.masterVolume * (this.bgmCache.has(sound.key) ? this.bgmVolume : this.seVolume));
		}
	}

	fadeOutBgm(duration?: integer, destroy?: boolean): boolean {
		if (!this.bgm)
			return false;
		if (!duration)
			duration = 500;
		if (destroy === undefined)
      destroy = true;
    const bgm = this.sound.getAllPlaying().find(bgm => bgm.key === this.bgm.key);
		if (bgm) {
			SoundFade.fadeOut(this, this.bgm, duration, destroy);
			return true;
		}

		return false;
	}

	playSound(sound: string | AnySound, config?: object): AnySound {
		if (config) {
			if (config.hasOwnProperty('volume'))
				config['volume'] *= this.masterVolume * this.seVolume;
			else
				config['volume'] = this.masterVolume * this.seVolume;
		} else
			config = { volume: this.masterVolume * this.seVolume };
		if (typeof sound === 'string') {
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
		if (this.bgmResumeTimer)
			this.bgmResumeTimer.destroy();
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
			case 'battle_champion':
				return 27.653;
			case 'battle_cynthia':
				return 12.235;
			case 'battle_elite':
				return 17.730;
			case 'battle_final_encounter':
				return 19.159;
			case 'battle_final':
				return 16.453;
			case 'battle_gym':
				return 19.145;
			case 'battle_legendary':
				return 13.855;
			case 'battle_legendary_k':
				return 18.314;
			case 'battle_legendary_rz':
				return 18.329;
			case 'battle_rival':
				return 13.689;
			case 'battle_rival_2':
				return 17.714;
			case 'battle_rival_3':
				return 17.586;
			case 'battle_trainer':
				return 13.686;
			case 'battle_wild':
				return 12.703;
			case 'battle_wild_strong':
				return 13.940;
			case 'end_summit':
				return 30.025;
		}

		return 0;
	}

	toggleInvert(invert: boolean): void {
		if (invert)
			this.cameras.main.setPostPipeline(InvertPostFX);
		else
			this.cameras.main.removePostPipeline('InvertPostFX');
	}

	getCurrentPhase(): BattlePhase {
		return this.currentPhase;
	}

	getStandbyPhase(): BattlePhase {
		return this.standbyPhase;
	}

	pushPhase(phase: BattlePhase): void {
		this.phaseQueue.push(phase);
	}

	unshiftPhase(phase: BattlePhase): void {
		if (this.phaseQueuePrependSpliceIndex === -1)
			this.phaseQueuePrepend.push(phase);
		else
			this.phaseQueuePrepend.splice(this.phaseQueuePrependSpliceIndex, 0, phase);
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

		if (this.phaseQueuePrependSpliceIndex > -1)
			this.clearPhaseQueueSplice();
		if (this.phaseQueuePrepend.length) {
			while (this.phaseQueuePrepend.length)
				this.phaseQueue.unshift(this.phaseQueuePrepend.pop());
		}
		if (!this.phaseQueue.length)
			this.populatePhaseQueue();
		this.currentPhase = this.phaseQueue.shift();
		this.currentPhase.start();
	}
	
	overridePhase(phase: BattlePhase): boolean {
		if (this.standbyPhase)
			return false;

		this.standbyPhase = this.currentPhase;
		this.currentPhase = phase;
		phase.start();

		return true;
	}

	findPhase(phaseFilter: (phase: BattlePhase) => boolean): BattlePhase {
		return this.phaseQueue.find(phaseFilter);
	}

	queueMessage(message: string, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer, defer?: boolean) {
		const phase = new MessagePhase(this, message, callbackDelay, prompt, promptDelay);
		if (!defer)
			this.unshiftPhase(phase);
		else
			this.pushPhase(phase);
	}

	populatePhaseQueue(): void {
		this.phaseQueue.push(new TurnInitPhase(this));
	}

	getWaveMoneyAmount(moneyMultiplier: number): integer {
		const waveIndex = this.currentBattle.waveIndex;
		const waveSetIndex = Math.ceil(waveIndex / 10) - 1;
		const moneyValue = Math.pow((waveSetIndex + 1 + (0.75 + (((waveIndex - 1) % 10) + 1) / 10)) * 100, 1 + 0.005 * waveSetIndex) * moneyMultiplier;
		return Math.floor(moneyValue / 10) * 10;
	}

	addModifier(modifier: Modifier, ignoreUpdate?: boolean, playSound?: boolean, virtual?: boolean, instant?: boolean): Promise<void> {
		return new Promise(resolve => {
			const soundName = modifier.type.soundName;
			this.validateAchvs(ModifierAchv, modifier);
			const modifiersToRemove: PersistentModifier[] = [];
			if (modifier instanceof PersistentModifier) {
				if (modifier instanceof TerastallizeModifier)
					modifiersToRemove.push(...(this.findModifiers(m => m instanceof TerastallizeModifier && m.pokemonId === modifier.pokemonId)));
				if ((modifier as PersistentModifier).add(this.modifiers, !!virtual, this)) {
					if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier)
						modifier.apply([ this.getPokemonById(modifier.pokemonId), true ]);
					if (playSound && !this.sound.get(soundName))
						this.playSound(soundName);
				} else if (!virtual) {
					const defaultModifierType = getDefaultModifierTypeForTier(modifier.type.tier);
					this.queueMessage(`The stack for this item is full.\n You will receive ${defaultModifierType.name} instead.`, null, true);
					return this.addModifier(defaultModifierType.newModifier(), ignoreUpdate, playSound, false, instant).then(() => resolve());
				}
				
				for (let rm of modifiersToRemove)
					this.removeModifier(rm);

				if (!ignoreUpdate && !virtual)
					return this.updateModifiers(true, instant).then(() => resolve());
			} else if (modifier instanceof ConsumableModifier) {
				if (playSound && !this.sound.get(soundName))
					this.playSound(soundName);

				if (modifier instanceof ConsumablePokemonModifier) {
					for (let p in this.party) {
						const pokemon = this.party[p];

						const args: any[] = [ pokemon ];
						if (modifier instanceof PokemonHpRestoreModifier) {
							if (!(modifier as PokemonHpRestoreModifier).fainted) {
								const hpRestoreMultiplier = new Utils.IntegerHolder(1);
								this.applyModifiers(HealingBoosterModifier, true, hpRestoreMultiplier);
								args.push(hpRestoreMultiplier.value);
							} else
								args.push(1);
						} else if (modifier instanceof FusePokemonModifier)
							args.push(this.getPokemonById(modifier.fusePokemonId) as PlayerPokemon);
							
						if (modifier.shouldApply(args))
							modifier.apply(args);
					}
					
					return Promise.allSettled(this.party.map(p => p.updateInfo(instant))).then(() => resolve());
				} else {
					const args = [ this ];
					if (modifier.shouldApply(args))
						modifier.apply(args);
				}
			}

			resolve();
		});
	}

	addEnemyModifier(modifier: PersistentModifier, ignoreUpdate?: boolean, instant?: boolean): Promise<void> {
		return new Promise(resolve => {
			const modifiersToRemove: PersistentModifier[] = [];
			if (modifier instanceof TerastallizeModifier)
					modifiersToRemove.push(...(this.findModifiers(m => m instanceof TerastallizeModifier && m.pokemonId === modifier.pokemonId, false)));
			if ((modifier as PersistentModifier).add(this.enemyModifiers, false, this)) {
				if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier)
					modifier.apply([ this.getPokemonById(modifier.pokemonId), true ]);
				for (let rm of modifiersToRemove)
					this.removeModifier(rm, true);
			}
			if (!ignoreUpdate)
				this.updateModifiers(false, instant).then(() => resolve());
			else
				resolve();
		});
	}

	tryTransferHeldItemModifier(itemModifier: PokemonHeldItemModifier, target: Pokemon, transferStack: boolean, playSound: boolean, instant?: boolean): Promise<boolean> {
		return new Promise(resolve => {
			const source = itemModifier.getPokemon(target.scene);
			const cancelled = new Utils.BooleanHolder(false);
			applyAbAttrs(BlockItemTheftAbAttr, source, cancelled).then(() => {
				if (cancelled.value)
					return resolve(false);
				const newItemModifier = itemModifier.clone() as PokemonHeldItemModifier;
				newItemModifier.pokemonId = target.id;
				const matchingModifier = target.scene.findModifier(m => m instanceof PokemonHeldItemModifier
					&& (m as PokemonHeldItemModifier).matchType(itemModifier) && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier;
				let removeOld = true;
				if (matchingModifier) {
					const maxStackCount = matchingModifier.getMaxStackCount(source.scene);
					if (matchingModifier.stackCount >= maxStackCount)
						return resolve(false);
					const countTaken = transferStack ? Math.min(itemModifier.stackCount, maxStackCount - matchingModifier.stackCount) : 1;
					itemModifier.stackCount -= countTaken;
					newItemModifier.stackCount = matchingModifier.stackCount + countTaken;
					removeOld = !itemModifier.stackCount;
				} else if (!transferStack) {
					newItemModifier.stackCount = 1;
					removeOld = !(--itemModifier.stackCount);
				}
				if (!removeOld || this.removeModifier(itemModifier, !source.isPlayer())) {
					const addModifier = () => {
						if (!matchingModifier || this.removeModifier(matchingModifier, !target.isPlayer())) {
							if (target.isPlayer())
								this.addModifier(newItemModifier, false, playSound, false, instant).then(() => resolve(true));
							else
								this.addEnemyModifier(newItemModifier, false, instant).then(() => resolve(true));
						} else
							resolve(false);
					};
					if (source.isPlayer() !== target.isPlayer())
						this.updateModifiers(source.isPlayer(), instant).then(() => addModifier());
					else
						addModifier();
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
			for (let m of modifiersToRemove)
				this.modifiers.splice(this.modifiers.indexOf(m), 1);
			this.updateModifiers().then(() => resolve());
		});
	}

	generateEnemyModifiers(): Promise<void> {
		return new Promise(resolve => {
			if (this.currentBattle.battleSpec === BattleSpec.FINAL_BOSS)
				return resolve();
			const waveIndex = this.currentBattle.waveIndex;
			const chances = Math.ceil(waveIndex / 10);
			const isBoss = !(waveIndex % 10) || (this.currentBattle.battleType === BattleType.TRAINER && this.currentBattle.trainer.config.isBoss);
			
			let modifierChance: integer;
			if (this.gameMode === GameMode.CLASSIC)
				modifierChance = !isBoss ? 18 : 6;
			else
				modifierChance = !isBoss ? 12 : 4;

			const party = this.getEnemyParty();

			if (this.currentBattle.trainer) {
				const modifiers = this.currentBattle.trainer.genModifiers(party);
				for (let modifier of modifiers)
					this.addEnemyModifier(modifier, true, true);
			}

			party.forEach((enemyPokemon: EnemyPokemon, i: integer) => {
				let pokemonModifierChance = modifierChance;
				if (this.currentBattle.battleType === BattleType.TRAINER)
					pokemonModifierChance = Math.ceil(pokemonModifierChance * this.currentBattle.trainer.getPartyMemberModifierChanceMultiplier(i));
				let count = 0;
				for (let c = 0; c < chances; c++) {
					if (!Utils.randSeedInt(modifierChance))
						count++;
				}
				if (isBoss)
					count = Math.max(count, Math.floor(chances / 2));
				getEnemyModifierTypesForWave(waveIndex, count, [ enemyPokemon ], this.currentBattle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD, this.gameMode)
					.map(mt => mt.newModifier(enemyPokemon).add(this.enemyModifiers, false, this));
			});

			this.updateModifiers(false).then(() => resolve());
		});
	}

	clearEnemyHeldItemModifiers(): void {
		const modifiersToRemove = this.enemyModifiers.filter(m => m instanceof PokemonHeldItemModifier);
		for (let m of modifiersToRemove)
			this.enemyModifiers.splice(this.enemyModifiers.indexOf(m), 1);
		this.updateModifiers(false).then(() => this.updateUIPositions());
	}

	updateModifiers(player?: boolean, instant?: boolean): Promise<void> {
		if (player === undefined)
			player = true;
		return new Promise(resolve => {
			const modifiers = player ? this.modifiers : this.enemyModifiers as PersistentModifier[];
			for (let m = 0; m < modifiers.length; m++) {
				const modifier = modifiers[m];
				if (modifier instanceof PokemonHeldItemModifier && !this.getPokemonById((modifier as PokemonHeldItemModifier).pokemonId))
					modifiers.splice(m--, 1);
			}
			for (let modifier of modifiers) {
				if (modifier instanceof PersistentModifier)
					(modifier as PersistentModifier).virtualStackCount = 0;
			}

			const modifiersClone = modifiers.slice(0);
			for (let modifier of modifiersClone) {
				if (!modifier.getStackCount())
					modifiers.splice(modifiers.indexOf(modifier), 1);
			}

			this.updatePartyForModifiers(player ? this.getParty() : this.getEnemyParty(), instant).then(() => {
				(player ? this.modifierBar : this.enemyModifierBar).updateModifiers(modifiers);
				if (!player)
					this.updateUIPositions();
				resolve();
			});
		});
	}

	updatePartyForModifiers(party: Pokemon[], instant?: boolean): Promise<void> {
		return new Promise(resolve => {
			Promise.allSettled(party.map(p => {
				if (p.scene)
					p.calculateStats();
				return p.updateInfo(instant);
			})).then(() => resolve());
		});
	}

	removeModifier(modifier: PersistentModifier, enemy?: boolean): boolean {
		const modifiers = !enemy ? this.modifiers : this.enemyModifiers;
		const modifierIndex = modifiers.indexOf(modifier);
		if (modifierIndex > -1) {
			modifiers.splice(modifierIndex, 1);
			if (modifier instanceof PokemonFormChangeItemModifier || modifier instanceof TerastallizeModifier)
				modifier.apply([ this.getPokemonById(modifier.pokemonId), false ]);
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

	applyModifiers(modifierType: { new(...args: any[]): Modifier }, player: boolean = true, ...args: any[]): void {
		const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args))
				console.log('Applied', modifier.type.name, !player ? '(enemy)' : '');
		}
	}

	applyModifier(modifierType: { new(...args: any[]): Modifier }, player: boolean = true, ...args: any[]): PersistentModifier {
		const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args)) {
				console.log('Applied', modifier.type.name, !player ? '(enemy)' : '');
				return modifier;
			}
		}

		return null;
	}

	triggerPokemonFormChange(pokemon: Pokemon, formChangeTriggerType: { new(...args: any[]): SpeciesFormChangeTrigger }, delayed: boolean = false, modal: boolean = false): boolean {
		if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)) {
			const matchingFormChange = pokemonFormChanges[pokemon.species.speciesId].find(fc => fc.findTrigger(formChangeTriggerType) && fc.canChange(pokemon));
			if (matchingFormChange) {
				let phase: BattlePhase;
				if (pokemon instanceof PlayerPokemon && !matchingFormChange.quiet)
					phase = new FormChangePhase(this, pokemon, matchingFormChange, modal);
				else
					phase = new QuietFormChangePhase(this, pokemon, matchingFormChange);
				if (pokemon instanceof PlayerPokemon && !matchingFormChange.quiet && modal)
					this.overridePhase(phase);
				else if (delayed)
					this.pushPhase(phase);
				else
					this.unshiftPhase(phase);
				return true;
			}
		}

		return false;
	}

	validateAchvs(achvType: { new(...args: any[]): Achv }, ...args: any[]): void {
		const filteredAchvs = Object.values(achvs).filter(a => a instanceof achvType);
		for (let achv of filteredAchvs)
			this.validateAchv(achv, args);
	}

	validateAchv(achv: Achv, args?: any[]): boolean {
		if (!this.gameData.achvUnlocks.hasOwnProperty(achv.id) && achv.validate(this, args)) {
			this.gameData.achvUnlocks[achv.id] = new Date().getTime();
			this.ui.achvBar.showAchv(achv);
			if (vouchers.hasOwnProperty(achv.id))
				this.validateVoucher(vouchers[achv.id]);
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
}