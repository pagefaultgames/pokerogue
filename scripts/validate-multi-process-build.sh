#!/bin/bash
# Validate multi-process build artifacts
# Checks syntax, dependencies, and deployment readiness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_DIR="build"
VALIDATION_PASSED=0
VALIDATION_FAILED=()
WARNINGS=()

echo -e "${GREEN}🔍 Validating Multi-Process Build${NC}"
echo "=================================="
echo ""

# Check if build directory exists
if [[ ! -d "$BUILD_DIR" ]]; then
    echo -e "${RED}❌ Build directory not found: $BUILD_DIR${NC}"
    echo -e "${YELLOW}Run ./scripts/build-multi-process.sh first${NC}"
    exit 1
fi

# Expected processes
PROCESSES=("coordinator" "battle" "pokemon" "economy" "security" "admin")

validate_lua_syntax() {
    local file=$1
    local process_name=$2
    
    echo -e "${BLUE}🔍 Validating $process_name syntax...${NC}"
    
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}   ❌ File not found: $file${NC}"
        return 1
    fi
    
    # Check Lua syntax
    if lua -e "local f, err = loadfile('$file'); if not f then error(err) end" 2>/dev/null; then
        echo -e "${GREEN}   ✅ Lua syntax valid${NC}"
        
        # Check file size
        local size=$(wc -c < "$file")
        if [[ $size -gt 0 ]]; then
            echo -e "${GREEN}   ✅ File size: $size bytes${NC}"
        else
            echo -e "${RED}   ❌ File is empty${NC}"
            return 1
        fi
        
        # Check for common AO patterns
        if grep -q "Handlers\." "$file"; then
            echo -e "${GREEN}   ✅ Contains AO handlers${NC}"
        else
            echo -e "${YELLOW}   ⚠️  No AO handlers found${NC}"
            WARNINGS+=("$process_name: No AO handlers detected")
        fi
        
        if grep -q "ao\." "$file"; then
            echo -e "${GREEN}   ✅ Uses AO globals${NC}"
        else
            echo -e "${YELLOW}   ⚠️  No AO globals usage found${NC}"
            WARNINGS+=("$process_name: No AO globals usage detected")
        fi
        
        return 0
    else
        echo -e "${RED}   ❌ Lua syntax error:${NC}"
        lua -e "local f, err = loadfile('$file'); if not f then print('   ' .. err) end" 2>&1
        return 1
    fi
}

validate_process_structure() {
    local file=$1
    local process_name=$2
    
    echo -e "${BLUE}🏗️  Validating $process_name structure...${NC}"
    
    # Check for required components
    local has_handlers=false
    local has_init=false
    local has_exports=false
    
    if grep -q "Handlers\." "$file"; then
        has_handlers=true
        echo -e "${GREEN}   ✅ Has message handlers${NC}"
    fi
    
    if grep -q -i "init\|initialize\|setup" "$file"; then
        has_init=true
        echo -e "${GREEN}   ✅ Has initialization code${NC}"
    fi
    
    # Process-specific validations
    case $process_name in
        "coordinator")
            if grep -q -i "coordination\|orchestrat\|manage" "$file"; then
                echo -e "${GREEN}   ✅ Contains coordination logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No coordination logic found${NC}"
                WARNINGS+=("$process_name: Missing coordination logic")
            fi
            ;;
        "battle")
            if grep -q -i "battle\|combat\|fight\|damage" "$file"; then
                echo -e "${GREEN}   ✅ Contains battle logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No battle logic found${NC}"
                WARNINGS+=("$process_name: Missing battle logic")
            fi
            ;;
        "pokemon")
            if grep -q -i "pokemon\|species\|party" "$file"; then
                echo -e "${GREEN}   ✅ Contains pokemon logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No pokemon logic found${NC}"
                WARNINGS+=("$process_name: Missing pokemon logic")
            fi
            ;;
        "economy")
            if grep -q -i "shop\|item\|currency\|buy\|sell" "$file"; then
                echo -e "${GREEN}   ✅ Contains economy logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No economy logic found${NC}"
                WARNINGS+=("$process_name: Missing economy logic")
            fi
            ;;
        "security")
            if grep -q -i "security\|auth\|valid\|check" "$file"; then
                echo -e "${GREEN}   ✅ Contains security logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No security logic found${NC}"
                WARNINGS+=("$process_name: Missing security logic")
            fi
            ;;
        "admin")
            if grep -q -i "admin\|manage\|monitor" "$file"; then
                echo -e "${GREEN}   ✅ Contains admin logic${NC}"
            else
                echo -e "${YELLOW}   ⚠️  No admin logic found${NC}"
                WARNINGS+=("$process_name: Missing admin logic")
            fi
            ;;
    esac
    
    return 0
}

