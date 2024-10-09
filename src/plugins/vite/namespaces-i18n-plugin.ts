import { normalizePath, type Plugin as VitePlugin } from "vite";
import fs from "fs";
import path from "path";

function kebabCaseToCamelCase(str: string): string {
  return str.split("-").map((text, index) => {
    if (index > 0) {
      return text.split("").map((char, i) => i === 0 ? char.toUpperCase() : char).join("");
    }
    return text;
  }).join("");
}

function getNameSpaces(dir: string) {
  const namespace: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      const subnamespace = getNameSpaces(filePath);
      for (let i = 0; i < subnamespace.length; i++) {
        let ns = subnamespace[i];
        if (kebabCaseToCamelCase(file).replace(".json", "").startsWith("mysteryEncounters")) {
          ns = subnamespace[i].replace(/Dialogue$/, "");
        }
        namespace.push(`${kebabCaseToCamelCase(file).replace(".json", "")}/${ns}`);
      }
    } else if (path.extname(file) === ".json") {
      namespace.push(kebabCaseToCamelCase(file).replace(".json", ""));
    }
  }

  return namespace;
}

function isFileInsideDir(file, dir) {
  const filePath = path.normalize(file);
  const dirPath = path.normalize(dir);
  return filePath.startsWith(dirPath);
}

export function LocaleNamespace(): VitePlugin {
  const nsLocation = "./public/locales";
  const nsEn = `${nsLocation}/en`; // Default namespace
  let namespaces = getNameSpaces(nsEn);
  //   const nsEnRegex = new RegExp(`^${nsEn.replace(/\//g, "\\/")}.*\\.json$`);
  const nsAbsolutePath = path.resolve(process.cwd(), nsLocation); // Convert to absolute path

  return {
    name: "namespaces-i18next",
    buildStart() {
      if (process.env.NODE_ENV === "production") {
        console.log("Assign namespace to constant nsEn");
      }
    },
    configureServer(server) {
      const restartHandler = async (file, action: string) => {
        if (isFileInsideDir(file, nsAbsolutePath) && file.endsWith(".json")) {
          console.log(`\x1b[34m${normalizePath(file.replace(nsAbsolutePath, ""))}\x1b[0m ${action}, reloading page...`);

          namespaces = await getNameSpaces(nsEn);
          await server.moduleGraph.invalidateAll();
          await server.ws.send({
            type: "full-reload",
          });
        }
      };
      server.watcher.on("change", (file) => restartHandler(file, "updated"));
      server.watcher.on("add", (file) => restartHandler(file, "added"));
      server.watcher.on("unlink", (file) => restartHandler(file, "removed"));
    },
    transform: {
      handler(code, id) {
        if (id.endsWith("i18n.ts")) {
          return code.replace("const nsEn = [];", `const nsEn = ${JSON.stringify(namespaces)};`);
        }
        return code;
      },
    },

  };
}
