/** @type {Partial<import("typedoc").TypeDocOptions>} */
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
  plugin: ["typedoc-github-theme", "typedoc-plugin-coverage", "typedoc-plugin-mdn-links"],
  // Avoid emitting docs for branches other than main/beta
  emit: process.env.CI && process.env.DRY_RUN ? "none" : "docs",
  coverageOutputType: "all",
  coverageLabel: "Documented",
  out: process.env.CI ? "/tmp/docs" : "typedoc",
  coverageSvgWidth: 20, // Same as the Github Actions test badge size (which cannot be resized)
  readme: "./README.md",
  favicon: "./public/images/logo.png",
  theme: "typedoc-github-theme",
  customFooterHtml: "<p>Copyright <strong>Pagefault Games</strong> 2025</p>",
  customFooterHtmlDisableWrapper: true,
};

// If generating docs, check the ref name and add an appropriate navigation header
if (!process.env.DRY_RUN && process.env.refName) {
  const otherRefName = process.env.refName === "main" ? "beta" : "main";
  config.navigationLinks = {
    [`Switch to ${otherRefName.charAt(0).toUpperCase() + otherRefName.slice(1).toLowerCase()}`]: `https://pagefaultgames.github.io/pokerogue/${otherRefName}/index.html`,
  };
}

export default config;
