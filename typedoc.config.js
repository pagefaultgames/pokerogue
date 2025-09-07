import { globSync } from "node:fs";

const dryRun = !!process.env.DRY_RUN?.match(/true/gi);

/**
 * @type {Partial<import("typedoc").TypeDocOptions>}
 */
const config = {
  entryPoints: ["./src", "./test/test-utils"],
  entryPointStrategy: "expand",
  exclude: [
    "src/polyfills.ts",
    "src/vite.env.d.ts",
    "**/*+.test.ts",
    "test/test-utils/setup",
    "test/test-utils/reporters",
  ],
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
  emit: dryRun ? "none" : "docs",
  out: process.env.CI ? "/tmp/docs" : "./typedoc",
  name: "PokéRogue",
  readme: "./README.md",
  coverageLabel: "Documented",
  coverageSvgWidth: 120, // Increased from 104 baseline due to adding 2 extra letters
  favicon: "./public/images/logo.png",
  theme: "typedoc-github-theme",
  customFooterHtml: "<p>Copyright <strong>Pagefault Games</strong> 2025</p>",
  customFooterHtmlDisableWrapper: true,
  navigationLinks: {
    GitHub: "https://github.com/pagefaultgames/pokerogue",
  },
};

// If generating docs for main/beta, check the ref name and add an appropriate navigation header
if (!dryRun && process.env.REF_NAME) {
  const otherRefName = process.env.REF_NAME === "main" ? "beta" : "main";
  config.navigationLinks = {
    ...config.navigationLinks,
    // This will be "Switch to Beta" when on main, and vice versa
    [`Switch to ${otherRefName.charAt(0).toUpperCase() + otherRefName.slice(1).toLowerCase()}`]: `https://pagefaultgames.github.io/pokerogue/${otherRefName}`,
  };
}

export default config;
