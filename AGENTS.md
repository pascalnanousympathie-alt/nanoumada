# Nanoumada — Web App Scope

**Product identity:** Nanoumada is a browser-based AI coding workspace/web application based on Bolt.diy. Its primary output is a web server/UI with code editing, supported model-provider integration and browser preview. It is not a native Android application and is not Nanou Browser's remote browser-agent/MCP service.

- Do not build, sign, install, upload or release an APK unless the owner explicitly changes the task to request native Android work.
- “Run on Android/Termux” means run the web server on the phone and open its URL in the phone's browser; it does not imply an APK or Android-native UI.
- Default acceptance gates: frozen-lockfile dependency install, project tests, typecheck, production web build, and browser/UI/API smoke test where supported.
- Preserve Bolt.diy upstream attribution/license. Keep Nanoumada separate from Nanou Browser, Mada Commander, LudoMada and all other repos, deployments, credentials and CI runner recipes.
- Before editing, inspect the exact repo/branch/SHA and read this scope contract and README. Do not infer platform from a local Termux launcher or a legacy script.

# Bolt.diy Agent Guidelines

## Commands
- Build: `pnpm build`
- Dev: `pnpm dev`
- Test: `pnpm test` (all tests), `pnpm test tests/file.test.ts` (single test)
- Test watch mode: `pnpm test:watch`
- Lint: `pnpm lint`
- Fix linting issues: `pnpm lint:fix`
- Type check: `pnpm typecheck`

## Code Style
- Use absolute imports with `~/` prefix instead of relative imports
- Follow Prettier config: 120 char line width, 2 space indent, single quotes
- Always use semicolons and curly braces for blocks
- Use TypeScript with strict mode enabled
- Use PascalCase for React components, camelCase for functions/variables
- Handle errors with try/catch blocks and provide meaningful error messages
- Follow Unix line endings
- Use arrow functions with proper spacing
- Avoid eval and other unsafe patterns
- Use consistent object/array spacing
- Components should be in .tsx files, utilities in .ts files

## Project Structure
- React components in `app/components/`
- Stores in `app/lib/stores/`
- Utilities in `app/utils/`
- Routes in `app/routes/`