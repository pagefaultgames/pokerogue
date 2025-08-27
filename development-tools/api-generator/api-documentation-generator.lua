-- AO Process API Documentation Generator
-- Extracts and generates comprehensive API documentation from AO process handlers
-- Part of the development environment and testing framework

local APIDocumentationGenerator = {}

-- Documentation state
local doc_state = {
    discovered_handlers = {},
    extracted_apis = {},
    generated_docs = {},
    metadata_cache = {},
    generation_history = {}
}

-- Configuration
local generator_config = {
    source_directories = {
        "ao-processes/handlers",
        "ao-processes/game-logic",
        "ao-processes/data"
    },
    output_directory = "docs/api-reference",
    documentation_formats = { "markdown", "html", "json" },
    include_examples = true,
    include_source_links = true,
    generate_interactive_docs = true,
    ao_protocol_validation = true,
    file_patterns = {
        "*.lua"
    },
    excluded_patterns = {
        "**/tests/**",
        "**/node_modules/**",
        "**/.git/**"
    }
}

-- Handler and API discovery
function APIDocumentationGenerator.discoverHandlers(source_dirs)
    source_dirs = source_dirs or generator_config.source_directories
    local discovered = {
        handlers = {},
        modules = {},
        constants = {},
        utilities = {}
    }
    
    for _, source_dir in ipairs(source_dirs) do
        print("🔍 Discovering handlers in: " .. source_dir)
        local files = APIDocumentationGenerator.findLuaFiles(source_dir)
        
        for _, file_path in ipairs(files) do
            local file_type = APIDocumentationGenerator.classifyFile(file_path)
            local extracted_info = APIDocumentationGenerator.extractFileInfo(file_path)
            
            if extracted_info then
                if file_type == "handler" then
                    table.insert(discovered.handlers, extracted_info)
                elseif file_type == "module" then
                    table.insert(discovered.modules, extracted_info)
                elseif file_type == "constants" then
                    table.insert(discovered.constants, extracted_info)
                else
                    table.insert(discovered.utilities, extracted_info)
                end
            end
        end
    end
    
    doc_state.discovered_handlers = discovered
    
    print("📋 Discovery complete:")
    print("  Handlers: " .. #discovered.handlers)
    print("  Modules: " .. #discovered.modules)
    print("  Constants: " .. #discovered.constants)
    print("  Utilities: " .. #discovered.utilities)
    
    return discovered
end

function APIDocumentationGenerator.findLuaFiles(directory)
    -- In a real implementation, this would scan the filesystem
    -- For demonstration, we'll return the known files
    local known_files = {
        "ao-processes/handlers/admin-handler.lua",
        "ao-processes/handlers/auth-handler.lua",
        "ao-processes/handlers/validation-handler.lua",
        "ao-processes/handlers/anti-cheat-handler.lua",
        "ao-processes/game-logic/pokemon/stat-calculator.lua",
        "ao-processes/game-logic/battle/damage-calculator.lua",
        "ao-processes/game-logic/rng/crypto-rng.lua",
        "ao-processes/data/constants/enums.lua",
        "ao-processes/data/constants/type-chart.lua"
    }
    
    local filtered_files = {}
    for _, file_path in ipairs(known_files) do
        if string.find(file_path, directory, 1, true) then
            table.insert(filtered_files, file_path)
        end
    end
    
    return filtered_files
end

function APIDocumentationGenerator.classifyFile(file_path)
    if string.find(file_path, "handlers/") then
        return "handler"
    elseif string.find(file_path, "constants/") then
        return "constants"
    elseif string.find(file_path, "game-logic/") then
        return "module"
    else
        return "utility"
    end
end

-- File information extraction
function APIDocumentationGenerator.extractFileInfo(file_path)
    print("  📄 Extracting info from: " .. file_path)
    
    -- Read file content (simulated)
    local file_info = {
        file_path = file_path,
        file_name = file_path:match("([^/]+)%.lua$"),
        file_type = APIDocumentationGenerator.classifyFile(file_path),
        module_name = nil,
        description = "",
        functions = {},
        handlers = {},
        constants = {},
        dependencies = {},
        exports = {},
        ao_protocol_info = {},
        examples = {},
        last_modified = os.time(),
        line_count = 0
    }
    
    -- Extract information based on file type
    if file_info.file_type == "handler" then
        APIDocumentationGenerator.extractHandlerInfo(file_info)
    elseif file_info.file_type == "module" then
        APIDocumentationGenerator.extractModuleInfo(file_info)
    elseif file_info.file_type == "constants" then
        APIDocumentationGenerator.extractConstantsInfo(file_info)
    end
    
    return file_info
end

function APIDocumentationGenerator.extractHandlerInfo(file_info)
    -- Extract AO handler information
    file_info.ao_protocol_info = {
        is_ao_handler = true,
        handler_type = "message_handler",
        supported_actions = {},
        message_format = "JSON",
        authentication_required = true,
        authorization_levels = { "user", "admin" }
    }
    
    -- Simulated handler extraction based on file name
    if string.find(file_info.file_name, "admin") then
        file_info.description = "Administrative handler for process management and information"
        file_info.handlers = {
            {
                name = "Info",
                action = "Info",
                description = "Provides process information and capabilities",
                parameters = {},
                returns = { "process_info", "capabilities", "version" },
                example = [[msg = { Action = "Info" }]]
            },
            {
                name = "Health",
                action = "Health", 
                description = "Returns process health status",
                parameters = {},
                returns = { "status", "uptime", "metrics" },
                example = [[msg = { Action = "Health" }]]
            }
        }
        
    elseif string.find(file_info.file_name, "auth") then
        file_info.description = "Authentication and authorization handler"
        file_info.handlers = {
            {
                name = "Authenticate",
                action = "Authenticate",
                description = "Authenticates user wallet address",
                parameters = { "wallet_address", "signature" },
                returns = { "authenticated", "user_id", "permissions" },
                example = [[msg = { Action = "Authenticate", WalletAddress = "abc123...", Signature = "def456..." }]]
            },
            {
                name = "CheckPermissions",
                action = "CheckPermissions",
                description = "Validates user permissions for specific actions",
                parameters = { "user_id", "required_permission" },
                returns = { "authorized", "user_level" },
                example = [[msg = { Action = "CheckPermissions", UserId = "user123", Permission = "battle.start" }]]
            }
        }
        
    elseif string.find(file_info.file_name, "validation") then
        file_info.description = "Data validation and sanitization handler"
        file_info.handlers = {
            {
                name = "ValidateGameData",
                action = "ValidateGameData",
                description = "Validates game data against schema",
                parameters = { "data_type", "data", "schema_version" },
                returns = { "valid", "errors", "sanitized_data" },
                example = [[msg = { Action = "ValidateGameData", DataType = "pokemon", Data = {...}, SchemaVersion = "1.0" }]]
            }
        }
        
    elseif string.find(file_info.file_name, "anti-cheat") then
        file_info.description = "Anti-cheat and security validation handler"
        file_info.handlers = {
            {
                name = "ValidateBattleAction",
                action = "ValidateBattleAction", 
                description = "Validates battle actions for cheating attempts",
                parameters = { "user_id", "battle_id", "action_data" },
                returns = { "valid", "risk_score", "violations" },
                example = [[msg = { Action = "ValidateBattleAction", UserId = "user123", BattleId = "battle456", ActionData = {...} }]]
            }
        }
    end
    
    -- Add common handler metadata
    for _, handler in ipairs(file_info.handlers) do
        handler.file_path = file_info.file_path
        handler.handler_file = file_info.file_name
        handler.ao_compliant = true
        handler.async = false
        handler.rate_limited = true
    end
end

function APIDocumentationGenerator.extractModuleInfo(file_info)
    -- Extract module function information
    file_info.module_name = file_info.file_name:gsub("%-", "_")
    
    if string.find(file_info.file_name, "stat-calculator") then
        file_info.description = "Pokemon stat calculation utilities with TypeScript parity"
        file_info.functions = {
            {
                name = "calculatePokemonStat",
                description = "Calculates individual Pokemon stat values",
                parameters = {
                    { name = "base_stat", type = "number", description = "Base stat value" },
                    { name = "level", type = "number", description = "Pokemon level" },
                    { name = "iv", type = "number", description = "Individual Value" },
                    { name = "ev", type = "number", description = "Effort Value" },
                    { name = "nature_modifier", type = "number", description = "Nature modifier (0.9, 1.0, 1.1)" }
                },
                returns = { { name = "stat_value", type = "number", description = "Calculated stat" } },
                example = [[local stat = calculatePokemonStat(100, 50, 31, 252, 1.1)]]
            },
            {
                name = "calculateHPStat",
                description = "Calculates HP stat with special formula",
                parameters = {
                    { name = "base_hp", type = "number", description = "Base HP stat" },
                    { name = "level", type = "number", description = "Pokemon level" },
                    { name = "iv", type = "number", description = "HP IV" },
                    { name = "ev", type = "number", description = "HP EV" }
                },
                returns = { { name = "hp_value", type = "number", description = "Calculated HP" } },
                example = [[local hp = calculateHPStat(108, 50, 31, 252)]]
            }
        }
        
    elseif string.find(file_info.file_name, "damage-calculator") then
        file_info.description = "Battle damage calculation with type effectiveness"
        file_info.functions = {
            {
                name = "calculateDamage",
                description = "Calculates battle damage between Pokemon",
                parameters = {
                    { name = "attacker", type = "table", description = "Attacking Pokemon data" },
                    { name = "defender", type = "table", description = "Defending Pokemon data" },
                    { name = "move", type = "table", description = "Move data" },
                    { name = "battle_conditions", type = "table", description = "Battle modifiers" }
                },
                returns = { { name = "damage", type = "number", description = "Final damage value" } },
                example = [[local damage = calculateDamage(attacker, defender, move, conditions)]]
            }
        }
        
    elseif string.find(file_info.file_name, "crypto-rng") then
        file_info.description = "Cryptographic random number generation for AO processes"
        file_info.functions = {
            {
                name = "generateSecureRandom",
                description = "Generates cryptographically secure random number",
                parameters = {
                    { name = "seed", type = "string", description = "Random seed" },
                    { name = "min", type = "number", description = "Minimum value" },
                    { name = "max", type = "number", description = "Maximum value" }
                },
                returns = { { name = "random_value", type = "number", description = "Secure random number" } },
                example = [[local rng = generateSecureRandom("battle_seed_123", 1, 100)]]
            }
        }
    end
end

function APIDocumentationGenerator.extractConstantsInfo(file_info)
    -- Extract constants and enums
    if string.find(file_info.file_name, "enums") then
        file_info.description = "Game enumerations and constant values"
        file_info.constants = {
            {
                name = "PokemonSpecies",
                type = "enum",
                description = "Pokemon species identifiers",
                values = { "BULBASAUR = 1", "IVYSAUR = 2", "VENUSAUR = 3", "..." },
                example = [[local species = PokemonSpecies.PIKACHU]]
            },
            {
                name = "MoveType",
                type = "enum", 
                description = "Pokemon type identifiers",
                values = { "NORMAL = 1", "FIRE = 2", "WATER = 3", "..." },
                example = [[local type = MoveType.ELECTRIC]]
            }
        }
        
    elseif string.find(file_info.file_name, "type-chart") then
        file_info.description = "Type effectiveness multipliers"
        file_info.constants = {
            {
                name = "TYPE_EFFECTIVENESS",
                type = "table",
                description = "Type effectiveness lookup table",
                values = { "Nested table with effectiveness multipliers" },
                example = [[local effectiveness = TYPE_EFFECTIVENESS[attacking_type][defending_type]]
            }
        }
    end
end

-- Documentation generation
function APIDocumentationGenerator.generateDocumentation(discovered_info, options)
    options = options or {}
    local docs = {}
    
    print("📝 Generating API documentation...")
    
    for _, format in ipairs(generator_config.documentation_formats) do
        if format == "markdown" then
            docs.markdown = APIDocumentationGenerator.generateMarkdownDocs(discovered_info, options)
        elseif format == "html" then
            docs.html = APIDocumentationGenerator.generateHTMLDocs(discovered_info, options)
        elseif format == "json" then
            docs.json = APIDocumentationGenerator.generateJSONDocs(discovered_info, options)
        end
    end
    
    -- Generate index files
    docs.index = APIDocumentationGenerator.generateIndexFiles(discovered_info)
    
    -- Save documentation files
    APIDocumentationGenerator.saveDocumentation(docs)
    
    doc_state.generated_docs = docs
    table.insert(doc_state.generation_history, {
        timestamp = os.time(),
        formats = generator_config.documentation_formats,
        file_count = 0,
        success = true
    })
    
    return docs
end

function APIDocumentationGenerator.generateMarkdownDocs(discovered_info, options)
    local markdown_docs = {}
    
    -- Generate handler documentation
    for _, handler_info in ipairs(discovered_info.handlers) do
        local md_content = APIDocumentationGenerator.generateHandlerMarkdown(handler_info)
        markdown_docs[handler_info.file_name] = md_content
    end
    
    -- Generate module documentation
    for _, module_info in ipairs(discovered_info.modules) do
        local md_content = APIDocumentationGenerator.generateModuleMarkdown(module_info)
        markdown_docs[module_info.file_name] = md_content
    end
    
    -- Generate constants documentation
    for _, constants_info in ipairs(discovered_info.constants) do
        local md_content = APIDocumentationGenerator.generateConstantsMarkdown(constants_info)
        markdown_docs[constants_info.file_name] = md_content
    end
    
    -- Generate comprehensive API overview
    markdown_docs["API_Overview"] = APIDocumentationGenerator.generateAPIOverviewMarkdown(discovered_info)
    
    return markdown_docs
end

function APIDocumentationGenerator.generateHandlerMarkdown(handler_info)
    local lines = {
        "# " .. (handler_info.file_name or "Unknown Handler"),
        "",
        "## Description",
        handler_info.description or "No description available.",
        "",
        "## AO Protocol Information",
        "- **Handler Type:** " .. (handler_info.ao_protocol_info.handler_type or "message_handler"),
        "- **Message Format:** " .. (handler_info.ao_protocol_info.message_format or "JSON"),
        "- **Authentication Required:** " .. tostring(handler_info.ao_protocol_info.authentication_required or false),
        ""
    }
    
    if handler_info.handlers and #handler_info.handlers > 0 then
        table.insert(lines, "## Message Handlers")
        table.insert(lines, "")
        
        for _, handler in ipairs(handler_info.handlers) do
            table.insert(lines, "### " .. handler.name)
            table.insert(lines, "")
            table.insert(lines, "**Action:** `" .. handler.action .. "`")
            table.insert(lines, "")
            table.insert(lines, handler.description or "No description available.")
            table.insert(lines, "")
            
            if handler.parameters and #handler.parameters > 0 then
                table.insert(lines, "**Parameters:**")
                for _, param in ipairs(handler.parameters) do
                    table.insert(lines, "- `" .. param .. "`")
                end
                table.insert(lines, "")
            end
            
            if handler.returns and #handler.returns > 0 then
                table.insert(lines, "**Returns:**")
                for _, ret in ipairs(handler.returns) do
                    table.insert(lines, "- `" .. ret .. "`")
                end
                table.insert(lines, "")
            end
            
            if handler.example then
                table.insert(lines, "**Example:**")
                table.insert(lines, "```lua")
                table.insert(lines, handler.example)
                table.insert(lines, "```")
                table.insert(lines, "")
            end
        end
    end
    
    table.insert(lines, "---")
    table.insert(lines, "*Generated from: `" .. handler_info.file_path .. "`*")
    
    return table.concat(lines, "\n")
end

function APIDocumentationGenerator.generateModuleMarkdown(module_info)
    local lines = {
        "# " .. (module_info.module_name or module_info.file_name),
        "",
        "## Description",
        module_info.description or "No description available.",
        ""
    }
    
    if module_info.functions and #module_info.functions > 0 then
        table.insert(lines, "## Functions")
        table.insert(lines, "")
        
        for _, func in ipairs(module_info.functions) do
            table.insert(lines, "### " .. func.name)
            table.insert(lines, "")
            table.insert(lines, func.description or "No description available.")
            table.insert(lines, "")
            
            if func.parameters and #func.parameters > 0 then
                table.insert(lines, "**Parameters:**")
                table.insert(lines, "| Name | Type | Description |")
                table.insert(lines, "|------|------|-------------|")
                for _, param in ipairs(func.parameters) do
                    table.insert(lines, string.format("| `%s` | %s | %s |", 
                        param.name, param.type, param.description))
                end
                table.insert(lines, "")
            end
            
            if func.returns and #func.returns > 0 then
                table.insert(lines, "**Returns:**")
                table.insert(lines, "| Name | Type | Description |")
                table.insert(lines, "|------|------|-------------|")
                for _, ret in ipairs(func.returns) do
                    table.insert(lines, string.format("| `%s` | %s | %s |", 
                        ret.name, ret.type, ret.description))
                end
                table.insert(lines, "")
            end
            
            if func.example then
                table.insert(lines, "**Example:**")
                table.insert(lines, "```lua")
                table.insert(lines, func.example)
                table.insert(lines, "```")
                table.insert(lines, "")
            end
        end
    end
    
    table.insert(lines, "---")
    table.insert(lines, "*Generated from: `" .. module_info.file_path .. "`*")
    
    return table.concat(lines, "\n")
end

function APIDocumentationGenerator.generateConstantsMarkdown(constants_info)
    local lines = {
        "# " .. (constants_info.file_name or "Constants"),
        "",
        "## Description", 
        constants_info.description or "No description available.",
        ""
    }
    
    if constants_info.constants and #constants_info.constants > 0 then
        table.insert(lines, "## Constants")
        table.insert(lines, "")
        
        for _, constant in ipairs(constants_info.constants) do
            table.insert(lines, "### " .. constant.name)
            table.insert(lines, "")
            table.insert(lines, "**Type:** " .. (constant.type or "unknown"))
            table.insert(lines, "")
            table.insert(lines, constant.description or "No description available.")
            table.insert(lines, "")
            
            if constant.values and #constant.values > 0 then
                table.insert(lines, "**Values:**")
                for _, value in ipairs(constant.values) do
                    table.insert(lines, "- " .. value)
                end
                table.insert(lines, "")
            end
            
            if constant.example then
                table.insert(lines, "**Example:**")
                table.insert(lines, "```lua")
                table.insert(lines, constant.example)
                table.insert(lines, "```")
                table.insert(lines, "")
            end
        end
    end
    
    table.insert(lines, "---")
    table.insert(lines, "*Generated from: `" .. constants_info.file_path .. "`*")
    
    return table.concat(lines, "\n")
end

function APIDocumentationGenerator.generateAPIOverviewMarkdown(discovered_info)
    local lines = {
        "# AO Process API Reference",
        "",
        "## Overview",
        "This documentation provides comprehensive information about the AO Process handlers, modules, and constants.",
        "",
        "## Message Handlers",
        ""
    }
    
    for _, handler_info in ipairs(discovered_info.handlers) do
        table.insert(lines, "### [" .. handler_info.file_name .. "](./" .. handler_info.file_name .. ".md)")
        table.insert(lines, handler_info.description or "No description available.")
        
        if handler_info.handlers and #handler_info.handlers > 0 then
            local actions = {}
            for _, h in ipairs(handler_info.handlers) do
                table.insert(actions, "`" .. h.action .. "`")
            end
            table.insert(lines, "**Actions:** " .. table.concat(actions, ", "))
        end
        table.insert(lines, "")
    end
    
    table.insert(lines, "## Game Logic Modules")
    table.insert(lines, "")
    
    for _, module_info in ipairs(discovered_info.modules) do
        table.insert(lines, "### [" .. module_info.file_name .. "](./" .. module_info.file_name .. ".md)")
        table.insert(lines, module_info.description or "No description available.")
        table.insert(lines, "")
    end
    
    table.insert(lines, "## Constants and Enumerations")
    table.insert(lines, "")
    
    for _, constants_info in ipairs(discovered_info.constants) do
        table.insert(lines, "### [" .. constants_info.file_name .. "](./" .. constants_info.file_name .. ".md)")
        table.insert(lines, constants_info.description or "No description available.")
        table.insert(lines, "")
    end
    
    table.insert(lines, "---")
    table.insert(lines, "*Documentation generated on " .. os.date("%Y-%m-%d %H:%M:%S") .. "*")
    
    return table.concat(lines, "\n")
end

function APIDocumentationGenerator.generateHTMLDocs(discovered_info, options)
    -- Generate HTML documentation (simplified)
    local html_docs = {}
    
    for _, handler_info in ipairs(discovered_info.handlers) do
        html_docs[handler_info.file_name] = APIDocumentationGenerator.generateHandlerHTML(handler_info)
    end
    
    return html_docs
end

function APIDocumentationGenerator.generateHandlerHTML(handler_info)
    return string.format([[
<!DOCTYPE html>
<html>
<head>
    <title>%s - AO Process API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .handler { border: 1px solid #ccc; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .example { background: #f5f5f5; padding: 10px; border-radius: 3px; }
        pre { background: #333; color: white; padding: 10px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
    <h2>Message Handlers</h2>
    <!-- Handler details would be generated here -->
</body>
</html>]], handler_info.file_name, handler_info.file_name, handler_info.description or "")
end

function APIDocumentationGenerator.generateJSONDocs(discovered_info, options)
    -- Generate JSON API documentation
    return {
        api_version = "1.0.0",
        generated_at = os.date("%Y-%m-%dT%H:%M:%SZ"),
        handlers = discovered_info.handlers,
        modules = discovered_info.modules,
        constants = discovered_info.constants
    }
end

function APIDocumentationGenerator.generateIndexFiles(discovered_info)
    return {
        readme = APIDocumentationGenerator.generateReadmeIndex(discovered_info),
        toc = APIDocumentationGenerator.generateTableOfContents(discovered_info)
    }
end

function APIDocumentationGenerator.generateReadmeIndex(discovered_info)
    local lines = {
        "# AO Process API Documentation",
        "",
        "## Quick Start",
        "This directory contains auto-generated API documentation for AO Process handlers and modules.",
        "",
        "## Documentation Structure",
        "- **Handlers/** - AO message handler documentation",
        "- **Modules/** - Game logic module documentation", 
        "- **Constants/** - Constants and enumeration documentation",
        "",
        "## Navigation",
        "- [API Overview](API_Overview.md) - Complete API reference",
        "- [Table of Contents](TABLE_OF_CONTENTS.md) - Organized content list",
        "",
        "---",
        "*Auto-generated on " .. os.date("%Y-%m-%d %H:%M:%S") .. "*"
    }
    
    return table.concat(lines, "\n")
end

function APIDocumentationGenerator.generateTableOfContents(discovered_info)
    local lines = {
        "# Table of Contents",
        "",
        "## Message Handlers"
    }
    
    for _, handler_info in ipairs(discovered_info.handlers) do
        table.insert(lines, "- [" .. handler_info.file_name .. "](./" .. handler_info.file_name .. ".md)")
    end
    
    table.insert(lines, "")
    table.insert(lines, "## Game Logic Modules")
    
    for _, module_info in ipairs(discovered_info.modules) do
        table.insert(lines, "- [" .. module_info.file_name .. "](./" .. module_info.file_name .. ".md)")
    end
    
    table.insert(lines, "")
    table.insert(lines, "## Constants")
    
    for _, constants_info in ipairs(discovered_info.constants) do
        table.insert(lines, "- [" .. constants_info.file_name .. "](./" .. constants_info.file_name .. ".md)")
    end
    
    return table.concat(lines, "\n")
end

-- File saving and management
function APIDocumentationGenerator.saveDocumentation(docs)
    -- Create output directory
    os.execute("mkdir -p " .. generator_config.output_directory)
    
    local file_count = 0
    
    -- Save markdown docs
    if docs.markdown then
        for filename, content in pairs(docs.markdown) do
            local file_path = generator_config.output_directory .. "/" .. filename .. ".md"
            APIDocumentationGenerator.writeFile(file_path, content)
            file_count = file_count + 1
        end
    end
    
    -- Save index files
    if docs.index then
        APIDocumentationGenerator.writeFile(generator_config.output_directory .. "/README.md", docs.index.readme)
        APIDocumentationGenerator.writeFile(generator_config.output_directory .. "/TABLE_OF_CONTENTS.md", docs.index.toc)
        file_count = file_count + 2
    end
    
    print("💾 Saved " .. file_count .. " documentation files to " .. generator_config.output_directory)
    return file_count
end

function APIDocumentationGenerator.writeFile(file_path, content)
    local file = io.open(file_path, "w")
    if file then
        file:write(content)
        file:close()
        return true
    else
        print("⚠️ Failed to write file: " .. file_path)
        return false
    end
end

-- Main generation function
function APIDocumentationGenerator.generateComprehensiveDocs(options)
    options = options or {}
    
    print("🚀 Starting comprehensive API documentation generation...")
    
    -- Discover all handlers and modules
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    
    -- Generate documentation in all formats
    local generated_docs = APIDocumentationGenerator.generateDocumentation(discovered_info, options)
    
    print("🎉 Documentation generation complete!")
    
    return {
        discovered_info = discovered_info,
        generated_docs = generated_docs,
        output_directory = generator_config.output_directory,
        generation_time = os.time()
    }
end

-- Configuration and status
function APIDocumentationGenerator.configure(new_config)
    for k, v in pairs(new_config) do
        generator_config[k] = v
    end
end

function APIDocumentationGenerator.getConfiguration()
    return generator_config
end

function APIDocumentationGenerator.getStatus()
    return {
        discovered_handlers = #doc_state.discovered_handlers,
        generated_docs_count = doc_state.generated_docs and 
            (function()
                local count = 0
                for _ in pairs(doc_state.generated_docs) do
                    count = count + 1
                end
                return count
            end)() or 0,
        last_generation = doc_state.generation_history[#doc_state.generation_history],
        output_directory = generator_config.output_directory
    }
end

return APIDocumentationGenerator