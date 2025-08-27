-- Unit Tests for API Documentation Generator
-- Tests the comprehensive API documentation generation system
-- Part of Task 8: Build Documentation Generator System

-- Load test framework
local enhanced_test_framework = require("ao-processes.tests.framework.enhanced-test-framework")
local TestFramework = enhanced_test_framework

-- Load the API Documentation Generator
local APIDocumentationGenerator = require("development-tools.api-generator.api-documentation-generator")

-- Test suite
local test_suite = TestFramework.createTestSuite("API Documentation Generator", {
    description = "Unit tests for the API documentation generation system",
    timeout = 15000, -- 15 seconds
    setup_timeout = 3000,
    teardown_timeout = 3000
})

-- Test state
local test_state = {
    original_config = nil,
    temp_output_dir = "test-docs-output"
}

-- Setup function
function test_suite.setup()
    print("🔧 Setting up API Documentation Generator tests...")
    
    -- Store original configuration
    test_state.original_config = APIDocumentationGenerator.getConfiguration()
    
    -- Configure for testing
    APIDocumentationGenerator.configure({
        output_directory = test_state.temp_output_dir,
        documentation_formats = { "markdown", "json" },
        include_examples = true,
        include_source_links = true
    })
    
    print("✅ API Documentation Generator test setup complete")
    return true
end

-- Teardown function
function test_suite.teardown()
    print("🧹 Cleaning up API Documentation Generator tests...")
    
    -- Restore original configuration
    if test_state.original_config then
        APIDocumentationGenerator.configure(test_state.original_config)
    end
    
    -- Clean up temporary files
    os.execute("rm -rf " .. test_state.temp_output_dir)
    
    print("✅ API Documentation Generator test teardown complete")
    return true
end

-- Test 1: Configuration Management
TestFramework.addTest(test_suite, "test_configuration_management", function()
    print("  ⚙️ Testing configuration management...")
    
    -- Test getting configuration
    local config = APIDocumentationGenerator.getConfiguration()
    TestFramework.assert(config ~= nil, "Should retrieve configuration")
    TestFramework.assert(config.output_directory ~= nil, "Should have output directory")
    TestFramework.assert(config.documentation_formats ~= nil, "Should have documentation formats")
    
    -- Test setting configuration
    local new_config = {
        output_directory = "test-custom-output",
        documentation_formats = { "markdown" }
    }
    
    APIDocumentationGenerator.configure(new_config)
    local updated_config = APIDocumentationGenerator.getConfiguration()
    
    TestFramework.assert(updated_config.output_directory == "test-custom-output", 
        "Should update output directory")
    TestFramework.assert(#updated_config.documentation_formats == 1, 
        "Should update documentation formats")
    
    print("    ✅ Configuration management validated")
    return true
end)

