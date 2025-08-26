# Introduction

This document outlines the overall project architecture for **PokéRogue AO Migration**, including backend systems, shared services, and non-UI specific concerns. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development, ensuring consistency and adherence to chosen patterns and technologies.

**Relationship to Frontend Architecture:**
Phase 2 of this project will include a significant user interface through AOConnect integration with the existing Phaser.js frontend. A separate Frontend Architecture Document will detail the frontend-specific design and MUST be used in conjunction with this document. Core technology stack choices documented herein (see "Tech Stack") are definitive for the entire project, including any frontend components.

## Starter Template or Existing Project

**Finding: Existing Codebase Migration Project**

This project is **not** using a starter template but rather migrating an **existing sophisticated codebase**:

- **Source:** Current PokéRogue v1.10.4 with ~200+ TypeScript files implementing complex roguelike mechanics
- **Architecture:** Phaser.js game engine with extensive battle systems, creature management, and progression mechanics  
- **Constraints:** Must achieve **100% functional parity** with existing TypeScript implementation
- **Migration Approach:** TypeScript-to-Lua conversion for all game logic while preserving exact behavior

**Existing Project Analysis:**
- **Technology Stack:** TypeScript, Phaser.js, Vite build system, Vitest testing
- **Game Complexity:** Battle system, status effects, type effectiveness, move mechanics, progression systems
- **Data Models:** Pokemon species/forms, moves, abilities, trainers, biomes, items, save systems
- **Architecture Patterns:** Phase-based game loop, event-driven systems, state management
- **Limitation:** No manual setup required - existing codebase provides complete reference implementation

This significantly impacts our architectural decisions as we must ensure exact behavioral parity rather than greenfield design flexibility.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-26 | 1.0.0 | Initial architecture document | Architect Agent |
