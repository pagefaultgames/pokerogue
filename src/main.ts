import Phaser from 'phaser';
import BattleScene from './battle-scene';
import InvertPostFX from './pipelines/invert';
import { version } from '../package.json';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin';
import InputTextPlugin from 'phaser3-rex-plugins/plugins/inputtext-plugin.js';
import BBCodeText from 'phaser3-rex-plugins/plugins/bbcodetext';
import TransitionImagePackPlugin from 'phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin.js';
import { LoadingScene } from './loading-scene';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	parent: 'app',
	scale: {
		width: 1920,
		height: 1080,
		mode: Phaser.Scale.FIT
	},
	plugins: {
		global: [{
			key: 'rexInputTextPlugin',
			plugin: InputTextPlugin,
			start: true
		}, {
			key: 'rexBBCodeTextPlugin',
			plugin: BBCodeTextPlugin,
			start: true
		}, {
			key: 'rexTransitionImagePackPlugin',
			plugin: TransitionImagePackPlugin,
			start: true
		}],
		scene: [{
			key: 'rexUI',
			plugin: UIPlugin,
			mapping: 'rexUI'
		}]
	},
	input: {
		mouse: {
			target: 'app'
		},
		touch: {
			target: 'app'
		},
		gamepad: true
	},
	dom: {
		createContainer: true
	},
	pixelArt: true,
	pipeline: [ InvertPostFX ] as unknown as Phaser.Types.Core.PipelineConfig,
	scene: [ LoadingScene, BattleScene ],
	version: version
};

const setPositionRelative = function (guideObject: any, x: number, y: number) {
	if (guideObject && guideObject instanceof Phaser.GameObjects.GameObject) {
		const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
		const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
		this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
		return;
	}

	this.setPosition(x, y);
};

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
BBCodeText.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

document.fonts.load('16px emerald').then(() => document.fonts.load('10px pkmnems'));

let game;

const startGame = () => {
	game = new Phaser.Game(config);
	game.sound.pauseOnBlur = false;
};

fetch('/manifest.json')
	.then(res => res.json())
	.then(jsonResponse => {
		startGame();
		game['manifest'] = jsonResponse.manifest;
	}).catch(() => {
		// Manifest not found (likely local build)
		startGame();
	});

export default game;
