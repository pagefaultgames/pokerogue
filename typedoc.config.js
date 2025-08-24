import { globSync } from "node:fs";

/**
 * @type {Partial<import("typedoc").TypeDocOptions}
 */
const config = {
  entryPoints: ["./src", "./test/test-utils"],
  entryPointStrategy: "expand",
  exclude: ["**/*+.test.ts", "src/polyfills.ts", "src/vite.env.d.ts"],
  excludeReferences: true, // prevent documenting re-exports
  requiredToBeDocumented: [
    "Enum",
    "EnumMember",
    "Variable",
    "Function",
    "Class",
    "Interface",
    "Property",
    "Method",
    "Accessor",
    "TypeAlias",
  ],
  highlightLanguages: ["javascript", "json", "jsonc", "json5", "tsx", "typescript", "markdown"],
  plugin: [
    "typedoc-github-theme",
    "typedoc-plugin-coverage",
    "typedoc-plugin-mdn-links",
    ...globSync("./typedoc-plugins/**/*.js").map(plugin => "./" + plugin),
  ],
  // Avoid emitting docs for branches other than main/beta
  emit: process.env.DRY_RUN ? "none" : "docs",
  out: process.env.CI ? "/tmp/docs" : "./typedoc",
  readme: "./README.md",
  coverageLabel: "Documented",
  coverageSvgWidth: 120, // Increased from 104 baseline due to adding 2 extra letters
  favicon: "./public/images/logo.png",
  theme: "typedoc-github-theme",
  customFooterHtml: "<p>Copyright <strong>Pagefault Games</strong> 2025</p>",
  customFooterHtmlDisableWrapper: true,
};

// If generating docs, check the ref name and add an appropriate navigation header
if (!process.env.DRY_RUN && process.env.REF_NAME) {
  const otherRefName = process.env.REF_NAME === "main" ? "beta" : "main";
  config.navigationLinks = {
    [`Switch to ${otherRefName.charAt(0).toUpperCase() + otherRefName.slice(1).toLowerCase()}`]: `https://pagefaultgames.github.io/pokerogue/${otherRefName}`,
  };
}

export default config;
