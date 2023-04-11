export function toPokemonUpperCase(input: string): string {
  return input.replace(/([a-z]+)/g, s => s.toUpperCase());
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
  return Math.floor(Math.random() * range) + min;
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

export class NumberHolder {
  public value: number;

  constructor(value: number) {
    this.value = value;
  }
}
export class IntegerHolder {
  public value: integer;

  constructor(value: integer) {
    this.value = value;
  }
}