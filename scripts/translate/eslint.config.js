import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import imports from "eslint-plugin-import";

export default [
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    ignores: ["dist/*", "build/*", "coverage/*", "public/*", ".github/*", "node_modules/*", ".vscode/*"],
    languageOptions: {
      parser: parser
    },
    plugins: {
      imports: imports.configs.recommended,
      "@typescript-eslint": tseslint
    },
    rules: {
      "comma-dangle": ["error", "never"], // Disallows trailing commas in object literals
      "object-curly-spacing": ["error", "always"], // Ensure that there are spaces inside braces
      "key-spacing": ["error", { beforeColon: false, afterColon: true }], // Ensure space after colon
      "comma-style": ["error", "last"], // Ensure commas are placed at the end of current line
      "object-property-newline": ["error", { allowAllPropertiesOnSameLine: false }], // Ensure that each property in an object literal is on a new line
      "quote-props": ["error", "consistent-as-needed"], // Ensure consistency in quoting object properties
      "quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }], // Ensure double quotes are used for strings
      "object-curly-newline": ["error", {
        ObjectExpression: { multiline: true, minProperties: 1 },
        ObjectPattern: { multiline: true, minProperties: 1 },
        ExportDeclaration: { multiline: true, minProperties: 1 }
      }],
      "no-template-curly-in-string": "error" // Disallows template literals in regular strings
    }
  }
];