echo -e "${BLUE}📋 Validating ${#PROCESSES[@]} processes...${NC}"
echo ""

# Validate each process
for process in "${PROCESSES[@]}"; do
    echo -e "${YELLOW}🔍 Validating $process process...${NC}"
    
    process_file="$BUILD_DIR/${process}-process.lua"
    
    if validate_lua_syntax "$process_file" "$process" && validate_process_structure "$process_file" "$process"; then
        echo -e "${GREEN}✅ $process process validation passed${NC}"
        ((VALIDATION_PASSED++))
    else
        echo -e "${RED}❌ $process process validation failed${NC}"
        VALIDATION_FAILED+=("$process")
    fi
    echo ""
done

# Check deployment manifest
echo -e "${BLUE}📋 Validating deployment manifest...${NC}"
manifest_file="$BUILD_DIR/multi-process-manifest.json"

if [[ -f "$manifest_file" ]]; then
    if python3 -m json.tool "$manifest_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Deployment manifest is valid JSON${NC}"
        
        # Extract info from manifest
        total_processes=$(python3 -c "import json; print(json.load(open('$manifest_file'))['total_processes'])" 2>/dev/null || echo "unknown")
        successful_builds=$(python3 -c "import json; print(json.load(open('$manifest_file'))['successful_builds'])" 2>/dev/null || echo "unknown")
        
        echo -e "${GREEN}   Total processes: $total_processes${NC}"
        echo -e "${GREEN}   Successful builds: $successful_builds${NC}"
    else
        echo -e "${RED}❌ Invalid deployment manifest JSON${NC}"
        VALIDATION_FAILED+=("manifest")
    fi
else
    echo -e "${YELLOW}⚠️  No deployment manifest found${NC}"
    WARNINGS+=("Missing deployment manifest")
fi

echo ""

# Create validation report
cat > "$BUILD_DIR/validation-report.json" << EOF
{
    "validation_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_processes": ${#PROCESSES[@]},
    "passed_validation": $VALIDATION_PASSED,
    "failed_validation": ${#VALIDATION_FAILED[@]},
    "failed_processes": [$(printf '"%s",' "${VALIDATION_FAILED[@]}" | sed 's/,$//')],
    "warnings_count": ${#WARNINGS[@]},
    "warnings": [$(printf '"%s",' "${WARNINGS[@]}" | sed 's/,$//')],
    "deployment_ready": $([ ${#VALIDATION_FAILED[@]} -eq 0 ] && echo "true" || echo "false")
}
EOF

# Display validation summary
echo -e "${GREEN}🎉 Validation Summary${NC}"
echo "===================="
echo -e "${GREEN}✅ Passed validation: $VALIDATION_PASSED/${#PROCESSES[@]}${NC}"

if [[ ${#VALIDATION_FAILED[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Failed validation: ${#VALIDATION_FAILED[@]}${NC}"
    echo -e "${RED}   Failed processes: ${VALIDATION_FAILED[*]}${NC}"
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Warnings: ${#WARNINGS[@]}${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "${YELLOW}   • $warning${NC}"
    done
fi

echo ""
echo -e "${BLUE}📄 Validation report: $BUILD_DIR/validation-report.json${NC}"
echo ""

if [[ ${#VALIDATION_FAILED[@]} -eq 0 ]]; then
    echo -e "${GREEN}🚀 All processes ready for deployment!${NC}"
    exit 0
else
    echo -e "${RED}❌ Fix validation errors before deployment${NC}"
    exit 1
fi