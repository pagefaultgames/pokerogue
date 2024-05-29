import {beforeAll, describe, expect, it} from "vitest";
import _masterlist from "../../public/images/pokemon/variant/_masterlist.json";
import fs from "fs";
import path from "path";
import {getAppRootDir} from "#app/test/testUtils";

const deepCopy = (data) => {
  return JSON.parse(JSON.stringify(data));
};


describe("check if every variant's sprite are correctly set", () => {
  let masterlist;
  let expVariant;
  let femaleVariant;
  let backVariant;
  let rootDir;

  beforeAll(() => {
    rootDir = `${getAppRootDir()}${path.sep}public${path.sep}images${path.sep}pokemon${path.sep}variant${path.sep}`;
    masterlist = deepCopy(_masterlist);
    expVariant = masterlist.exp;
    femaleVariant = masterlist.female;
    backVariant = masterlist.back;
    delete masterlist.exp;
    delete masterlist.female;
    delete masterlist.back;
  });

  it("data should not be undefined", () => {
    expect(masterlist).not.toBeUndefined();
    expect(expVariant).not.toBeUndefined();
    expect(femaleVariant).not.toBeUndefined();
    expect(backVariant).not.toBeUndefined();
  });

  function getMissingMasterlist(mlist, dirpath, excludes = []) {
    const errors = [];
    const trimmedDirpath = `variant${path.sep}${dirpath.split(rootDir)[1]}`;
    if (fs.existsSync(dirpath)) {
      const files = fs.readdirSync(dirpath);
      for (const filename of files) {
        const filePath = `${dirpath}${filename}`;
        const trimmedFilePath = `${trimmedDirpath}${filename}`;
        const ext = filename.split(".")[1];
        const name = filename.split(".")[0];
        if (excludes.includes(name)) {
          continue;
        }
        if (name.includes("_")) {
          const id = name.split("_")[0];
          const variant = name.split("_")[1];
          const index = parseInt(variant, 10) - 1;
          if (ext !== "json") {
            const urlJsonFile = `${dirpath}${id}.json`;
            if (mlist.hasOwnProperty(id)) {
              const trimmedUrlJsonFilepath = `${trimmedDirpath}${id}.json`;
              const jsonFileExists = fs.existsSync(urlJsonFile);
              if (mlist[id].includes(1) && !jsonFileExists) {
                const msg = `[${name}] MISSING JSON ${trimmedUrlJsonFilepath}`;
                if (!errors.includes(msg)) {
                  errors.push(msg);
                }
              }
              if (!mlist.hasOwnProperty(id) && jsonFileExists) {
                errors.push(`[${id}] missing key ${id} in masterlist for ${trimmedFilePath}`);
              }
              if (mlist[id][index] === 1 && jsonFileExists) {
                const raw = fs.readFileSync(urlJsonFile, {encoding: "utf8", flag: "r"});
                const data = JSON.parse(raw);
                const keys = Object.keys(data);
                if (!keys.includes(`${index}`)) {
                  const urlSpriteJsonFile = `${dirpath}${id}_${variant}.json`;
                  const trimmedUrlSpriteFilepath = `${trimmedDirpath}${id}_${variant}.json`;
                  const spriteFileExists = fs.existsSync(urlSpriteJsonFile);
                  if (spriteFileExists) {
                    errors.push(`[${id}] [${mlist[id]}] - the value should be 2 for the index ${index} - ${trimmedUrlSpriteFilepath}`);
                  }
                }
              }
            }
          }
        } else if (!mlist.hasOwnProperty(name)) {
          errors.push(`[${name}] - missing key ${name} in masterlist for ${trimmedFilePath}`);
        } else {
          const raw = fs.readFileSync(filePath, {encoding: "utf8", flag: "r"});
          const data = JSON.parse(raw);
          for (const key of Object.keys(data)) {
            if (mlist[name][key] !== 1) {
              // if 2, check if json there
              const urlSpriteJsonFile = `${dirpath}${name}_${parseInt(key, 10) + 1}.json`;
              const spriteFileExists = fs.existsSync(urlSpriteJsonFile);
              if (!spriteFileExists) {
                errors.push(`[${name}] [${mlist[name]}] - the value should be 1 for the index ${key} - ${trimmedFilePath}`);
              }
            }
          }
        }
      }
    }
    return errors;
  }

  function getMissingFiles(keys, dirPath) {
    const errors = [];
    for (const key of Object.keys(keys)) {
      const row = keys[key];
      for (const [index, elm] of row.entries()) {
        let url;
        if (elm === 0) {
          continue;
        } else if (elm === 1) {
          url = `${key}.json`;
          const filePath = `${dirPath}${url}`;
          const raw = fs.readFileSync(filePath, {encoding: "utf8", flag: "r"});
          const data = JSON.parse(raw);
          if (!data.hasOwnProperty(index)) {
            errors.push(`index: ${index} - ${filePath}`);
          }
        } else if (elm === 2) {
          url = `${key}_${parseInt(index, 10) + 1}.png`;
          let filePath = `${dirPath}${url}`;
          if (!fs.existsSync(filePath)) {
            errors.push(filePath);
          }

          url = `${key}_${parseInt(index, 10) + 1}.json`;
          filePath = `${dirPath}${url}`;
          if (!fs.existsSync(filePath)) {
            errors.push(filePath);
          }
        }
      }
    }
    return errors;
  }

  // chech presence of every files listed in masterlist

  it("check root variant files", () => {
    const dirPath = rootDir;
    const errors = getMissingFiles(masterlist, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check female variant files", () => {
    const dirPath = `${rootDir}female${path.sep}`;
    const errors = getMissingFiles(femaleVariant, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check back female variant files", () => {
    const dirPath = `${rootDir}back${path.sep}female${path.sep}`;
    const errors = getMissingFiles(backVariant.female, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check back male back variant files", () => {
    const dirPath = `${rootDir}back${path.sep}`;
    const backMaleVariant = deepCopy(backVariant);
    delete backMaleVariant.female;
    const errors = getMissingFiles(backMaleVariant, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check exp back variant files", () => {
    const dirPath = `${rootDir}exp${path.sep}back${path.sep}`;
    const errors = getMissingFiles(expVariant.back, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check exp female variant files", () => {
    const dirPath = `${rootDir}exp${path.sep}female${path.sep}`;
    const errors = getMissingFiles(expVariant.female, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  it("check exp male variant files", () => {
    const dirPath = `${rootDir}exp${path.sep}`;
    const expMaleVariant = deepCopy(expVariant);
    delete expMaleVariant.female;
    delete expMaleVariant.back;
    const errors = getMissingFiles(expMaleVariant, dirPath);
    if (errors.length) {
      console.log("errors", errors);
    }
    expect(errors.length).toBe(0);
  });

  // check over every file if it's correctly set in the masterlist

  it("look over every file in variant female and check if present in masterlist", () => {
    const dirPath = `${rootDir}female${path.sep}`;
    const errors = getMissingMasterlist(femaleVariant, dirPath);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant back female and check if present in masterlist", () => {
    const dirPath = `${rootDir}back${path.sep}female${path.sep}`;
    const errors = getMissingMasterlist(backVariant.female, dirPath);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant back male and check if present in masterlist", () => {
    const dirPath = `${rootDir}back${path.sep}`;
    const backMaleVariant = deepCopy(backVariant);
    const errors = getMissingMasterlist(backMaleVariant, dirPath, ["female"]);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant exp back and check if present in masterlist", () => {
    const dirPath = `${rootDir}exp${path.sep}back${path.sep}`;
    const errors = getMissingMasterlist(expVariant.back, dirPath);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant exp female and check if present in masterlist", () => {
    const dirPath = `${rootDir}exp${path.sep}female${path.sep}`;
    const errors = getMissingMasterlist(expVariant.female, dirPath);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant exp male and check if present in masterlist", () => {
    const dirPath = `${rootDir}exp${path.sep}`;
    const errors = getMissingMasterlist(expVariant, dirPath, ["back", "female"]);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });

  it("look over every file in variant root and check if present in masterlist", () => {
    const dirPath = `${rootDir}`;
    const errors = getMissingMasterlist(masterlist, dirPath, ["back", "female", "exp", "icons"]);
    if (errors.length) {
      console.log("errors for ", dirPath, errors);
    }
    expect(errors.length).toBe(0);
  });
});
