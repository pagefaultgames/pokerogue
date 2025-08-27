-- Test Aolite Integration with PokéRogue AO Processes
-- This script tests that we can load and use aolite with our AO processes

print("🧪 Testing Aolite Integration")
print("===============================")

-- Setup package path for aolite (need both aolite and aos modules)
package.path = package.path .. ';./development-tools/aolite/lua/?.lua;./development-tools/aolite/lua/aolite/?.lua;./development-tools/aolite/lua/aos/process/?.lua'

-- Test 1: Load aolite
print("\n1️⃣ Testing aolite loading...")
local success, aolite = pcall(require, 'main')
if not success then
    print("❌ Failed to load aolite:", aolite)
    os.exit(1)
end
print("✅ Aolite loaded successfully!")

-- Test 2: Check aolite API
print("\n2️⃣ Testing aolite API availability...")
local requiredFunctions = {
    'spawnProcess',
    'send', 
    'eval',
    'getAllMsgs',
    'runScheduler'
}

for _, func in ipairs(requiredFunctions) do
    if type(aolite[func]) ~= 'function' then
        print("❌ Missing required function:", func)
        os.exit(1)
    end
end
print("✅ All required aolite functions available!")

-- Test 3: Spawn PokéRogue main process
print("\n3️⃣ Testing AO process spawning...")
local processId = nil
local spawnSuccess, result = pcall(function()
    return aolite.spawnProcess(
        'pokerogue-test', -- processId
        './ao-processes/main.lua', -- process file
        {} -- tags
    )
end)

if not spawnSuccess then
    print("❌ Failed to spawn process:", result)
    os.exit(1)
end

processId = result
print("✅ Process spawned successfully!")
print("   Process ID:", processId)

-- Test 4: Send a test message
print("\n4️⃣ Testing message sending...")
local msgSuccess, msgResult = pcall(function()
    return aolite.send({
        Target = processId,
        Action = "Info",
        From = "test-sender"
    })
end)

if not msgSuccess then
    print("❌ Failed to send message:", msgResult)
    os.exit(1)
end
print("✅ Message sent successfully!")

-- Test 5: Run scheduler to process messages
print("\n5️⃣ Testing scheduler...")
local schedSuccess, schedResult = pcall(aolite.runScheduler)
if not schedSuccess then
    print("❌ Scheduler failed:", schedResult)
    os.exit(1)
end
print("✅ Scheduler ran successfully!")

-- Test 6: Check for messages
print("\n6️⃣ Testing message retrieval...")
local messages = aolite.getAllMsgs()
print("📬 Total messages:", #messages)

for i, msg in ipairs(messages) do
    if i <= 3 then -- Show first 3 messages
        print("   Message " .. i .. ":", msg.Action or "No action", "from", msg.From or "unknown")
    end
end

print("\n🎉 All aolite integration tests passed!")
print("✅ Ready for integration testing!")