# Claude Development Notes

This file contains information and commands for Claude to help with development tasks.

## Project Information
- Project: PokéRogue ECS HyperBeam
- Architecture: Greenfield Entity-Component-System
- Main branch: beta
- Current branch: epic34

## Development Commands
### ECS Development
- Build ECS: `npm run build:ecs`
- Test ECS: `npm run test:ecs`
- Start ECS dev: `npm run dev:ecs`
- ECS lint: `npm run lint:ecs`

### Legacy Commands (Archived)
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Type check: `npm run typecheck`

## MCP Servers Available
The following MCP servers are configured and available through the Model Context Protocol:

### permamind
- **Type**: Local MCP server (Permanent AI Memory System)
- **Command**: `npx permamind`
- **Repository**: https://github.com/ALLiDoizCode/Permamind
- **Purpose**: Permanent, decentralized AI memory system built on Arweave and AO

#### Available Tools:

**1. Memory Management Tools**
- AI memory management for persistent storage and retrieval
- Store and query information permanently across sessions
- Create knowledge relationships

**2. Process Tools**
- `generateLuaProcess`: Generate Lua code for AO processes with documentation-informed best practices
  - Parameters: `userRequest` (required), `domains` (optional), `includeExplanation` (optional)
  - Usage: `"Generate a token transfer process"`
- `spawnProcess`: Spawn new AO processes with optional template support
- `evalProcess`: Deploy Lua code to processes (handlers, modules)
- `executeAction`: Send messages to processes using natural language
- `queryAOProcessMessages`: Query process message history and communication logs
- `validateDeployment`: Validate deployed process functionality
- `rollbackDeployment`: Rollback failed deployments
- `analyzeProcessArchitecture`: Analyze process architecture and structure

**3. Token Tools**
- Token operations for balance, transfer, and info queries
- Advanced minting strategies
- Credit notice detection

**4. Documentation Tools**
- Permaweb documentation, file storage, and deployment tools
- Access to decentralized documentation systems

**5. Contact Tools**
- Contact and address management tools
- Manage decentralized identity and addresses

**6. Hub Tools**
- Hub creation and management tools for Velocity protocol
- Decentralized hub discovery and management

**7. User Tools**
- User information tools for getting public key and hub ID
- Identity management and credentials

**8. ArNS Tools**
- ArNS name system operations for decentralized domains
- Domain name registration and management

#### Usage Instructions:
- **Memory Storage**: Simply tell Claude to remember something - it will be stored permanently
- **Process Queries**: Ask about AO process capabilities using natural language
- **Token Operations**: Use conversational commands for blockchain operations
- **Zero Configuration**: All tools work automatically without setup

#### Benefits:
- Permanent memory (never forgets across sessions)
- Self-documenting AO processes
- Natural language blockchain interactions
- Automatic process discovery

### aolite Docs  
- **Type**: SSE (Server-Sent Events) documentation server
- **URL**: https://gitmcp.io/perplex-labs/aolite
- **Repository**: https://github.com/perplex-labs/aolite
- **Purpose**: Local, concurrent emulation of the Arweave AO protocol for testing Lua processes
- **Key Features**:
  - **Local AO Environment**: Simulates AO protocol without network deployment
  - **Concurrent Process Emulation**: Uses coroutines for process management
  - **Message Passing**: Send messages between processes with queue management
  - **Direct Process State Access**: Inspect process state during development
  - **Flexible Scheduler Control**: Manual or automatic message scheduling
  - **Configurable Logging**: Multiple log levels (0-3) with optional output capture
- **Core API Methods**:
  - `spawnProcess()`: Load and spawn processes from string or file
  - `send()`: Send messages between processes
  - `eval()`: Evaluate code in process context
  - `getAllMsgs()`: Retrieve messages by various criteria
  - `runScheduler()`: Execute message scheduling
  - `setMessageLog()`: Configure message logging
- **Usage**: 
  - Test AO processes locally before deployment
  - Debug process interactions and message flows
  - Develop Lua handlers with AO-compatible globals (`ao`, `Handlers`)
- **Requirements**: Lua 5.3

### harlequin-toolkit Docs
- **Type**: SSE (Server-Sent Events) documentation server  
- **URL**: https://gitmcp.io/the-permaweb-harlequin/harlequin-toolkit
- **Repository**: https://github.com/the-permaweb-harlequin/harlequin-toolkit
- **Purpose**: Web development toolkit for Permaweb applications using Rspress
- **Key Features**:
  - **Rspress Website Framework**: Modern web development with TypeScript support
  - **Multi-Component Architecture**: Includes CLI, SDK, server, and app components
  - **Development Tools Integration**: Pre-configured with Nx, ESLint, Prettier
  - **TypeScript Support**: Full TypeScript development environment
- **Components**:
  - **CLI**: Command-line interface tools
  - **SDK**: Software development kit for Permaweb integration
  - **Server**: Backend server components
  - **App**: Frontend application framework
- **Development Commands**:
  - `npm install`: Install dependencies
  - `npm run dev`: Start development server
  - `npm run build`: Build for production
  - `npm run preview`: Preview production build
- **CLI Commands**:
  - `harlequin`: Launch interactive TUI (Terminal User Interface)
  - `harlequin build`: Interactive build mode for Arweave projects
  - `harlequin build ./my-project`: Direct CLI build mode (for automation)
  - `harlequin build --entrypoint <file>`: Build with specific entry point
  - `harlequin lua-utils bundle --entrypoint main.lua`: Bundle Lua files
  - `harlequin version` / `-v`: Display version information
  - `harlequin help` / `-h`: Show usage instructions
- **CLI Features**:
  - 🎨 Beautiful Terminal UI with Charm Bubble Tea
  - 📁 Smart File Discovery
  - ⚙️ Configuration Management (YAML-based)
  - 🚀 Real-time Progress Tracking
  - 🔧 Clear Error Handling
- **Usage**:
  - Build modern web applications for the Permaweb
  - Develop decentralized applications with TypeScript
  - Create permanent web content and interfaces
- **Context**: The Permaweb is Arweave's permanent, censorship-resistant web infrastructure
- **Status**: Early development stage (no releases yet)

## MCP Best Practices
- **Memory Management**: Use permamind or similar memory servers to maintain context across sessions
- **Documentation Access**: Leverage the documentation servers for real-time access to technical documentation
- **Permanent Storage**: Use aolite documentation for implementing permanent storage solutions
- **Decentralized Development**: Use harlequin-toolkit docs for building on the Permaweb

## Notes
- **Project Status**: Greenfield ECS HyperBeam architecture
- **Architecture**: Entity-Component-System with data-oriented design
- **Performance**: SIMD vectorization and cache optimization targets
- **Platform**: Arweave AO with decentralized persistence
- **Legacy Archive**: Previous implementation archived in `archive/` directory
- MCP servers provide additional capabilities for memory management and documentation access

## Automated README Updates
The project includes automated README Migration Parity Checklist updates:
- `scripts/update-progress-checklist.sh` - Scans completed stories and updates checklist
- `.git/hooks/pre-push` - Automatically runs checklist update before pushes
- Checklist items are marked ✅ when corresponding stories show "Done" or "PASS" status