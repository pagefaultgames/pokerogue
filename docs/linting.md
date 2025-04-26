# Biome

## Key Features

1. **Automation**:
   - A pre-commit hook has been added to automatically run Biome on the added or modified files, ensuring code quality before commits.

2. **Manual Usage**:
   - If you prefer not to use the pre-commit hook, you can manually run biome to automatically fix issues using the command:

     ```sh
     npx @biomejs/biome --write
     ```

   - Running this command will lint all files in the repository.

3. **GitHub Action**:
   - A GitHub Action has been added to automatically run Biome on every push and pull request, ensuring code quality in the CI/CD pipeline.

If you are getting linting errors from biome and want to see which files they are coming from, you can find that out by running biome in a way that is configured to only show the errors for that specific rule: ``npx @biomejs/biome lint --only=category/ruleName``

## Summary of Biome Rules

We use the [recommended ruleset](https://biomejs.dev/linter/rules/) for Biome, with some customizations to better suit our project's needs.

For a complete list of rules and their configurations, refer to the `biome.jsonc` file in the project root.

Some things to consider:

- We have disabled rules that prioritize style over performance, such as `useTemplate`
- Some rules are currently marked as warnings (`warn`) to allow for gradual refactoring without blocking development. Do not write new code that triggers these warnings.
- The linter is configured to ignore specific files and folders, such as large or complex files that are pending refactors, to improve performance and focus on actionable areas.

Formatting is also handled by Biome. You should not have to worry about manually formatting your code.
