import i18next from "i18next";
import * as Utils from "./utils";

/**
 * All logs.
 * 
 * Format: [filename, localStorage key, name, header]
 */
export const logs: string[][] = [
  ["instructions.txt", "path_log", "Steps", "Run Steps", "wide_lens"],
  ["encounters.csv", "enc_log", "Encounters", "Encounter Data"],
  ["log.txt", "debug_log", "Debug", "Debug Log"],
]
export var logKeys: string[] = [
  "i", // Instructions/steps
  "e", // Encounters
  "d", // Debug
];

export const byteSize = str => new Blob([str]).size
const filesizes = ["b", "kb", "mb", "gb", "tb"]
export function getSize(str: string) {
  var d = byteSize(str)
  var unit = 0
  while (d > 1000 && unit < filesizes.length - 1) {
    d = Math.round(d/100)/10
    unit++
  }
  return d.toString() + filesizes[unit]
}

/**
 * Writes data to a new line.
 * @param keyword The identifier key for the log you're writing to
 * @param data The string you're writing to the given log
 */
export function toLog(keyword: string, data: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], localStorage.getItem(logs[logKeys.indexOf(keyword)][1] + "\n" + data))
}
/**
 * Writes data on the same line you were on.
 * @param keyword The identifier key for the log you're writing to
 * @param data The string you're writing to the given log
 */
export function appendLog(keyword: string, data: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], localStorage.getItem(logs[logKeys.indexOf(keyword)][1] + data))
}
/**
 * 
 * Clears all data from a log.
 * @param keyword The identifier key for the log you want to reste
 */
export function clearLog(keyword: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], "---- " + logs[logKeys.indexOf(keyword)][3] + " ----")
}
/**
 * Saves a log to your device.
 * @param keyword The identifier key for the log you want to reste
 */
export function downloadLog(keyword: string) {
  var d = localStorage.getItem(logs[logKeys.indexOf(keyword)][1])
  // logs[logKeys.indexOf(keyword)][1]
  const blob = new Blob([ d ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${logs[logKeys.indexOf(keyword)][0]}`;
  link.click();
  link.remove();
}