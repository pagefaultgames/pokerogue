#!/bin/bash

# Progress Checklist Updater
# Automatically updates README.md Migration Parity Checklist based on completed stories
# Usage: ./scripts/update-progress-checklist.sh

set -e

echo "🔄 Updating Migration Parity Checklist in README.md..."

# Function to check if a story is marked as completed
check_story_completion() {
    local story_file="$1"
    if [[ -f "$story_file" ]]; then
        # Check if story has "Status:** Done" or "PASS" in QA results
        if grep -q "Status.*Done\|Gate.*PASS\|✓ Ready for Done" "$story_file"; then
            return 0  # Story is completed
        fi
    fi
    return 1  # Story not completed
}

# Function to update README checklist items
update_checklist_item() {
    local item_pattern="$1"
    local readme_file="README.md"
    
    # Convert [ ] to ✅ for the matched items
    sed -i.bak "s/- \[ \] $item_pattern/- ✅ $item_pattern/g" "$readme_file" 2>/dev/null || {
        # For macOS compatibility
        sed -i '' "s/- \[ \] $item_pattern/- ✅ $item_pattern/g" "$readme_file" 2>/dev/null || {
            echo "Warning: Could not update $item_pattern"
        }
    }
}

# Check Story 3.1 - Move Database & Mechanics Migration
if check_story_completion "docs/stories/3.1.story.md"; then
    echo "✅ Story 3.1 completed - updating move system items"
    update_checklist_item "Move learning and movesets"
    update_checklist_item "TM/TR system"
fi

# Check Story 3.2 - Move Learning Systems  
if check_story_completion "docs/stories/3.2.story.md"; then
    echo "✅ Story 3.2 completed - updating move learning items"
    update_checklist_item "Move learning and movesets"
    update_checklist_item "TM/TR system"
fi

# Check Story 3.3 - Move Effect System Architecture
if check_story_completion "docs/stories/3.3.story.md"; then
    echo "✅ Story 3.3 completed - updating battle system items"
    update_checklist_item "Status effect application and duration"
    update_checklist_item "Weather system impact"
    update_checklist_item "Environmental effects"
fi

# Check Story 4.1 - Turn-Based Battle Engine
if check_story_completion "docs/stories/4.1.story.md"; then
    echo "✅ Story 4.1 completed - updating battle engine items"
    update_checklist_item "Turn-based battle mechanics"
    update_checklist_item "Battle state persistence"
fi

# Check Story 4.2 - Damage Calculation System  
if check_story_completion "docs/stories/4.2.story.md"; then
    echo "✅ Story 4.2 completed - updating damage calculation items"
    update_checklist_item "Damage calculation algorithms"
    update_checklist_item "Type effectiveness matrix"
    update_checklist_item "Critical hit calculation"
fi

# Check Story 4.3 - Battle State & Switching System
if check_story_completion "docs/stories/4.3.story.md"; then
    echo "✅ Story 4.3 completed - updating switching system items"
    update_checklist_item "Battle state persistence"
    update_checklist_item "Multi-target move handling"
fi

# Check Story 4.4 - Battle Victory & Defeat Conditions
if check_story_completion "docs/stories/4.4.story.md"; then
    echo "✅ Story 4.4 completed - updating victory/defeat system items"
    update_checklist_item "Battle victory conditions and rewards"
    update_checklist_item "Experience point distribution"
    update_checklist_item "Money and item reward system"
    update_checklist_item "Battle statistics tracking"
fi

# Check if Epic 3 is fully completed by checking all 3 stories
epic3_complete=true
for story in "3.1" "3.2" "3.3"; do
    if ! check_story_completion "docs/stories/$story.story.md"; then
        epic3_complete=false
        break
    fi
done

if $epic3_complete; then
    echo "🎉 Epic 3 fully completed - updating major system items"
    
    # Update all battle system items
    update_checklist_item "Turn-based battle mechanics"
    update_checklist_item "Damage calculation algorithms"
    update_checklist_item "Type effectiveness matrix"
    update_checklist_item "Critical hit calculation"
    update_checklist_item "Accuracy/evasion mechanics"
    update_checklist_item "Multi-target move handling"
    update_checklist_item "Battle state persistence"
    
    # Update Pokemon system items
    update_checklist_item "Species data and base stats"
    update_checklist_item "Nature system and stat modifiers"
    update_checklist_item "Ability system implementation"
    
    # Update inventory items
    update_checklist_item "Item database and effects"
    update_checklist_item "Consumable item effects"
    update_checklist_item "Held item mechanics"
    
    # Update world exploration items
    update_checklist_item "Environmental effects"
    update_checklist_item "Weather system impact"
fi

# Check if Epic 4 is fully completed by checking all stories
epic4_complete=true
for story in "4.1" "4.2" "4.3" "4.4"; do
    if ! check_story_completion "docs/stories/$story.story.md"; then
        epic4_complete=false
        break
    fi
done

if $epic4_complete; then
    echo "🎉 Epic 4 fully completed - updating core battle system items"
    
    # Update all Epic 4 battle system items
    update_checklist_item "Turn-based battle mechanics"
    update_checklist_item "Damage calculation algorithms"  
    update_checklist_item "Type effectiveness matrix"
    update_checklist_item "Critical hit calculation"
    update_checklist_item "Accuracy/evasion mechanics"
    update_checklist_item "Battle state persistence"
    update_checklist_item "Battle victory conditions and rewards"
    update_checklist_item "Experience point distribution"
    update_checklist_item "Money and item reward system"
    update_checklist_item "Battle statistics tracking"
fi

# Check for any additional completed systems by scanning for QA PASS gates
if find docs/qa/gates/ -name "*.yml" -exec grep -l "status.*PASS" {} \; >/dev/null 2>&1; then
    echo "📊 Found additional completed systems with QA PASS status"
fi

# Clean up backup files if they exist
rm -f README.md.bak 2>/dev/null || true

echo "✅ Migration Parity Checklist updated successfully!"

# Show summary of current progress
completed_count=$(grep -c "✅" README.md || echo "0")
total_count=$(grep -c "- \[" README.md || echo "0")
echo "📈 Current Progress: $completed_count/$((completed_count + total_count)) items completed"