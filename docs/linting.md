# ESLint
## Key Features

1. **Automation**:
   - A pre-commit hook has been added to automatically run ESLint on the added or modified files, ensuring code quality before commits.

2. **Manual Usage**:
   - If you prefer not to use the pre-commit hook, you can manually run ESLint to automatically fix issues using the command:
     ```sh
     npx eslint --fix . or npm run eslint
     ```
   - Running this command will lint all files in the repository.

3. **GitHub Action**:
   - A GitHub Action has been added to automatically run ESLint on every push and pull request, ensuring code quality in the CI/CD pipeline.

## Summary of ESLint Rules

1. **General Rules**:
   - **Equality**: Use `===` and `!==` instead of `==` and `!=` (`eqeqeq`).
   - **Indentation**: Enforce 2-space indentation (`indent`).
   - **Quotes**: Use doublequotes for strings (`quotes`).
   - **Variable Declarations**: 
     - Disallow `var`; use `let` or `const` (`no-var`).
     - Prefer `const` for variables that are never reassigned (`prefer-const`).
   - **Unused Variables**: Allow unused function parameters but enforce error for other unused variables (`@typescript-eslint/no-unused-vars`).
   - **End of Line**: Ensure at least one newline at the end of files (`eol-last`).
   - **Curly Braces**: Enforce the use of curly braces for all control statements (`curly`).
   - **Brace Style**: Use one true brace style (`1tbs`) for TypeScript-specific syntax (`@typescript-eslint/brace-style`).

2. **TypeScript-Specific Rules**:
   - **Semicolons**:
     - Enforce semicolons for TypeScript-specific syntax (`@typescript-eslint/semi`).
     - Disallow unnecessary semicolons (`@typescript-eslint/no-extra-semi`).

## Benefits

- **Consistency**: Ensures consistent coding style across the project.
- **Code Quality**: Helps catch potential errors and improve overall code quality.
- **Readability**: Makes the codebase easier to read and maintain.