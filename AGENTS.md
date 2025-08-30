# Agent Instructions for termnotes

## Build/Lint/Test Commands

- **Build**: `bun run build` - Compiles to native binary for macOS ARM64
- **Dev**: `bun dev` - Runs the application in development mode
- **Format/Lint**: `bun fmt` - Runs ultracite linting and formatting
- **No tests configured** - Add test files to `src/` and configure in package.json if needed

## Code Style Guidelines

### Language & Runtime

- **TypeScript** with strict mode enabled (`tsconfig.json`)
- **Bun** runtime with Node.js compatibility
- **Effect** library for functional programming patterns

### Formatting (Biome + Ultracite)

- Line width: 120 characters
- Indentation: Tabs (2 spaces wide)
- Quotes: Single quotes
- Semicolons: As needed
- Trailing commas: All
- Path aliases: `@/lib/*` → `src/lib/*`

### Code Patterns

- **Imports**: External libraries first, then relative imports
- prefer named imports/exports over default imports or namespace imports
- **Naming**: camelCase for functions/variables, PascalCase for types, kebab-case for file names
- **Error handling**: Throw errors for invalid states, use Effect for side effects
- use comments sparingly only when needed to explain something not otherwise obvious
- **File structure**: Main logic in `src/`, utilities in `src/lib/`
- prefer `async`/`await` over promises
- prefer Type over Interface
- prefer `function` over `const` for functions

### Dependencies

- Use existing libraries: Effect, @effect/cli, @clack/prompts
- Check package.json before adding new dependencies
- Follow functional programming patterns with Effect
