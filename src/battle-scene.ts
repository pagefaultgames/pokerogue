import Phaser from 'phaser';
import { ArenaType, Arena } from './arena';
import UI from './ui/ui';
import { BattlePhase, EncounterPhase, SummonPhase, CommandPhase } from './battle-phase';
import { PlayerPokemon, EnemyPokemon } from './pokemon';
import PokemonSpecies, { allSpecies, getPokemonSpecies } from './pokemon-species';
import * as Utils from './utils';
import { Modifier, ModifierBar, ConsumablePokemonModifier, ConsumableModifier, PokemonModifier } from './modifier';
import { PokeballType } from './pokeball';
import { Species } from './species';
import { initAutoPlay } from './auto-play';

export default class BattleScene extends Phaser.Scene {
	private auto: boolean;
	private autoSpeed: integer = 3;

	private phaseQueue: Array<BattlePhase>;
	private phaseQueuePrepend: Array<BattlePhase>;
	private currentPhase: BattlePhase;
	private arena: Arena;
	public field: Phaser.GameObjects.Container;
	public fieldUI: Phaser.GameObjects.Container;
	public arenaBg: Phaser.GameObjects.Image;
	public arenaPlayer: Phaser.GameObjects.Image;
	public arenaEnemy: Phaser.GameObjects.Image;
	public arenaEnemy2: Phaser.GameObjects.Image;
	public trainer: Phaser.GameObjects.Sprite;
	public waveIndex: integer;
	public pokeballCounts = Object.fromEntries(Utils.getEnumValues(PokeballType).map(t => [ t, 0 ]));
	private party: PlayerPokemon[];
	private modifierBar: ModifierBar;
	private modifiers: Modifier[];
	private enemyPokemon: EnemyPokemon;
	public uiContainer: Phaser.GameObjects.Container;
	public ui: UI;

	private bgm: Phaser.Sound.BaseSound;
	
	private upKey: Phaser.Input.Keyboard.Key;
	private downKey: Phaser.Input.Keyboard.Key;
	private leftKey: Phaser.Input.Keyboard.Key;
	private rightKey: Phaser.Input.Keyboard.Key;
	private actionKey: Phaser.Input.Keyboard.Key;
	private cancelKey: Phaser.Input.Keyboard.Key;

	private blockInput: boolean;

	public trainerId: integer = Utils.randInt(65536);
	public secretId: integer = Utils.randInt(65536);

	constructor() {
		super('battle');

		this.phaseQueue = [];
		this.phaseQueuePrepend = [];
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
		this.load.atlas(key, `images/${folder}${filenameRoot}.png`, `images/${folder}/${filenameRoot}.json`)
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
		this.loadImage('bg_command', 'ui');
		this.loadImage('bg_fight', 'ui');
		this.loadAtlas('prompt', 'ui');
		this.loadImage('cursor', 'ui');
		this.loadImage('pbinfo_player', 'ui');
		this.loadImage('pbinfo_enemy', 'ui');
		this.loadImage('overlay_lv', 'ui');
		this.loadAtlas('numbers', 'ui');
		this.loadAtlas('overlay_hp', 'ui');
		this.loadImage('overlay_exp', 'ui');
		this.loadImage('level_up_stats', 'ui');
		this.loadImage('boolean_window', 'ui');

		this.loadImage('party_bg', 'ui');
		this.loadAtlas('party_slot_main', 'ui');
		this.loadAtlas('party_slot', 'ui');
		this.loadImage('party_slot_overlay_lv', 'ui');
		this.loadImage('party_slot_hp_bar', 'ui');
		this.loadAtlas('party_slot_hp_overlay', 'ui');
		this.loadAtlas('party_pb', 'ui');
		this.loadImage('party_message', 'ui');
		this.loadImage('party_message_large', 'ui');
		this.loadAtlas('party_cancel', 'ui');

		// Load arena images
		Utils.getEnumValues(ArenaType).map(at => {
			const atKey = ArenaType[at].toLowerCase();
			this.loadImage(`${atKey}_bg`, 'arenas', `${atKey}_bg.png`);
			this.loadImage(`${atKey}_a`, 'arenas', `${atKey}_a.png`);
			this.loadImage(`${atKey}_b`, 'arenas', `${atKey}_b.png`);
		});

		// Load trainer images
		this.loadImage('trainer_m', 'trainer');
		this.loadAtlas('trainer_m_pb', 'trainer');

		// Load pokemon-related images
		this.loadImage(`pkmn__back__sub`, 'pokemon/back', 'sub.png');
		this.loadImage(`pkmn__sub`, 'pokemon', 'sub.png');
		this.loadAtlas('shiny', 'effects');

		this.loadAtlas('pb', '');
		this.loadAtlas('items', '');

		for (let i = 0; i < 6; i++)
			this.loadAtlas(`pokemon_icons_${i}`, 'ui');

		this.loadSe('select');
		this.loadSe('menu_open');
		this.loadSe('hit');
		this.loadSe('hit_strong');
		this.loadSe('hit_weak');
		this.loadSe('faint');
		this.loadSe('flee');
		this.loadSe('exp');
		this.loadSe('level_up');
		this.loadSe('shiny');
		this.loadSe('restore');
		this.loadSe('error');

		this.loadSe('pb');
		this.loadSe('pb_rel');
		this.loadSe('pb_throw');
		this.loadSe('pb_bounce_1');
		this.loadSe('pb_bounce_2');
		this.loadSe('pb_move');
		this.loadSe('pb_catch');
		this.loadSe('pb_lock');

		this.loadSe('m_bubble');
		this.loadSe('m_bubble3');
		this.loadSe('m_crabhammer');

		this.loadBgm('level_up_fanfare');
	}

