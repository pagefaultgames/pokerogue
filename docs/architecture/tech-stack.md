# Tech Stack

## Cloud Infrastructure
- **Provider:** Arweave Network (AO Protocol)
- **Key Services:** AO Process hosting, Arweave permanent storage, AOConnect for Phase 2 integration
- **Deployment Regions:** Global (decentralized AO network)

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Backend Language** | Lua | 5.3 | AO process runtime | Required by AO protocol, mature ecosystem |
| **AO Framework** | Native AO Handlers | Latest | Message processing | Direct AO integration, optimal performance |
| **RNG System** | AO Crypto Module | Latest | Deterministic randomness | Cryptographically secure, seedable for parity |
| **Message Protocol** | JSON | - | Player/agent communication | AOConnect compatible, human readable |
| **Message Validation** | Custom Lua schemas | - | Protocol validation | Type safety and error handling |
| **State Management** | In-process Lua tables | - | Game state storage | Fast access, clear migration path |
| **Data Storage** | Embedded Lua structures | - | Pokemon/move/item data | Self-contained, no external dependencies |
| **Development Tools** | AO local emulation + parity tests | - | Development environment | Comprehensive validation approach |
| **Testing Framework** | Custom Lua test harness | - | Automated validation | TypeScript comparison capability |
| **Process Documentation** | AO Info handler | - | Agent discovery | Compliance with AO documentation protocol |
