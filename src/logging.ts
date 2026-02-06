function ai(...args: any[]): void {
  if (import.meta.env.VITE_LOG_AI === "1") {
    console.log(...args);
  }
}

function api(...args: any[]): void {
  if (import.meta.env.VITE_LOG_API === "1") {
    console.log(...args);
  }
}

/** Damage, move use, etc */
function battle(...args: any[]): void {
  if (import.meta.env.VITE_LOG_BATTLE === "1") {
    console.log(...args);
  }
}

/** When starting a new battle */
function encounter(...args: any[]): void {
  if (import.meta.env.VITE_LOG_ENCOUNTER === "1") {
    console.log(...args);
  }
}

function item(...args: any[]): void {
  if (import.meta.env.VITE_LOG_ITEM === "1") {
    console.log(...args);
  }
}

function mysteryEncounter(...args: any[]): void {
  if (import.meta.env.VITE_LOG_MYSTERY_ENCOUNTER === "1") {
    console.log(...args);
  }
}

function phase(...args: any[]): void {
  if (import.meta.env.VITE_LOG_PHASE === "1") {
    console.log(...args);
  }
}

function trainer(...args: any[]): void {
  if (import.meta.env.VITE_LOG_TRAINER === "1") {
    console.log(...args);
  }
}

export const Log = Object.freeze({ ai, api, battle, encounter, item, mysteryEncounter, phase, trainer });