	create() {
		this.load.setBaseURL();

		const field = this.add.container(0, 0);
		field.setScale(6);

		this.field = field;

		// Init arena
		const arenas = Utils.getEnumValues(ArenaType).map(at => new Arena(this, at, ArenaType[at].toLowerCase()));
		const arena = arenas[Utils.randInt(11)];

		this.arena = arena;

		this.arenaBg = this.add.image(0, 0, `${ArenaType[arena.arenaType].toLowerCase()}_bg`);
		this.arenaPlayer = this.add.image(340, 20, `${ArenaType[arena.arenaType].toLowerCase()}_a`);
		this.arenaEnemy = this.add.image(-240, 13, `${ArenaType[arena.arenaType].toLowerCase()}_b`);
		this.arenaEnemy2 = this.add.image(-240, 13, `${ArenaType[arena.arenaType].toLowerCase()}_b`);

		[this.arenaBg, this.arenaPlayer, this.arenaEnemy, this.arenaEnemy2].forEach(a => {
			a.setOrigin(0, 0);
			field.add(a);
		});
		//arena.playBgm();

		const fieldUI = this.add.container(0, this.game.canvas.height);
		fieldUI.setScale(6);

		this.fieldUI = fieldUI;

		const uiContainer = this.add.container(0, 0);
		uiContainer.setScale(6);

		this.uiContainer = uiContainer;

		this.modifiers = [];

		this.modifierBar = new ModifierBar(this);
		this.add.existing(this.modifierBar);
		uiContainer.add(this.modifierBar);

		this.waveIndex = 1;

		this.party = [];

		let loadPokemonAssets = [];

		for (let s = 0; s < 3; s++) {
			const playerSpecies = getPokemonSpecies(s === 0 ? Species.TORCHIC : s === 1 ? Species.TREECKO : Species.MUDKIP); //this.randomSpecies();
			const playerPokemon = new PlayerPokemon(this, playerSpecies, 5);
			playerPokemon.setVisible(false);
			loadPokemonAssets.push(playerPokemon.loadAssets());

			this.party.push(playerPokemon);
		}
		
		const enemySpecies = arena.randomSpecies(1);
		console.log(enemySpecies.name);
		const enemyPokemon = new EnemyPokemon(this, enemySpecies, this.getLevelForWave());
		loadPokemonAssets.push(enemyPokemon.loadAssets());

		this.add.existing(enemyPokemon);
		this.enemyPokemon = enemyPokemon;

		field.add(enemyPokemon);
		
		console.log(this.getPlayerPokemon().species.name, this.getPlayerPokemon().species.speciesId, this.getPlayerPokemon().stats);
		console.log(enemyPokemon.species.name, enemyPokemon.species.speciesId, enemyPokemon.stats);

		const trainerPbFrameNames = this.anims.generateFrameNames('trainer_m_pb', { zeroPad: 2, start: 1, end: 12 });
		this.anims.create({
			key: 'trainer_m_pb',
			frames: trainerPbFrameNames,
			frameRate: 16
		});

		const trainer = this.add.sprite(406, 132, 'trainer_m');
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

		const ui = new UI(this);
		this.uiContainer.add(ui);

		this.ui = ui;

		ui.setup();

		this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
		this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
		this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
		this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
		this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
		this.cancelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

		Promise.all(loadPokemonAssets).then(() => {
			if (this.auto)
				initAutoPlay.apply(this, [ this.autoSpeed ]);

			this.phaseQueue.push(new EncounterPhase(this), new SummonPhase(this));

			this.shiftPhase();
		});
		this.load.start();
	}

