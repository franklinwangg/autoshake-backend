# Terminal Commands

## Build Commands

### Production Build
```bash
npm run build
```
Builds the extension for production with `DEBUG_GRAPHQL_VIEW=false`. GraphQL debug code is completely eliminated from the bundle.

### Debug Build
```bash
npm run build:debug
```
Builds the extension with `DEBUG_GRAPHQL_VIEW=true`. Includes all GraphQL debug UI and responses.

### Watch Mode
```bash
npm run watch
```
Watches for file changes and rebuilds automatically with `DEBUG_GRAPHQL_VIEW=true` for development.

## Test Commands

### Run Tests Once
```bash
npm run test:run
```
Runs the test suite once using Vitest.

### Run Tests with Verbose Output
```bash
npm run test:run --verbose
```
Runs the test suite once with verbose logging for detailed test information.
