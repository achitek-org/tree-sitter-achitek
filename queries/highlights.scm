; Keywords
[
  "blueprint"
  "prompt"
  "validate"
] @keyword

(string_literal) @string
(integer) @number
(boolean) @boolean
(comment) @comment

(blueprint_attribute_key) @property
(question_type) @type.builtin
(method_name) @function.method
(combinator_name) @function.builtin

(prompt_block
  name: (string_literal) @string.special)

(identifier) @variable
