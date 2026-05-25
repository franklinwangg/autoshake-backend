# AutoShake Coding Standards

## General Principles

- Prioritize readability and maintainability over brevity
- Use descriptive names; avoid unnecessary abbreviations except obvious cases like `num` or `diff`
- Avoid magic numbers — extract them into constants
- Reuse shared logic through functions/utilities instead of duplicating code
- Use parentheses when operation order may be unclear
- Use early returns for validation and error handling
- Keep clear visual separation between logical sections of code

## Naming Conventions

### General

- Constants → `CONSTANT_CASE`
- File names → `camelCase`
- Test files (TS) → `functionName_givenCondition_returnsExpected`

### TypeScript

- Variables → `camelCase`
- Functions → `PascalCase`

## File Organization

Preferred file order:

1. Imports
2. Constants
3. Enums
4. Main/public functions
5. Helper/private functions
6. Classes/subclasses
