export function toReadableString(str: string): string {
  return str.replace(/\_/g, ' ').split(' ').map(s => `${s.slice(0, 1)}${s.slice(1).toLowerCase()}`).join(' ');
}

export function randomString(length: integer) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  
  return result;
}

export function shiftCharCodes(str: string, shiftCount: integer) {
  if (!shiftCount)
    shiftCount = 0;
  
  let newStr = '';

  for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);
      let newCharCode = charCode + shiftCount;
      newStr += String.fromCharCode(newCharCode);
  }

  return newStr;
}

export function clampInt(value: integer, min: integer, max: integer): integer {
  return Math.min(Math.max(value, min), max);
}

export function randGauss(value: number): number { 
  let rand = 0;
  for(var i = value; i > 0; i--)
      rand += Math.random();
  return rand / value;
}

export function randSeedGauss(value: number): number { 
  let rand = 0;
  for(var i = value; i > 0; i--)
      rand += Phaser.Math.RND.realInRange(0, 1);
  return rand / value;
}

export function padInt(value: integer, length: integer, padWith?: string): string {
  if (!padWith)
    padWith = '0';
  let valueStr = value.toString();
  while (valueStr.length < length)
    valueStr = `${padWith}${valueStr}`;
  return valueStr;
}

export function randInt(range: integer, min?: integer): integer {
  if (!min)
    min = 0;
  if (range === 1)
    return min;
  return Math.floor(Math.random() * range) + min;
}

export function randSeedInt(range: integer, min?: integer): integer {
  if (!min)
    min = 0;
  if (range === 1)
    return min;
  return Phaser.Math.RND.integerInRange(min, (range - 1) + min);
}

export function randIntRange(min: integer, max: integer): integer {
  return randInt(max - min, min);
}

export function getFrameMs(frameCount: integer): integer {
  return Math.floor((1 / 60) * 1000 * frameCount);
}

export function binToDec(input: string): integer {
  let place:integer[] = []; 
  let binary:string[] = [];
  
  let decimalNum = 0;
  
  for (let i = 0; i < input.length; i++) {
    binary.push(input[i]);
    place.push(Math.pow(2, i));
    decimalNum += place[i] * parseInt(binary[i]);
  }

  return decimalNum;
}

export function decToBin(input: integer): string {
  let bin = '';
  let intNum = input;
  while (intNum > 0) {
    bin = intNum % 2 ? `1${bin}` : `0${bin}`;
    intNum = Math.floor(intNum * 0.5);
  }

  return bin;
}

export function getEnumKeys(enumType): string[] {
  return Object.values(enumType).filter(v => isNaN(parseInt(v.toString()))).map(v => v.toString());
}

export function getEnumValues(enumType): integer[] {
  return Object.values(enumType).filter(v => !isNaN(parseInt(v.toString()))).map(v => parseInt(v.toString()));
}

export function executeIf<T>(condition: boolean, promiseFunc: () => Promise<T>): Promise<T> {
  return condition ? promiseFunc() : new Promise<T>(resolve => resolve(null));
}

export class BooleanHolder {
  public value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }
}

export class NumberHolder {
  public value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export class IntegerHolder extends NumberHolder {
  constructor(value: integer) {
    super(value);
  }
}

export class FixedInt extends IntegerHolder {
  constructor(value: integer) {
    super(value);
  }
}

export function fixedInt(value: integer): integer {
  return new FixedInt(value) as unknown as integer;
}