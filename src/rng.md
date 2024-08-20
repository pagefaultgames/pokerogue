`src/field/pokemon.ts -> Pokemon`
```ts
  // This calls either `BattleScene:randBattleSeedInt()` in `src/battle-scene.ts` which calls `Battle:randSeedInt()` in `src/battle.ts` which calls `randSeedInt()` in `src/utils.ts`
  // or it directly calls `randSeedInt()` in `src/utils.ts`
  randSeedInt(range: integer, min: integer = 0): integer {
    return this.scene.currentBattle
      ? this.scene.randBattleSeedInt(range, min)
      : Utils.randSeedInt(range, min);
  }
```

`src/battle-scene.ts -> BattleScene`
```ts
  // This calls `Battle:randSeedInt()` in `src/battle.ts` which calls `randSeedInt()` in `src/utils.ts`
  randBattleSeedInt(range: integer, min: integer = 0): integer {
    return this.currentBattle?.randSeedInt(this, range, min);
  }
```

`src/battle.ts -> Battle`
```ts
  // This calls `randSeedInt()` in `src/utils.ts`
  randSeedInt(scene: BattleScene, range: integer, min: integer = 0): integer {
    if (range <= 1) {
      return min;
    }
    const tempRngCounter = scene.rngCounter;
    const tempSeedOverride = scene.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    if (this.battleSeedState) {
      Phaser.Math.RND.state(this.battleSeedState);
    } else {
      Phaser.Math.RND.sow([ Utils.shiftCharCodes(this.battleSeed, this.turn << 6) ]);
      console.log("Battle Seed:", this.battleSeed);
    }
    scene.rngCounter = this.rngCounter++;
    scene.rngSeedOverride = this.battleSeed;
    const ret = Utils.randSeedInt(range, min);
    this.battleSeedState = Phaser.Math.RND.state();
    Phaser.Math.RND.state(state);
    scene.rngCounter = tempRngCounter;
    scene.rngSeedOverride = tempSeedOverride;
    return ret;
  }
```

`src/utils.ts`
```ts
// This is the eventual endpoint of every other RSI function
export function randSeedInt(range: integer, min: integer = 0): integer {
  if (range <= 1) {
    return min;
  }
  return Phaser.Math.RND.integerInRange(min, (range - 1) + min);
}
```
