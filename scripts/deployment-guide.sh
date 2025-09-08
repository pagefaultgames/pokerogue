#!/bin/bash
# PokéRogue AO Process Deployment Guide

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}🎮 PokéRogue AO Process Deployment Guide${NC}"
echo "=============================================="
echo ""

echo -e "${BLUE}📋 Available Deployment Commands:${NC}"
echo ""
echo -e "${CYAN}1. Build all processes:${NC}"
echo "   npm run ao:build                    # Build all processes"
echo "   npm run ao:build:dev               # Build dev version"
echo ""
echo -e "${CYAN}2. Build individual processes:${NC}"
echo "   npm run ao:build:coordinator       # Build coordinator process"
echo "   npm run ao:build:battle            # Build battle process"
echo "   npm run ao:build:pokemon           # Build pokemon process"
echo "   npm run ao:build:economy           # Build economy process"
echo "   npm run ao:build:security          # Build security process"
echo "   npm run ao:build:admin             # Build admin process"
echo ""
echo -e "${CYAN}3. Deploy all processes:${NC}"
echo "   npm run ao:deploy                  # Deploy all bundled processes"
echo ""
echo -e "${CYAN}4. Deploy single process:${NC}"
echo "   npm run ao:deploy:single coordinator"
echo "   npm run ao:deploy:single battle"
echo "   npm run ao:deploy:single pokemon"
echo "   npm run ao:deploy:single economy"
echo "   npm run ao:deploy:single security"
echo "   npm run ao:deploy:single admin"
echo ""
echo -e "${CYAN}5. Testing and validation:${NC}"
echo "   npm run ao:test                    # Run AO process tests"
echo "   npm run ao:test:deployment         # Test deployment"
echo "   npm run ao:validate                # Validate deployment"
echo ""
echo -e "${CYAN}6. Maintenance:${NC}"
echo "   npm run ao:clean                   # Clean build files"
echo "   npm run ao:rollback                # Rollback deployment"
echo ""

echo -e "${YELLOW}🚀 Quick Start Workflow:${NC}"
echo "1. npm run ao:build                   # Build all processes"
echo "2. npm run ao:deploy                  # Deploy all processes"
echo "3. npm run ao:test:deployment         # Verify deployment"
echo ""

echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Always build before deploying"
echo "• Check build/multi-process-manifest.json for build status"
echo "• Use single process deployment for faster iteration"
echo "• Check deployment logs in build/deployment.log"
echo ""

echo -e "${BLUE}📁 Important Files:${NC}"
echo "• build/multi-process-manifest.json   # Build manifest"
echo "• build/deployment-results.json       # Deployment results"
echo "• build/deployment.log                # Deployment log"
echo ""

if [ ! -d "build" ]; then
    echo -e "${YELLOW}⚠️  No build directory found. Run 'npm run ao:build' first.${NC}"
elif [ ! -f "build/multi-process-manifest.json" ]; then
    echo -e "${YELLOW}⚠️  No build manifest found. Run 'npm run ao:build' first.${NC}"
else
    echo -e "${GREEN}✅ Build directory exists. Ready for deployment.${NC}"
    
    # Show build status
    if command -v jq &> /dev/null; then
        echo ""
        echo -e "${BLUE}📊 Current Build Status:${NC}"
        jq -r '.processes[] | "  \(.name): \(.status) (\(.size_bytes) bytes)"' build/multi-process-manifest.json
        echo ""
        echo -e "Build Date: $(jq -r '.build_date' build/multi-process-manifest.json)"
        echo -e "Total Processes: $(jq -r '.total_processes' build/multi-process-manifest.json)"
        echo -e "Successful: $(jq -r '.successful_builds' build/multi-process-manifest.json)"
        echo -e "Failed: $(jq -r '.failed_builds' build/multi-process-manifest.json)"
    fi
fi

echo ""
echo -e "${GREEN}Ready to deploy! 🚀${NC}"