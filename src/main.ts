import Phaser from 'phaser';
import BattleScene from './battle-scene';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: 'app',
	scale: {
		width: 1920,
		height: 1080,
		mode: Phaser.Scale.FIT
	},
	pixelArt: true,
	scene: [ BattleScene ]
};

const setPositionRelative = function(guideObject: any, x: number, y: number) {
	if (guideObject && guideObject.hasOwnProperty('width') && guideObject.hasOwnProperty('height')) {
		const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
		const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
		this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
		return;
	}

	this.setPosition(x, y);
};

Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;

document.fonts.load('16px emerald').then(() => document.fonts.load('10px pkmnems'));

const game = new Phaser.Game(config);
game.sound.pauseOnBlur = false;

export default game;