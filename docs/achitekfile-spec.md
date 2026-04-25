# Achitekfile Language Specification

**Version:** 0.1.0

**Status:** Draft

---

## Table of Contents

1. [Introduction](#introduction)
2. [Design Philosophy](#design-philosophy)
3. [Lexical Structure](#lexical-structure)
4. [Grammar Specification](#grammar-specification)
5. [Language Constructs](#language-constructs)
6. [Type System](#type-system)
7. [Validation Rules](#validation-rules)
8. [Dependency System](#dependency-system)
9. [Examples](#examples)
10. [LSP Considerations](#lsp-considerations)
11. [Migration from blueprint.toml](#migration-from-blueprinttoml)
12. [Open Questions](#open-questions)

---

## Introduction

**Achitekfile** is a domain-specific language (DSL) for defining interactive template blueprints in the achitek project scaffolding system. It replaces the previous `blueprint.toml` format with a cleaner, more expressive syntax optimized for IDE integration and Language Server Protocol (LSP) support.

### Goals

- **Clarity**: Easy to read and write for template authors
- **Type Safety**: Strong typing with clear validation rules
- **IDE Support**: Designed from the ground up for autocomplete, diagnostics, and refactoring
- **Expressiveness**: Support complex dependency relationships between prompts
- **Simplicity**: Minimal syntax noise, intuitive structure

### Non-Goals

- General-purpose programming (no loops, functions, or complex control flow)
- Turing-completeness
- Runtime code execution
- Dynamic prompt generation

---

## Design Philosophy

### 1. **Minimal Syntax Noise**
Values don't require quotes unless they contain whitespace or special characters.

```
type = string        # Not: type = "string"
help = "My project"  # Quotes needed for spaces
```

### 2. **Block-Based Structure**
Clear visual hierarchy using `{ }` blocks, inspired by HCL/Terraform.

```
prompt "name" {
  type = string
  help = "Project name"
}
```

### 3. **Type Inference**
Prompt types are identifiers, not strings. The parser knows valid types.

```
type = string        # Parsed as PromptType::String
type = multiselect   # Parsed as PromptType::MultiSelect
```

### 4. **Declarative**
Describe *what* the template needs, not *how* to prompt for it.

### 5. **LSP-First Design**
Every construct is designed to enable rich IDE features:
- Autocomplete for prompt types, attributes
- Go-to-definition for dependency references
- Rename refactoring for prompt identifiers
- Real-time validation and diagnostics

---

## Lexical Structure

### Identifiers

Identifiers are used for prompt names, attribute keys, and function names.

**Syntax:**
```
identifier = letter ( letter | digit | "_" )*
letter     = "a".."z" | "A".."Z"
digit      = "0".."9"
```

**Examples:**
```
project_name
is_binary
features
db_type
```

**Rules:**
- Must start with a letter
- Can contain letters, digits, and underscores
- Case-sensitive
- Cannot be a reserved keyword

**Reserved Keywords:**
```
blueprint, prompt, validate, depends_on, all, any, contains,
type, help, choices, default, required, true, false
```

### String Literals

Strings are enclosed in double quotes and support escape sequences.

**Syntax:**
```
string_literal = '"' ( escape_sequence | any_char_except_quote )* '"'
escape_sequence = '\' ( 'n' | 't' | 'r' | '"' | '\' )
```

**Examples:**
```
"Project name"
"Choose a web framework"
"Must match regex: ^[a-z]+$"
"Line 1\nLine 2"
```

**Escape Sequences:**
- `\n` - Newline
- `\t` - Tab
- `\r` - Carriage return
- `\"` - Double quote
- `\\` - Backslash

### Integers

Non-negative decimal integers.

**Syntax:**
```
integer = digit+
```

**Examples:**
```
1
42
100
```

### Booleans

Boolean literals.

**Syntax:**
```
boolean = "true" | "false"
```

### Arrays

Comma-separated lists enclosed in square brackets.

**Syntax:**
```
array = "[" [ value ( "," value )* ] "]"
value = string_literal | identifier | integer | boolean
```

**Examples:**
```
["option1", "option2", "option3"]
[1, 2, 3]
[true, false]
[]
```

**Rules:**
- Trailing commas are allowed: `["a", "b",]`
- Empty arrays are valid: `[]`
- Mixed types are currently allowed (but may be restricted by semantics)

### Comments

Single-line comments start with `#` and continue to the end of the line.

**Syntax:**
```
comment = "#" any_char* newline
```

**Examples:**
```
# This is a comment
prompt "name" {  # Inline comment
  type = string
}
```

**Note:** Multi-line comments are not supported.

### Whitespace

Whitespace (spaces, tabs, newlines) is generally insignificant except:
- To separate tokens
- Inside string literals

---

## Grammar Specification

### EBNF Grammar

```ebnf
(* Achitekfile Grammar - Extended Backus-Naur Form *)

(* Top-level structure *)
file = blueprint_block, { prompt_block } ;

(* Blueprint metadata block *)
blueprint_block = "blueprint", "{", { blueprint_attribute }, "}" ;

blueprint_attribute = "version", "=", string_literal
                    | "name", "=", string_literal
                    | "description", "=", string_literal
                    | "author", "=", string_literal
                    | "min_achitek_version", "=", string_literal ;

(* Prompt definition block *)
prompt_block = "prompt", string_literal, "{", { prompt_body_item }, "}" ;

prompt_body_item = prompt_attribute | validate_block ;

prompt_attribute = "type", "=", prompt_type
                   | "help", "=", string_literal
                   | "choices", "=", array
                   | "default", "=", value
                   | "required", "=", boolean
                   | "depends_on", "=", dependency_expr ;

prompt_type = "string" | "paragraph" | "bool" | "select" | "multiselect" ;

(* Validation block *)
validate_block = "validate", "{", { validate_attribute }, "}" ;

validate_attribute = "regex", "=", string_literal
                   | "min_length", "=", integer
                   | "max_length", "=", integer
                   | "min_selections", "=", integer
                   | "max_selections", "=", integer ;

(* Dependency expressions *)
dependency_expr = identifier                                    (* Simple reference *)
                | comparison_expr                               (* Equality check *)
                | method_call_expr                              (* Method invocation *)
                | combinator_expr ;                             (* all/any *)

comparison_expr = identifier, ( "==" | "!=" ), literal_value ;

method_call_expr = identifier, ".", method_name, "(", literal_value, ")" ;
method_name = "contains" ;

combinator_expr = combinator_name, "(", dependency_list, ")" ;
combinator_name = "all" | "any" ;
dependency_list = dependency_expr, { ",", dependency_expr } ;

(* Values *)
value = string_literal | boolean | integer | identifier | array ;
literal_value = string_literal | boolean | integer ;
array = "[", [ value, { ",", value } ], "]" ;

(* Primitives *)
identifier = letter, { letter | digit | "_" } ;
string_literal = '"', { char }, '"' ;
boolean = "true" | "false" ;
integer = digit, { digit } ;
```

---

## Language Constructs

### Blueprint Block

The `blueprint` block contains metadata about the template. It must appear exactly once, at the beginning of the file.

**Syntax:**
```
blueprint {
  version = "1.0.0"
  name = "template-name"
  description = "Optional description"
  author = "Optional author"
  min_achitek_version = "0.1.0"
}
```

**Attributes:**

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `version` | String | Yes | Achitekfile format version (semver) |
| `name` | String | Yes | Blueprint identifier (kebab-case recommended) |
| `description` | String | No | Human-readable description |
| `author` | String | No | Template author name or email |
| `min_achitek_version` | String | No | Minimum achitek CLI version required (semver) |

**Validation Rules:**
- Must appear exactly once
- Must be the first block in the file
- `version` must be valid semver: `MAJOR.MINOR.PATCH`
- `name` should match: `^[a-z][a-z0-9-]*$` (kebab-case)

**Example:**
```
blueprint {
  version = "1.0.0"
  name = "rust-binary"
  description = "Rust binary project template with common features"
  author = "achitek-team@example.com"
  min_achitek_version = "0.1.0"
}
```

---

### Prompt Block

The `prompt` block defines an interactive prompt for the user.

**Syntax:**
```
prompt "prompt_name" {
  type = <prompt_type>
  help = "Description text"
  # ... additional attributes

  validate {
    # ... validation rules
  }
}
```

**Attributes:**

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | PromptType | Yes | Type of prompt (see below) |
| `help` | String | Yes | Help text shown to user |
| `choices` | Array[String] | Conditional | Required for `select` and `multiselect` |
| `default` | Type-dependent | No | Default value |
| `required` | Boolean | No | Whether answer is required (default: `true`) |
| `depends_on` | Dependency | No | Conditional display logic |

**Prompt Types:**

1. **`string`** - Single-line text input
2. **`paragraph`** - Multi-line text input (opens editor)
3. **`bool`** - Yes/no confirmation
4. **`select`** - Single choice from a list
5. **`multiselect`** - Multiple choices from a list

**Example:**
```
prompt "project_name" {
  type = string
  help = "Name of your project"
  default = "my-project"
  required = true

  validate {
    regex = "^[a-z][a-z0-9-]*$"
    min_length = 3
    max_length = 50
  }
}
```

---

### Validate Block

The `validate` block specifies validation rules for a prompt. It's optional and appears inside a prompt block.

**Syntax:**
```
validate {
  # Validation attributes
}
```

**Attributes by Prompt Type:**

#### For `string` and `paragraph`:
| Attribute | Type | Description |
|-----------|------|-------------|
| `regex` | String | Regular expression pattern (Rust regex syntax) |
| `min_length` | Integer | Minimum character length |
| `max_length` | Integer | Maximum character length |

#### For `multiselect`:
| Attribute | Type | Description |
|-----------|------|-------------|
| `min_selections` | Integer | Minimum number of selections |
| `max_selections` | Integer | Maximum number of selections |

#### For `select` and `bool`:
No validation attributes currently supported.

**Examples:**
```
# String validation
validate {
  regex = "^[A-Z][a-zA-Z0-9]*$"
  min_length = 3
  max_length = 30
}

# MultiSelect validation
validate {
  min_selections = 1
  max_selections = 3
}
```

---

## Type System

### Prompt Types and Default Values

Each prompt type has specific requirements for `default` values and `choices`.

| Prompt Type | Default Type | Choices Required | Example Default |
|---------------|--------------|------------------|-----------------|
| `string` | String | No | `"my-project"` |
| `paragraph` | String | No | `"# Heading\nContent"` |
| `bool` | Boolean | No | `true` |
| `select` | String (must be in choices) | Yes | `"option1"` |
| `multiselect` | Array[String] (all must be in choices) | Yes | `["opt1", "opt2"]` |

### Type Compatibility Rules

**`string` / `paragraph`:**
```
prompt "name" {
  type = string
  default = "valid"       # ✅ Valid
  default = 42            # ❌ Invalid - must be string
  choices = ["a", "b"]    # ❌ Invalid - choices not allowed
}
```

**`bool`:**
```
prompt "enabled" {
  type = bool
  default = true          # ✅ Valid
  default = false         # ✅ Valid
  default = "true"        # ❌ Invalid - must be boolean
}
```

**`select`:**
```
prompt "framework" {
  type = select
  choices = ["react", "vue", "svelte"]
  default = "react"       # ✅ Valid - in choices
  default = "angular"     # ❌ Invalid - not in choices
}
```

**`multiselect`:**
```
prompt "features" {
  type = multiselect
  choices = ["a", "b", "c"]
  default = ["a", "b"]    # ✅ Valid - all in choices
  default = ["a", "d"]    # ❌ Invalid - "d" not in choices
  default = []            # ✅ Valid - empty selection
}
```

---

## Validation Rules

### Structural Validation

These rules are enforced by the parser and LSP diagnostics:

1. **Blueprint Block**
   - Must appear exactly once
   - Must be the first block in the file
   - Required attributes: `version`, `name`
   - `version` must match semver pattern: `^\d+\.\d+\.\d+$`

2. **Prompt Blocks**
   - Each prompt must have a unique name (no duplicates)
   - Required attributes: `type`, `help`
   - `choices` required for `select` and `multiselect`
   - `choices` must have at least 1 option
   - `choices` must not have duplicates

3. **Validate Blocks**
   - Can only appear inside prompt blocks
   - Validation attributes must match prompt type
   - `min_length` must be ≤ `max_length`
   - `min_selections` must be ≤ `max_selections`
   - `regex` must be valid Rust regex syntax

### Semantic Validation

These rules are enforced after parsing:

1. **Type Compatibility**
   - `default` value must match prompt type (see Type System)
   - `choices` must be array of strings

2. **Dependency Validation**
   - All referenced prompts must exist
   - No circular dependencies allowed
   - Dependency references cannot reference prompts defined later (forward references)

3. **Value Constraints**
   - All integers must be non-negative
   - Regex patterns must compile successfully

---

## Dependency System

The `depends_on` attribute controls conditional prompt display based on previous answers.

### Simple Dependency

Display prompt only if another prompt was answered (and is truthy).

**Syntax:**
```
depends_on = <prompt_name>
```

**Example:**
```
prompt "is_binary" {
  type = bool
  help = "Is this a binary?"
}

prompt "bin_name" {
  type = string
  help = "Binary name"
  depends_on = is_binary  # Only shown if is_binary is true
}
```

**Truthiness Rules:**
- `bool`: `true` is truthy, `false` is falsy
- `string`/`paragraph`: Non-empty string is truthy
- `select`: Any selection is truthy
- `multiselect`: Non-empty array is truthy

---

### Comparison Dependency

Display prompt only if another prompt equals a specific value.

**Syntax:**
```
depends_on = <prompt_name> == <value>
depends_on = <prompt_name> != <value>
```

**Examples:**
```
prompt "framework" {
  type = select
  choices = ["react", "vue", "svelte"]
  help = "Choose framework"
}

prompt "react_version" {
  type = string
  help = "React version"
  depends_on = framework == "react"  # Only shown if React selected
}

prompt "other_framework" {
  type = string
  help = "Specify other"
  depends_on = framework != "react"  # Shown for Vue or Svelte
}
```

---

### Method Call Dependency

For `multiselect` prompts, check if a specific value was selected.

**Syntax:**
```
depends_on = <prompt_name>.contains(<value>)
```

**Example:**
```
prompt "features" {
  type = multiselect
  choices = ["web", "cli", "api"]
  help = "Select features"
}

prompt "web_framework" {
  type = select
  choices = ["axum", "actix"]
  help = "Choose web framework"
  depends_on = features.contains("web")  # Only if "web" selected
}
```

---

### Combinator Dependencies

Combine multiple dependency expressions with `all()` (AND) or `any()` (OR).

**Syntax:**
```
depends_on = all(<expr1>, <expr2>, ...)  # All must be true
depends_on = any(<expr1>, <expr2>, ...)  # At least one must be true
```

**Examples:**
```
# AND: requires both conditions
prompt "advanced_config" {
  type = paragraph
  help = "Advanced settings"
  depends_on = all(is_binary, features.contains("web"))
}

# OR: requires at least one condition
prompt "package_manager" {
  type = select
  choices = ["npm", "yarn", "pnpm"]
  help = "Package manager"
  depends_on = any(
    features.contains("web"),
    features.contains("cli")
  )
}

# Nested combinators
prompt "complex" {
  type = string
  help = "Complex dependency example"
  depends_on = all(
    is_binary,
    any(
      framework == "react",
      framework == "vue"
    )
  )
}
```

---

## Examples

### Minimal Example

```
blueprint {
  version = "1.0.0"
  name = "minimal"
}

prompt "project_name" {
  type = string
  help = "Project name"
}
```

---

### Rust Binary Template

```
blueprint {
  version = "1.0.0"
  name = "rust-binary"
  description = "Rust binary project template"
  author = "achitek-team"
}

prompt "project_name" {
  type = string
  help = "Name of your Rust project"
  default = "my-project"

  validate {
    regex = "^[a-z][a-z0-9_-]*$"
    min_length = 3
    max_length = 50
  }
}

prompt "is_binary" {
  type = bool
  help = "Create a binary (vs library)?"
  default = true
}

prompt "features" {
  type = multiselect
  help = "Select features to include"
  choices = ["logging", "async", "cli", "config"]

  validate {
    min_selections = 1
  }
}

prompt "cli_framework" {
  type = select
  help = "Choose CLI framework"
  choices = ["clap", "structopt", "argh"]
  default = "clap"
  depends_on = features.contains("cli")
}

prompt "async_runtime" {
  type = select
  help = "Choose async runtime"
  choices = ["tokio", "async-std", "smol"]
  default = "tokio"
  depends_on = features.contains("async")
}

prompt "description" {
  type = paragraph
  help = "Project description for Cargo.toml"
  required = false
}
```

---

### Web Application Template

```
blueprint {
  version = "1.0.0"
  name = "web-app"
  description = "Full-stack web application"
}

prompt "app_name" {
  type = string
  help = "Application name"

  validate {
    regex = "^[a-z][a-z0-9-]*$"
    min_length = 2
  }
}

prompt "framework" {
  type = select
  help = "Choose web framework"
  choices = ["axum", "actix-web", "rocket", "warp"]
  default = "axum"
}

prompt "database" {
  type = select
  help = "Choose database"
  choices = ["postgres", "mysql", "sqlite", "none"]
  default = "postgres"
}

prompt "orm" {
  type = select
  help = "Choose ORM/query builder"
  choices = ["diesel", "sea-orm", "sqlx"]
  default = "sqlx"
  depends_on = database != "none"
}

prompt "features" {
  type = multiselect
  help = "Additional features"
  choices = ["auth", "api", "admin", "websockets"]
  required = false
}

prompt "auth_method" {
  type = select
  help = "Authentication method"
  choices = ["jwt", "session", "oauth"]
  default = "jwt"
  depends_on = features.contains("auth")
}

prompt "include_docker" {
  type = bool
  help = "Include Dockerfile and docker-compose?"
  default = true
}
```

---

## LSP Considerations

This section outlines design decisions made to optimize the Achitekfile format for Language Server Protocol implementation.

### Design Decisions for LSP

1. **Explicit String Literals for Prompt Names**
   - Prompt names are strings: `prompt "name" { }`
   - **Rationale:** Easier to parse, clear distinction between identifiers and prompt names
   - **LSP Benefit:** Rename refactoring is straightforward (quoted strings)

2. **Identifiers for Types**
   - Types are identifiers: `type = string` (not `"string"`)
   - **Rationale:** Enables autocomplete with fixed set of options
   - **LSP Benefit:** Can suggest valid types, catch typos instantly

3. **Block-Based Structure**
   - Nested blocks for validation, not flat attributes
   - **Rationale:** Clear scope boundaries, easier to parse incrementally
   - **LSP Benefit:** Document outline/symbols work naturally

4. **Dependency Expression Syntax**
   - Function-call style: `all(a, b)` not `a && b`
   - **Rationale:** Simpler to parse, no operator precedence issues
   - **LSP Benefit:** Easier to provide go-to-definition for dependency references

### LSP Features Enabled by This Design

#### Autocomplete
- Prompt types: `string`, `paragraph`, `bool`, `select`, `multiselect`
- Attributes: `type`, `help`, `choices`, `default`, `required`, `depends_on`
- Validation attributes: context-aware based on prompt type
- Dependency functions: `all()`, `any()`, `.contains()`

#### Go-to-Definition
- From `depends_on = other_prompt` → jump to `prompt "other_prompt" { }`
- From dependency in `all()` → jump to prompt definition

#### Find All References
- From prompt definition → find all `depends_on` usages
- From prompt definition → find all template variable usages (`.tera` files)

#### Rename Refactoring
- Rename prompt → update all dependency references
- Rename prompt → update all template references

#### Diagnostics
- Undefined prompt reference in `depends_on`
- Circular dependency detection
- Type mismatch (`default` doesn't match `type`)
- Missing required attributes
- Invalid regex patterns
- Duplicate prompt names

#### Hover Documentation
- Hover over prompt reference → show `help` text, type, choices
- Hover over prompt type → show documentation
- Hover over attribute → show expected type and description

#### Document Symbols
- Outline view showing all prompts
- Blueprint metadata
- Validation rules per prompt

---

## Migration from blueprint.toml

This section provides a comprehensive guide for migrating from the legacy `blueprint.toml` TOML format to the new Achitekfile DSL.

### Key Differences

| Feature | blueprint.toml | Achitekfile |
|---------|----------------|-----------|
| **Format** | TOML | Custom DSL |
| **Extension** | `.toml` | No extension (like Dockerfile) |
| **Metadata** | Not supported | `blueprint { }` block |
| **Prompt syntax** | `[prompt_name]` | `prompt "name" { }` |
| **Type syntax** | `type = "string"` | `type = string` |
| **Dependency** | `depends_on = "q:val"` | `depends_on = q == "val"` |
| **Complex deps** | `{all = [...]}` | `all(...)` |
| **Validation** | Not supported | `validate { }` block |

### Migration Examples

#### Before (blueprint.toml):
```toml
[project]
type = "string"
help = "Name of project"

[binary]
type = "bool"
help = "Is project a binary"

[target]
type = "string"
help = "Compilation targets"
choices = ["x86_64-apple-darwin", "aarch64-apple-darwin"]
```

#### After (Achitekfile):
```
blueprint {
  version = "1.0.0"
  name = "my-template"
}

prompt "project" {
  type = string
  help = "Name of project"
}

prompt "binary" {
  type = bool
  help = "Is project a binary"
}

prompt "target" {
  type = select
  help = "Compilation targets"
  choices = ["x86_64-apple-darwin", "aarch64-apple-darwin"]
}
```

### Dependency Migration

#### Before (simple):
```toml
[bin_name]
type = "string"
help = "Binary name"
depends_on = "is_binary:true"
```

#### After (simple):
```
prompt "bin_name" {
  type = string
  help = "Binary name"
  depends_on = is_binary == true
}
```

#### Before (AND logic):
```toml
[advanced]
type = "string"
help = "Advanced config"
depends_on = {all = ["is_binary:true", "features:web"]}
```

#### After (AND logic):
```
prompt "advanced" {
  type = string
  help = "Advanced config"
  depends_on = all(
    is_binary == true,
    features.contains("web")
  )
}
```

### Automated Migration Tool

A migration tool `achitek migrate` should be implemented to automate conversion:

```bash
achitek migrate templates/my-template/blueprint.toml
# Outputs: templates/my-template/Achitekfile
```

The tool should:
1. Parse the old `blueprint.toml` format
2. Generate a `blueprint { }` block with default metadata
3. Convert each TOML section to a `prompt { }` block
4. Transform dependency syntax
5. Add a comment at the top: `# Migrated from blueprint.toml`
6. Warn about any manual changes needed

---

## Open Questions

These are design decisions that need resolution before finalizing the specification:

### 1. Filename Convention

**Options:**
- **A.** `Achitekfile` (no extension, like Dockerfile) - Recommended
- **B.** `Achitekfile.achitek` (with extension)
- **C.** `blueprint.achitek` (keep "blueprint" name)
- **D.** Keep `blueprint.toml` but use new DSL syntax

**Trade-offs:**
- **A** is clean, follows Docker/Makefile convention, easy to find
- **B** is explicit, better for file associations, but verbose
- **C** maintains continuity with old name
- **D** is confusing (TOML extension but not TOML syntax)

**Recommendation:** **A** (`Achitekfile` with no extension)

---

### 2. Type Identifier Casing

**Options:**
- **A.** Lowercase: `string`, `multiselect` - Recommended
- **B.** PascalCase: `String`, `MultiSelect`
- **C.** Snake_case: `multi_select`

**Trade-offs:**
- **A** is common in configs (HCL, Terraform), easy to type
- **B** follows Rust type conventions
- **C** is Rust idiomatic but verbose

**Recommendation:** **A** (lowercase, no underscores)

---

### 3. Dependency Syntax for Simple Truthiness

When checking if a boolean prompt is true, should we require explicit comparison?

**Options:**
- **A.** Implicit: `depends_on = is_binary` (truthy check) - Recommended
- **B.** Explicit: `depends_on = is_binary == true` (required)

**Trade-offs:**
- **A** is concise, common pattern
- **B** is explicit, less magic

**Current Spec:** **A** (implicit truthiness)

**Should we change this?** Let's discuss.

---

### 4. Array Trailing Commas

Should trailing commas be allowed in arrays?

**Options:**
- **A.** Allow: `choices = ["a", "b", "c",]` - Recommended
- **B.** Forbid: `choices = ["a", "b", "c"]`

**Trade-offs:**
- **A** is diff-friendly, common in modern languages
- **B** is stricter, simpler to parse

**Recommendation:** **A** (allow trailing commas)

---

### 5. Prompt Name Restrictions

Should prompt names be restricted to specific patterns?

**Options:**
- **A.** Allow any valid identifier: `project_name`, `projectName`, `ProjectName`
- **B.** Enforce snake_case: `project_name` only - Recommended
- **C.** Enforce kebab-case: `project-name` (not valid identifier)

**Trade-offs:**
- **A** is flexible but inconsistent
- **B** is Rust idiomatic, enforces consistency
- **C** requires prompt names to be strings, not identifiers in dependencies

**Recommendation:** **B** (enforce snake_case via linter/LSP warning)

---

### 6. Default Values - Explicit vs Implicit

Should `required = true` be the default, or should we infer from `default`?

**Options:**
- **A.** Explicit: Always specify `required = true/false` - Recommended
- **B.** Implicit: If `default` exists, `required = false` automatically

**Trade-offs:**
- **A** is explicit, no magic
- **B** is concise, but may surprise users

**Recommendation:** **A** (explicit `required` attribute, defaults to `true`)

---

### 7. Multiselect Default Value - Empty Array

Should empty array `[]` be a valid default for multiselect?

**Options:**
- **A.** Allow: `default = []` means no selections - Recommended
- **B.** Forbid: Must select at least one default

**Trade-offs:**
- **A** is flexible, allows "select none"
- **B** forces user to make a choice

**Recommendation:** **A** (allow empty array)

---

### 8. Comments - Multi-line Support?

Should we support multi-line comments like `/* */`?

**Options:**
- **A.** Only single-line: `#` - Recommended
- **B.** Add multi-line: `/* ... */`

**Trade-offs:**
- **A** is simpler to parse, sufficient for configs
- **B** is nice for long explanations, but rare in configs

**Recommendation:** **A** (single-line `#` only)

---

## Appendix: Reserved Keywords

The following identifiers are reserved and cannot be used as prompt names:

```
blueprint
prompt
validate
depends_on
type
help
choices
default
required
all
any
contains
true
false
version
name
description
author
min_achitek_version
regex
min_length
max_length
min_selections
max_selections
```

---

## Appendix: MIME Type and File Associations

- **MIME Type:** `text/x-achitekfile` (proposed)
- **File Extension:** None (filename is exactly `Achitekfile`)
- **File Pattern for LSP:** `**/Achitekfile`
- **Language ID for LSP:** `achitekfile`

---

## Appendix: Error Message Guidelines

LSP diagnostics should follow these guidelines for clarity:

### Error Format
```
error[E001]: <short description>
  --> Achitekfile:10:5
   |
10 |   type = strng
   |          ^^^^^ unknown type 'strng', did you mean 'string'?
   |
   = help: valid types are: string, paragraph, bool, select, multiselect
```

### Error Codes

| Code | Description |
|------|-------------|
| E001 | Unknown prompt type |
| E002 | Missing required attribute |
| E003 | Invalid attribute for type |
| E004 | Type mismatch (default/choices) |
| E005 | Undefined prompt reference |
| E006 | Circular dependency detected |
| E007 | Duplicate prompt name |
| E008 | Invalid regex pattern |
| E009 | Invalid value range (min > max) |
| E010 | Blueprint block missing |
| E011 | Multiple blueprint blocks |

---

**End of Specification**

**Version History:**
- 1.0.0 (2026-04-19): Initial draft specification
