#!/bin/bash

# Test connecting to our deployed process with AOS CLI
PROCESS_ID="TP9oGe2eoVezJwdsX2BM-G5rfsaIoeGMlmIopBd5ybM"

echo "Connecting to process: $PROCESS_ID"

# Try to connect and send a basic command
echo "Testing if process responds to basic commands..."

# First, let's try a simple command
timeout 10s aos $PROCESS_ID --wallet wallet.json <<EOF
.info
.exit
EOF

echo "Done testing AOS connection"