/**
 * @file Tree-sitter grammar for Achitekfile
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'achitekfile',

  word: $ => $.identifier,

  extras: $ => [
    /\s/,
    $.comment,
  ],

  rules: {
    file: $ => seq(
      $.blueprint_block,
      repeat($.prompt_block),
    ),

    blueprint_block: $ => seq(
      'blueprint',
      '{',
      repeat($.blueprint_attribute),
      '}',
    ),

    blueprint_attribute: $ => seq(
      field('key', $.blueprint_attribute_key),
      '=',
      field('value', $.string_literal),
    ),

    blueprint_attribute_key: $ => choice(
      'version',
      'name',
      'description',
      'author',
      'min_achitek_version',
    ),

    prompt_block: $ => seq(
      'prompt',
      field('name', $.string_literal),
      '{',
      repeat(choice(
        $.question_attribute,
        $.validate_block,
      )),
      '}',
    ),

    question_attribute: $ => choice(
      $.type_attribute,
      $.help_attribute,
      $.choices_attribute,
      $.default_attribute,
      $.required_attribute,
      $.depends_on_attribute,
    ),

    type_attribute: $ => seq(
      'type',
      '=',
      field('value', $.question_type),
    ),

    help_attribute: $ => seq(
      'help',
      '=',
      field('value', $.string_literal),
    ),

    choices_attribute: $ => seq(
      'choices',
      '=',
      field('value', $.array),
    ),

    default_attribute: $ => seq(
      'default',
      '=',
      field('value', $.value),
    ),

    required_attribute: $ => seq(
      'required',
      '=',
      field('value', $.boolean),
    ),

    depends_on_attribute: $ => seq(
      'depends_on',
      '=',
      field('value', $.dependency_expr),
    ),

    question_type: $ => choice(
      'string',
      'paragraph',
      'bool',
      'select',
      'multiselect',
    ),

    validate_block: $ => seq(
      'validate',
      '{',
      repeat($.validate_attribute),
      '}',
    ),

    validate_attribute: $ => choice(
      $.regex_attribute,
      $.min_length_attribute,
      $.max_length_attribute,
      $.min_selections_attribute,
      $.max_selections_attribute,
    ),

    regex_attribute: $ => seq(
      'regex',
      '=',
      field('value', $.string_literal),
    ),

    min_length_attribute: $ => seq(
      'min_length',
      '=',
      field('value', $.integer),
    ),

    max_length_attribute: $ => seq(
      'max_length',
      '=',
      field('value', $.integer),
    ),

    min_selections_attribute: $ => seq(
      'min_selections',
      '=',
      field('value', $.integer),
    ),

    max_selections_attribute: $ => seq(
      'max_selections',
      '=',
      field('value', $.integer),
    ),

    dependency_expr: $ => choice(
      $.simple_dependency,
      $.comparison_dependency,
      $.method_call_dependency,
      $.combinator_dependency,
    ),

    simple_dependency: $ => field('reference', $.identifier),

    comparison_dependency: $ => seq(
      field('left', $.identifier),
      field('operator', choice('==', '!=')),
      field('right', $.literal_value),
    ),

    method_call_dependency: $ => seq(
      field('receiver', $.identifier),
      '.',
      field('method', $.method_name),
      '(',
      field('argument', $.literal_value),
      ')',
    ),

    method_name: $ => 'contains',

    combinator_dependency: $ => seq(
      field('name', $.combinator_name),
      '(',
      field('arguments', $.dependency_list),
      ')',
    ),

    combinator_name: $ => choice('all', 'any'),

    dependency_list: $ => seq(
      $.dependency_expr,
      repeat(seq(',', $.dependency_expr)),
      optional(','),
    ),

    value: $ => choice(
      $.string_literal,
      $.boolean,
      $.integer,
      $.identifier,
      $.array,
    ),

    literal_value: $ => choice(
      $.string_literal,
      $.boolean,
      $.integer,
    ),

    array: $ => seq(
      '[',
      optional($.value_list),
      ']',
    ),

    value_list: $ => seq(
      $.value,
      repeat(seq(',', $.value)),
      optional(','),
    ),

    identifier: _ => /[a-zA-Z][a-zA-Z0-9_]*/,

    string_literal: $ => seq(
      '"',
      repeat(choice(
        token.immediate(prec(1, /[^"\\\n]+/)),
        $.escape_sequence,
      )),
      '"',
    ),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice('n', 't', 'r', '"', '\\'),
    )),

    integer: _ => /\d+/,

    boolean: _ => choice('true', 'false'),

    comment: _ => token(seq('#', /.*/)),
  },
});
