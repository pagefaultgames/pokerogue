# Coding Standards

**MANDATORY BEHAVIORAL PARITY RULES:**

- **Never use Lua's math.random() - ALWAYS use AO crypto module:** Battle outcomes must be deterministic and reproducible using battle seeds
- **All stat calculations must match TypeScript Math.floor/Math.ceil exactly:** Use precise mathematical functions to ensure identical Pokemon stats
- **Nature multipliers must be exactly 0.9, 1.0, or 1.1 - never approximate:** Preserve exact stat calculation precision
- **All AO message responses must include success boolean:** Enable proper error handling for agents and UI
- **Never hardcode Pokemon/Move/Item data - always reference database tables:** Maintain single source of truth for game data
- **Battle RNG counter must increment for every random call:** Ensure deterministic battle replay capability

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **Functions** | camelCase | `calculatePokemonStat()` |
| **Variables** | camelCase | `battleResult`, `pokemonData` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_POKEMON_LEVEL` |
| **Tables/Objects** | PascalCase | `GameState`, `BattleHandler` |
| **Files** | kebab-case | `battle-handler.lua` |
