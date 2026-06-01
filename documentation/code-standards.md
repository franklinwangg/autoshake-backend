# AutoShake Coding Standards



## General Principles

* Prioritize readability and maintainability over brevity
* Use descriptive names; avoid unnecessary abbreviations except obvious cases like `num` or `diff`
* Avoid magic numbers — extract them into constants
* Reuse shared logic through functions/utilities instead of duplicating code
* Use parentheses when operation order may be unclear
* Use early returns for validation and error handling
* Keep clear visual separation between logical sections of code





## Naming Conventions



### General

|Item|Convention|
|-|-|
|Constants|CONSTANT\_CASE|
|File names|camelCase|
|Test files (TS)|functionName\_givenCondition\_returnsExpected|

### 

### TypeScript

|Item|Convention|
|-|-|
|Variables|camelCase|
|Functions|PascalCase|

### 

### Python

|Item|Convention|
|-|-|
|Modules/files|snake\_case|
|Classes|PascalCase|
|Functions/variables|snake\_case|
|Constants|UPPER\_SNAKE\_CASE|
|Tests|test\_methodName\_scenario\_expectedBehavior|

\---

## File Organization

Preferred file order:

1. Imports
2. Constants
3. Enums
4. Main/public functions
5. Helper/private functions
6. Classes/subclasses

\---

## Imports

Import order:

1. Standard library
2. Third-party packages
3. Local modules
* Separate each group with one blank line
* Use relative imports within packages
* Never use `sys.path.insert` hacks except at true entry points

\---

## Functions

* Type annotate Python parameters and return values whenever possible
* Use strict TypeScript typing whenever possible
* Avoid the `any` type unless absolutely necessary
* Keep functions focused on a single responsibility
* Never use mutable default arguments in Python

\---

## Controllers / API Design

Controllers **should**:

* Validate requests
* Delegate business logic to services
* Return responses

Controllers **should not**:

* Contain business logic
* Run ML pipelines directly
* Handle orchestration workflows

\---

### FastAPI Standards

* Use `APIRouter`
* Mount routers in `main.py`
* Raise `HTTPException` with explicit `status\_code` and `detail`

\---

## Error Handling

* Only catch exceptions you can meaningfully handle
* Never silently swallow exceptions
* Avoid broad `except Exception` usage
* Let unexpected errors propagate naturally
* Bad: except Exception: pass

\---

## Testing

* Tests must be independently runnable
* Mock only at external boundaries
* Keep tests focused on one logical behavior
* Multiple assertions are acceptable if they validate the same behavior

\---

## Formatting

### Python

|Rule|Value|
|-|-|
|Indentation|4 spaces|
|Line limit|100 characters|
|Between top-level definitions|2 blank lines|
|Between methods|1 blank line|



