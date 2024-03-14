export enum GameModes {
  DAILY,
  CLASSIC,
  ENDLESS,
  SPLICED_ENDLESS
}

interface GameModeConfig {
  isClassic?: boolean;
  isEndless?: boolean;
  isDaily?: boolean;
  hasTrainers?: boolean;
  hasFixedBattles?: boolean;
  hasRandomBiomes?: boolean;
  hasRandomBosses?: boolean;
  isSplicedOnly?: boolean;
}

export class GameMode implements GameModeConfig {
  public modeId: GameModes;
  public isClassic: boolean;
  public isEndless: boolean;
  public isDaily: boolean;
  public hasTrainers: boolean;
  public hasFixedBattles: boolean;
  public hasRandomBiomes: boolean;
  public hasRandomBosses: boolean;
  public isSplicedOnly: boolean;

  constructor(modeId: GameModes, config: GameModeConfig) {
    this.modeId = modeId;
    Object.assign(this, config);
  }

  isWaveFinal(waveIndex: integer): boolean {
    switch (this.modeId) {
      case GameModes.DAILY:
        return waveIndex === 50;
      case GameModes.CLASSIC:
        return waveIndex === 200;
      case GameModes.ENDLESS:
      case GameModes.SPLICED_ENDLESS:
        return !(waveIndex % 250);
    }
  }

  getEnemyModifierChance(isBoss: boolean): integer {
    switch (this.modeId) {
      case GameModes.DAILY:
      case GameModes.CLASSIC:
        return !isBoss ? 18 : 6;
      case GameModes.ENDLESS:
      case GameModes.SPLICED_ENDLESS:
        return !isBoss ? 12 : 4;
    }
  }

  getName(): string {
    switch (this.modeId) {
      case GameModes.DAILY:
        return 'Daily Run';
      case GameModes.CLASSIC:
        return 'Classic';
      case GameModes.ENDLESS:
        return 'Endless';
      case GameModes.SPLICED_ENDLESS:
        return 'Endless (Spliced)';
    }
  }
}

export const gameModes = Object.freeze({
  [GameModes.DAILY]: new GameMode(GameModes.DAILY, { isDaily: true, hasTrainers: true }),
  [GameModes.CLASSIC]: new GameMode(GameModes.CLASSIC, { isClassic: true, hasTrainers: true, hasFixedBattles: true }),
  [GameModes.ENDLESS]: new GameMode(GameModes.ENDLESS, { isEndless: true, hasRandomBiomes: true, hasRandomBosses: true }),
  [GameModes.SPLICED_ENDLESS]: new GameMode(GameModes.SPLICED_ENDLESS, { isEndless: true, hasRandomBiomes: true, hasRandomBosses: true, isSplicedOnly: true })
});