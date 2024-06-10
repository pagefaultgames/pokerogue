import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import imports from 'eslint-plugin-import';

export default [ 
    {
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        ignores: ["dist/*", "build/*", "coverage/*", "public/*", ".github/*", "node_modules/*", ".vscode/*"],
        languageOptions: {
            parser: parser
        },
        plugins: {
            imports: imports.configs.recommended,
            '@typescript-eslint': tseslint
        },
        rules: {
            "eqeqeq": ["error", "always"], // Enforces the use of === and !== instead of == and !=
            "indent": ["error", 2], // Enforces a 2-space indentation
            "quotes": ["error", "double"], // Enforces the use of double quotes for strings
            "no-var": "error", // Disallows the use of var, enforcing let or const instead
            "prefer-const": "error", // Prefers the use of const for variables that are never reassigned
            "no-undef": "off", // Disables the rule that disallows the use of undeclared variables (TypeScript handles this)
            "@typescript-eslint/no-unused-vars": [ "error", {
                "args": "none", // Allows unused function parameters. Useful for functions with specific signatures where not all parameters are always used.
                "ignoreRestSiblings": true // Allows unused variables that are part of a rest property in object destructuring. Useful for excluding certain properties from an object while using the rest.
            }],
            "eol-last": ["error", "always"], // Enforces at least one newline at the end of files
            "@typescript-eslint/semi": ["error", "always"], // Requires semicolons for TypeScript-specific syntax
            "semi": "off", // Disables the general semi rule for TypeScript files
            "no-extra-semi": ["error"], // Disallows unnecessary semicolons for TypeScript-specific syntax
            "brace-style": "off", // Note: you must disable the base rule as it can report incorrect errors
            "curly": ["error", "all"], // Enforces the use of curly braces for all control statements
            "@typescript-eslint/brace-style": ["error", "1tbs"],
            "no-trailing-spaces": ["error", { // Disallows trailing whitespace at the end of lines
                "skipBlankLines": false, // Enforces the rule even on blank lines
                "ignoreComments": false // Enforces the rule on lines containing comments
            }],
            "space-before-blocks": ["error", "always"], // Enforces a space before blocks
            "keyword-spacing": ["error", { "before": true, "after": true }] // Enforces spacing before and after keywords
        }
    }
]
