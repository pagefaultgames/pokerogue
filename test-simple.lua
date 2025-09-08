-- Simple test process
print("Hello from AO process!")

Handlers.add(
  "test",
  Handlers.utils.hasMatchingTag("Action", "Test"),
  function(msg)
    Handlers.utils.reply("Test handler working!")(msg)
  end
)

-- Expose a simple global for health check
TestGlobal = "I exist!"

print("Simple test process loaded successfully")