	update() {
		this.checkInput();
	}

	getParty(): PlayerPokemon[] {
		return this.party;
	}

	getPlayerPokemon(): PlayerPokemon {
		return this.getParty()[0];
	}

	getEnemyPokemon(): EnemyPokemon {
		return this.enemyPokemon;
	}

	setEnemyPokemon(enemyPokemon: EnemyPokemon) {
		this.enemyPokemon = enemyPokemon;
	}

	randomSpecies(fromArenaPool?: boolean): PokemonSpecies {
		return fromArenaPool
			? this.arena.randomSpecies(1)
			: allSpecies[(Utils.randInt(allSpecies.length)) - 1];
	}

	getLevelForWave() {
		let averageLevel = 1 + this.waveIndex * 0.25;

		if (this.waveIndex % 10 === 0)
			return Math.floor(averageLevel * 1.25);

		const deviation = 10 / this.waveIndex;

		return Math.max(Math.round(averageLevel + Utils.randGauss(deviation)), 1);
	}

	checkInput(): boolean {
		if (this.blockInput)
			return;
		if (this.upKey.isDown)
			this.ui.processInput(this.upKey.keyCode);
		else if (this.downKey.isDown)
			this.ui.processInput(this.downKey.keyCode);
		else if (this.leftKey.isDown)
			this.ui.processInput(this.leftKey.keyCode);
		else if (this.rightKey.isDown)
			this.ui.processInput(this.rightKey.keyCode);
		else if (this.actionKey.isDown)
			this.ui.processInput(this.actionKey.keyCode);
		else if (this.cancelKey.isDown)
			this.ui.processInput(this.cancelKey.keyCode);
		else
			return;
		this.blockInput = true;
		this.time.delayedCall(250, () => {
			this.blockInput = false;
		});
	}

	playBgm(bgmName: string): void {
		if (this.bgm) {
			this.bgm.stop();
			this.bgm.destroy();
		}
		this.bgm = this.sound.add(bgmName, { loop: true });
		this.bgm.play();
	}

	pauseBgm(): void {
		if (this.bgm)
			this.bgm.pause();
	}

	resumeBgm(): void {
		if (this.bgm && this.bgm.isPaused)
			this.bgm.resume();
	}

	getCurrentPhase(): BattlePhase {
		return this.currentPhase;
	}

	pushPhase(phase: BattlePhase): void {
		this.phaseQueue.push(phase);
	}

	unshiftPhase(phase: BattlePhase): void {
		this.phaseQueuePrepend.push(phase);
	}

	clearPhaseQueue(): void {
		this.phaseQueue.splice(0, this.phaseQueue.length);
	}

	shiftPhase(): void {
		if (this.phaseQueuePrepend.length) {
			while (this.phaseQueuePrepend.length)
				this.phaseQueue.unshift(this.phaseQueuePrepend.pop());
		}
		if (!this.phaseQueue.length)
			this.populatePhaseQueue();
		this.currentPhase = this.phaseQueue.shift();
		this.currentPhase.start();
	}

	populatePhaseQueue(): void {
		this.phaseQueue.push(new CommandPhase(this));
	}

	addModifier(modifier: Modifier): void {
		if (modifier.add(this.modifierBar, this.modifiers))
			this.sound.play('restore');

		if (modifier instanceof ConsumableModifier) {
			const args = [ this ];
			if (modifier.shouldApply(args))
				modifier.apply(args);
			return;
		}

		if (modifier instanceof PokemonModifier) {
			for (let p in this.party) {
				const pokemon = this.party[p];

				if (modifier instanceof ConsumablePokemonModifier) {
					const args = [ pokemon ];
					if (modifier.shouldApply(args))
						modifier.apply(args);
				}

				pokemon.calculateStats();
				pokemon.updateInfo();
			}
		}
	}

	applyModifiers(modifierType: { new(...args: any[]): Modifier }, ...args: any[]): void {
		const modifiers = this.modifiers.filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args))
				console.log('Applied', modifier.type.name);
		}
	}
}