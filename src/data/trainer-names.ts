import { TrainerType } from "#enums/trainer-type";
import { toReadableString } from "#app/utils/common";

class TrainerNameConfig {
  public urls: string[];
  public femaleUrls: string[] | null;

  constructor(type: TrainerType, ...urls: string[]) {
    this.urls = urls.length ? urls : [toReadableString(TrainerType[type]).replace(/ /g, "_")];
  }

  hasGenderVariant(...femaleUrls: string[]): TrainerNameConfig {
    this.femaleUrls = femaleUrls.length ? femaleUrls : null;
    return this;
  }
}

interface TrainerNameConfigs {
  [key: number]: TrainerNameConfig;
}

// used in a commented code
// biome-ignore lint/correctness/noUnusedVariables: Used by commented code
const trainerNameConfigs: TrainerNameConfigs = {
  [TrainerType.ACE_TRAINER]: new TrainerNameConfig(TrainerType.ACE_TRAINER),
  [TrainerType.ARTIST]: new TrainerNameConfig(TrainerType.ARTIST),
  [TrainerType.BACKERS]: new TrainerNameConfig(TrainerType.BACKERS),
  [TrainerType.BACKPACKER]: new TrainerNameConfig(TrainerType.BACKPACKER),
  [TrainerType.BAKER]: new TrainerNameConfig(TrainerType.BAKER),
  [TrainerType.BEAUTY]: new TrainerNameConfig(TrainerType.BEAUTY),
  [TrainerType.BIKER]: new TrainerNameConfig(TrainerType.BIKER),
  [TrainerType.BLACK_BELT]: new TrainerNameConfig(TrainerType.BLACK_BELT).hasGenderVariant("Battle_Girl"),
  [TrainerType.BREEDER]: new TrainerNameConfig(TrainerType.BREEDER, "Pokémon_Breeder"),
  [TrainerType.CLERK]: new TrainerNameConfig(TrainerType.CLERK),
  [TrainerType.CYCLIST]: new TrainerNameConfig(TrainerType.CYCLIST),
  [TrainerType.DANCER]: new TrainerNameConfig(TrainerType.DANCER),
  [TrainerType.DEPOT_AGENT]: new TrainerNameConfig(TrainerType.DEPOT_AGENT),
  [TrainerType.DOCTOR]: new TrainerNameConfig(TrainerType.DOCTOR).hasGenderVariant("Nurse"),
  [TrainerType.FIREBREATHER]: new TrainerNameConfig(TrainerType.FIREBREATHER),
  [TrainerType.FISHERMAN]: new TrainerNameConfig(TrainerType.FISHERMAN),
  [TrainerType.GUITARIST]: new TrainerNameConfig(TrainerType.GUITARIST),
  [TrainerType.HARLEQUIN]: new TrainerNameConfig(TrainerType.HARLEQUIN),
  [TrainerType.HIKER]: new TrainerNameConfig(TrainerType.HIKER),
  [TrainerType.HOOLIGANS]: new TrainerNameConfig(TrainerType.HOOLIGANS),
  [TrainerType.HOOPSTER]: new TrainerNameConfig(TrainerType.HOOPSTER),
  [TrainerType.INFIELDER]: new TrainerNameConfig(TrainerType.INFIELDER),
  [TrainerType.JANITOR]: new TrainerNameConfig(TrainerType.JANITOR),
  [TrainerType.LINEBACKER]: new TrainerNameConfig(TrainerType.LINEBACKER),
  [TrainerType.MAID]: new TrainerNameConfig(TrainerType.MAID),
  [TrainerType.MUSICIAN]: new TrainerNameConfig(TrainerType.MUSICIAN),
  [TrainerType.HEX_MANIAC]: new TrainerNameConfig(TrainerType.HEX_MANIAC),
  [TrainerType.NURSERY_AIDE]: new TrainerNameConfig(TrainerType.NURSERY_AIDE),
  [TrainerType.OFFICER]: new TrainerNameConfig(TrainerType.OFFICER),
  [TrainerType.PARASOL_LADY]: new TrainerNameConfig(TrainerType.PARASOL_LADY),
  [TrainerType.PILOT]: new TrainerNameConfig(TrainerType.PILOT),
  [TrainerType.POKEFAN]: new TrainerNameConfig(TrainerType.POKEFAN, "Poké_Fan"),
  [TrainerType.PRESCHOOLER]: new TrainerNameConfig(TrainerType.PRESCHOOLER),
  [TrainerType.PSYCHIC]: new TrainerNameConfig(TrainerType.PSYCHIC),
  [TrainerType.RANGER]: new TrainerNameConfig(TrainerType.RANGER),
  [TrainerType.RICH]: new TrainerNameConfig(TrainerType.RICH, "Gentleman").hasGenderVariant("Madame"),
  [TrainerType.RICH_KID]: new TrainerNameConfig(TrainerType.RICH_KID, "Rich_Boy").hasGenderVariant("Lady"),
  [TrainerType.ROUGHNECK]: new TrainerNameConfig(TrainerType.ROUGHNECK),
  [TrainerType.SAILOR]: new TrainerNameConfig(TrainerType.SAILOR),
  [TrainerType.SCIENTIST]: new TrainerNameConfig(TrainerType.SCIENTIST),
  [TrainerType.SMASHER]: new TrainerNameConfig(TrainerType.SMASHER),
  [TrainerType.SNOW_WORKER]: new TrainerNameConfig(TrainerType.SNOW_WORKER, "Worker"),
  [TrainerType.STRIKER]: new TrainerNameConfig(TrainerType.STRIKER),
  [TrainerType.SCHOOL_KID]: new TrainerNameConfig(TrainerType.SCHOOL_KID, "School_Kid"),
  [TrainerType.SWIMMER]: new TrainerNameConfig(TrainerType.SWIMMER),
  [TrainerType.TWINS]: new TrainerNameConfig(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerNameConfig(TrainerType.VETERAN),
  [TrainerType.WAITER]: new TrainerNameConfig(TrainerType.WAITER).hasGenderVariant("Waitress"),
  [TrainerType.WORKER]: new TrainerNameConfig(TrainerType.WORKER),
  [TrainerType.YOUNGSTER]: new TrainerNameConfig(TrainerType.YOUNGSTER).hasGenderVariant("Lass"),
};

// function used in a commented code
// biome-ignore lint/correctness/noUnusedVariables: TODO make this into a script instead of having it be in src/data...
function fetchAndPopulateTrainerNames(
  url: string,
  parser: DOMParser,
  trainerNames: Set<string>,
  femaleTrainerNames: Set<string>,
  forceFemale = false,
) {
  return new Promise<void>(resolve => {
    fetch(`https://bulbapedia.bulbagarden.net/wiki/${url}_(Trainer_class)`)
      .then(response => response.text())
      .then(html => {
        console.log(url);
        const htmlDoc = parser.parseFromString(html, "text/html");
        const trainerListHeader = htmlDoc.querySelector("#Trainer_list")?.parentElement;
        if (!trainerListHeader) {
          return [];
        }
        const elements = [...(trainerListHeader?.parentElement?.childNodes ?? [])];
        const startChildIndex = elements.indexOf(trainerListHeader);
        const endChildIndex = elements.findIndex(h => h.nodeName === "H2" && elements.indexOf(h) > startChildIndex);
        const tables = elements
          .filter(t => {
            if (t.nodeName !== "TABLE" || t["className"] !== "expandable") {
              return false;
            }
            const childIndex = elements.indexOf(t);
            return childIndex > startChildIndex && childIndex < endChildIndex;
          })
          .map(t => t as Element);
        console.log(url, tables);
        for (const table of tables) {
          const trainerRows = [...table.querySelectorAll("tr:not(:first-child)")].filter(r => r.children.length === 9);
          for (const row of trainerRows) {
            const nameCell = row.firstElementChild;
            if (!nameCell) {
              continue;
            }
            const content = nameCell.innerHTML;
            if (content.indexOf(" <a ") > -1) {
              const female = /♀/.test(content);
              if (url === "Twins") {
                console.log(content);
              }
              const nameMatch = />([a-z]+(?: &amp; [a-z]+)?)<\/a>/i.exec(content);
              if (nameMatch) {
                (female || forceFemale ? femaleTrainerNames : trainerNames).add(nameMatch[1].replace("&amp;", "&"));
              }
            }
          }
        }
        resolve();
      });
  });
}

/*export function scrapeTrainerNames() {
  const parser = new DOMParser();
  const trainerTypeNames = {};
  const populateTrainerNamePromises: Promise<void>[] = [];
  for (let t of Object.keys(trainerNameConfigs)) {
    populateTrainerNamePromises.push(new Promise<void>(resolve => {
      const trainerType = t;
      trainerTypeNames[trainerType] = [];

      const config = trainerNameConfigs[t] as TrainerNameConfig;
      const trainerNames = new Set<string>();
      const femaleTrainerNames = new Set<string>();
      console.log(config.urls, config.femaleUrls)
      const trainerClassRequests = config.urls.map(u => fetchAndPopulateTrainerNames(u, parser, trainerNames, femaleTrainerNames));
      if (config.femaleUrls)
        trainerClassRequests.push(...config.femaleUrls.map(u => fetchAndPopulateTrainerNames(u, parser, null, femaleTrainerNames, true)));
      Promise.all(trainerClassRequests).then(() => {
        console.log(trainerNames, femaleTrainerNames)
        trainerTypeNames[trainerType] = !femaleTrainerNames.size ? Array.from(trainerNames) : [ Array.from(trainerNames), Array.from(femaleTrainerNames) ];
        resolve();
      });
    }));
  }
  Promise.all(populateTrainerNamePromises).then(() => {
    let output = 'export const trainerNamePools = {';
    Object.keys(trainerTypeNames).forEach(t => {
      output += `\n\t[TrainerType.${TrainerType[t]}]: ${JSON.stringify(trainerTypeNames[t])},`;
    });
    output += `\n};`;
    console.log(output);
  });
}*/