-- Test 2: Handler Discovery
TestFramework.addTest(test_suite, "test_handler_discovery", function()
    print("  🔍 Testing handler discovery...")
    
    -- Test handler discovery
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    
    -- Validate discovery results
    TestFramework.assert(discovered_info ~= nil, "Should return discovery results")
    TestFramework.assert(discovered_info.handlers ~= nil, "Should discover handlers")
    TestFramework.assert(discovered_info.modules ~= nil, "Should discover modules")
    TestFramework.assert(discovered_info.constants ~= nil, "Should discover constants")
    TestFramework.assert(discovered_info.utilities ~= nil, "Should discover utilities")
    
    -- Check that we found some handlers (based on our known file structure)
    TestFramework.assert(#discovered_info.handlers > 0, "Should find at least one handler")
    TestFramework.assert(#discovered_info.modules > 0, "Should find at least one module")
    TestFramework.assert(#discovered_info.constants > 0, "Should find at least one constants file")
    
    -- Validate handler structure
    if #discovered_info.handlers > 0 then
        local first_handler = discovered_info.handlers[1]
        TestFramework.assert(first_handler.file_path ~= nil, "Handler should have file path")
        TestFramework.assert(first_handler.file_name ~= nil, "Handler should have file name")
        TestFramework.assert(first_handler.file_type ~= nil, "Handler should have file type")
    end
    
    print("    ✅ Handler discovery validated")
    return true
end)

-- Test 3: File Classification
TestFramework.addTest(test_suite, "test_file_classification", function()
    print("  📂 Testing file classification...")
    
    -- Test handler classification
    local handler_file = "ao-processes/handlers/admin-handler.lua"
    local handler_type = APIDocumentationGenerator.classifyFile(handler_file)
    TestFramework.assert(handler_type == "handler", "Should classify handlers correctly")
    
    -- Test module classification
    local module_file = "ao-processes/game-logic/pokemon/stat-calculator.lua"
    local module_type = APIDocumentationGenerator.classifyFile(module_file)
    TestFramework.assert(module_type == "module", "Should classify modules correctly")
    
    -- Test constants classification
    local constants_file = "ao-processes/data/constants/enums.lua"
    local constants_type = APIDocumentationGenerator.classifyFile(constants_file)
    TestFramework.assert(constants_type == "constants", "Should classify constants correctly")
    
    -- Test utility classification
    local utility_file = "ao-processes/utilities/helper.lua"
    local utility_type = APIDocumentationGenerator.classifyFile(utility_file)
    TestFramework.assert(utility_type == "utility", "Should classify utilities correctly")
    
    print("    ✅ File classification validated")
    return true
end)

-- Test 4: Handler Information Extraction
TestFramework.addTest(test_suite, "test_handler_info_extraction", function()
    print("  📄 Testing handler information extraction...")
    
    -- Test extracting admin handler info
    local admin_handler_info = APIDocumentationGenerator.extractFileInfo("ao-processes/handlers/admin-handler.lua")
    
    TestFramework.assert(admin_handler_info ~= nil, "Should extract handler info")
    TestFramework.assert(admin_handler_info.file_type == "handler", "Should identify as handler")
    TestFramework.assert(admin_handler_info.description ~= nil, "Should have description")
    TestFramework.assert(admin_handler_info.handlers ~= nil, "Should extract handlers")
    TestFramework.assert(#admin_handler_info.handlers > 0, "Should find handler functions")
    
    -- Validate AO protocol information
    TestFramework.assert(admin_handler_info.ao_protocol_info ~= nil, "Should have AO protocol info")
    TestFramework.assert(admin_handler_info.ao_protocol_info.is_ao_handler == true, "Should be AO handler")
    TestFramework.assert(admin_handler_info.ao_protocol_info.message_format == "JSON", "Should use JSON format")
    
    -- Validate individual handler details
    local first_handler = admin_handler_info.handlers[1]
    TestFramework.assert(first_handler.name ~= nil, "Handler should have name")
    TestFramework.assert(first_handler.action ~= nil, "Handler should have action")
    TestFramework.assert(first_handler.description ~= nil, "Handler should have description")
    
    print("    ✅ Handler information extraction validated")
    return true
end)

-- Test 5: Module Information Extraction
TestFramework.addTest(test_suite, "test_module_info_extraction", function()
    print("  🧩 Testing module information extraction...")
    
    -- Test extracting stat calculator info
    local stat_calc_info = APIDocumentationGenerator.extractFileInfo("ao-processes/game-logic/pokemon/stat-calculator.lua")
    
    TestFramework.assert(stat_calc_info ~= nil, "Should extract module info")
    TestFramework.assert(stat_calc_info.file_type == "module", "Should identify as module")
    TestFramework.assert(stat_calc_info.module_name ~= nil, "Should have module name")
    TestFramework.assert(stat_calc_info.functions ~= nil, "Should extract functions")
    TestFramework.assert(#stat_calc_info.functions > 0, "Should find module functions")
    
    -- Validate function details
    local first_function = stat_calc_info.functions[1]
    TestFramework.assert(first_function.name ~= nil, "Function should have name")
    TestFramework.assert(first_function.description ~= nil, "Function should have description")
    TestFramework.assert(first_function.parameters ~= nil, "Function should have parameters")
    TestFramework.assert(first_function.returns ~= nil, "Function should have returns")
    
    -- Validate parameter structure
    if #first_function.parameters > 0 then
        local first_param = first_function.parameters[1]
        TestFramework.assert(first_param.name ~= nil, "Parameter should have name")
        TestFramework.assert(first_param.type ~= nil, "Parameter should have type")
        TestFramework.assert(first_param.description ~= nil, "Parameter should have description")
    end
    
    print("    ✅ Module information extraction validated")
    return true
end)

-- Test 6: Constants Information Extraction
TestFramework.addTest(test_suite, "test_constants_info_extraction", function()
    print("  📊 Testing constants information extraction...")
    
    -- Test extracting enums info
    local enums_info = APIDocumentationGenerator.extractFileInfo("ao-processes/data/constants/enums.lua")
    
    TestFramework.assert(enums_info ~= nil, "Should extract constants info")
    TestFramework.assert(enums_info.file_type == "constants", "Should identify as constants")
    TestFramework.assert(enums_info.constants ~= nil, "Should extract constants")
    TestFramework.assert(#enums_info.constants > 0, "Should find constant definitions")
    
    -- Validate constant details
    local first_constant = enums_info.constants[1]
    TestFramework.assert(first_constant.name ~= nil, "Constant should have name")
    TestFramework.assert(first_constant.type ~= nil, "Constant should have type")
    TestFramework.assert(first_constant.description ~= nil, "Constant should have description")
    TestFramework.assert(first_constant.values ~= nil, "Constant should have values")
    
    print("    ✅ Constants information extraction validated")
    return true
end)

-- Test 7: Markdown Documentation Generation
TestFramework.addTest(test_suite, "test_markdown_generation", function()
    print("  📝 Testing Markdown documentation generation...")
    
    -- Discover handlers for testing
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    
    -- Generate markdown documentation
    local markdown_docs = APIDocumentationGenerator.generateMarkdownDocs(discovered_info)
    
    TestFramework.assert(markdown_docs ~= nil, "Should generate markdown docs")
    TestFramework.assert(type(markdown_docs) == "table", "Should return table of docs")
    
    -- Check that we have documentation for discovered items
    local doc_count = 0
    for filename, content in pairs(markdown_docs) do
        doc_count = doc_count + 1
        TestFramework.assert(type(content) == "string", "Doc content should be string")
        TestFramework.assert(string.len(content) > 0, "Doc content should not be empty")
        
        -- Validate markdown structure
        if filename ~= "API_Overview" then
            TestFramework.assert(string.find(content, "# ") ~= nil, "Should have main heading")
            TestFramework.assert(string.find(content, "## Description") ~= nil, "Should have description section")
        end
    end
    
    TestFramework.assert(doc_count > 0, "Should generate at least one document")
    
    -- Test API overview generation
    TestFramework.assert(markdown_docs["API_Overview"] ~= nil, "Should generate API overview")
    local overview = markdown_docs["API_Overview"]
    TestFramework.assert(string.find(overview, "# AO Process API Reference") ~= nil, 
        "Should have proper overview title")
    TestFramework.assert(string.find(overview, "## Message Handlers") ~= nil, 
        "Should have handlers section")
    
    print("    ✅ Markdown documentation generation validated")
    return true
end)

-- Test 8: JSON Documentation Generation
TestFramework.addTest(test_suite, "test_json_generation", function()
    print("  📋 Testing JSON documentation generation...")
    
    -- Discover handlers for testing
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    
    -- Generate JSON documentation
    local json_docs = APIDocumentationGenerator.generateJSONDocs(discovered_info)
    
    TestFramework.assert(json_docs ~= nil, "Should generate JSON docs")
    TestFramework.assert(type(json_docs) == "table", "Should return table structure")
    
    -- Validate JSON structure
    TestFramework.assert(json_docs.api_version ~= nil, "Should have API version")
    TestFramework.assert(json_docs.generated_at ~= nil, "Should have generation timestamp")
    TestFramework.assert(json_docs.handlers ~= nil, "Should include handlers")
    TestFramework.assert(json_docs.modules ~= nil, "Should include modules")
    TestFramework.assert(json_docs.constants ~= nil, "Should include constants")
    
    -- Validate data consistency
    TestFramework.assert(#json_docs.handlers == #discovered_info.handlers, 
        "Should include all discovered handlers")
    TestFramework.assert(#json_docs.modules == #discovered_info.modules, 
        "Should include all discovered modules")
    TestFramework.assert(#json_docs.constants == #discovered_info.constants, 
        "Should include all discovered constants")
    
    print("    ✅ JSON documentation generation validated")
    return true
end)

-- Test 9: Index File Generation
TestFramework.addTest(test_suite, "test_index_generation", function()
    print("  📑 Testing index file generation...")
    
    -- Discover handlers for testing
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    
    -- Generate index files
    local index_files = APIDocumentationGenerator.generateIndexFiles(discovered_info)
    
    TestFramework.assert(index_files ~= nil, "Should generate index files")
    TestFramework.assert(index_files.readme ~= nil, "Should generate README")
    TestFramework.assert(index_files.toc ~= nil, "Should generate table of contents")
    
    -- Validate README structure
    local readme = index_files.readme
    TestFramework.assert(string.find(readme, "# AO Process API Documentation") ~= nil, 
        "README should have proper title")
    TestFramework.assert(string.find(readme, "## Quick Start") ~= nil, 
        "README should have quick start section")
    TestFramework.assert(string.find(readme, "Auto-generated") ~= nil, 
        "README should indicate auto-generation")
    
    -- Validate table of contents structure
    local toc = index_files.toc
    TestFramework.assert(string.find(toc, "# Table of Contents") ~= nil, 
        "TOC should have proper title")
    TestFramework.assert(string.find(toc, "## Message Handlers") ~= nil, 
        "TOC should have handlers section")
    
    print("    ✅ Index file generation validated")
    return true
end)

-- Test 10: Comprehensive Documentation Generation
TestFramework.addTest(test_suite, "test_comprehensive_generation", function()
    print("  🚀 Testing comprehensive documentation generation...")
    
    -- Generate comprehensive documentation
    local generation_result = APIDocumentationGenerator.generateComprehensiveDocs({
        formats = { "markdown", "json" }
    })
    
    TestFramework.assert(generation_result ~= nil, "Should return generation result")
    TestFramework.assert(generation_result.discovered_info ~= nil, "Should include discovered info")
    TestFramework.assert(generation_result.generated_docs ~= nil, "Should include generated docs")
    TestFramework.assert(generation_result.output_directory ~= nil, "Should include output directory")
    TestFramework.assert(generation_result.generation_time ~= nil, "Should include generation time")
    
    -- Validate discovered information
    local discovered = generation_result.discovered_info
    TestFramework.assert(#discovered.handlers > 0, "Should discover handlers")
    TestFramework.assert(#discovered.modules > 0, "Should discover modules")
    TestFramework.assert(#discovered.constants > 0, "Should discover constants")
    
    -- Validate generated documentation
    local docs = generation_result.generated_docs
    TestFramework.assert(docs.markdown ~= nil, "Should generate markdown docs")
    TestFramework.assert(docs.json ~= nil, "Should generate JSON docs")
    TestFramework.assert(docs.index ~= nil, "Should generate index files")
    
    print("    ✅ Comprehensive documentation generation validated")
    return true
end)

-- Test 11: Status and Monitoring
TestFramework.addTest(test_suite, "test_status_monitoring", function()
    print("  📊 Testing status and monitoring...")
    
    -- Test initial status
    local initial_status = APIDocumentationGenerator.getStatus()
    TestFramework.assert(initial_status ~= nil, "Should retrieve status")
    TestFramework.assert(initial_status.output_directory ~= nil, "Should have output directory")
    
    -- Generate documentation to update status
    APIDocumentationGenerator.generateComprehensiveDocs()
    
    -- Test updated status
    local updated_status = APIDocumentationGenerator.getStatus()
    TestFramework.assert(updated_status.generated_docs_count >= 0, "Should track generated docs")
    TestFramework.assert(updated_status.last_generation ~= nil, "Should track last generation")
    
    print("    ✅ Status and monitoring validated")
    return true
end)

-- Test 12: Error Handling
TestFramework.addTest(test_suite, "test_error_handling", function()
    print("  🚨 Testing error handling...")
    
    -- Test invalid configuration
    local original_config = APIDocumentationGenerator.getConfiguration()
    
    -- Test with invalid source directories
    APIDocumentationGenerator.configure({
        source_directories = { "non/existent/directory" }
    })
    
    local discovered_info = APIDocumentationGenerator.discoverHandlers()
    TestFramework.assert(discovered_info ~= nil, "Should handle invalid directories gracefully")
    
    -- Restore configuration
    APIDocumentationGenerator.configure(original_config)
    
    -- Test file classification with invalid paths
    local invalid_type = APIDocumentationGenerator.classifyFile("invalid/path/file.lua")
    TestFramework.assert(invalid_type ~= nil, "Should handle invalid paths gracefully")
    
    print("    ✅ Error handling validated")
    return true
end)

-- Run the test suite
local function run_api_doc_tests()
    print("🧪 Starting API Documentation Generator Tests")
    print("===========================================")
    
    local results = TestFramework.runTestSuite(test_suite)
    
    print("\n📊 API Documentation Generator Test Results:")
    print("===========================================")
    print("Total Tests: " .. results.total_tests)
    print("Passed: " .. results.passed_tests .. " (" .. string.format("%.1f%%", results.pass_rate * 100) .. ")")
    print("Failed: " .. results.failed_tests .. " (" .. string.format("%.1f%%", results.fail_rate * 100) .. ")")
    print("Skipped: " .. results.skipped_tests)
    print("Execution Time: " .. string.format("%.2f seconds", results.execution_time / 1000))
    
    if results.overall_success then
        print("\n🎉 All API documentation generator tests passed!")
    else
        print("\n❌ Some tests failed. Check the detailed results above.")
        if results.failed_test_details then
            for _, failure in ipairs(results.failed_test_details) do
                print("   - " .. failure.test_name .. ": " .. failure.error_message)
            end
        end
    end
    
    return results.overall_success
end

-- Export the test suite
return {
    test_suite = test_suite,
    run_api_doc_tests = run_api_doc_tests,
    TestFramework = TestFramework
}