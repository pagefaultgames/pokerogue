#!/bin/sh

# Ensure the script is run from the project root
SCRIPT_DIR=$(dirname "$0")
HOOKS_DIR="$SCRIPT_DIR/hooks"
GIT_HOOKS_DIR="$SCRIPT_DIR/.git/hooks"

# Copy the pre-commit hook to the .git/hooks directory
cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"

# Make the pre-commit hook executable
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo "Pre-commit hook installed successfully."
