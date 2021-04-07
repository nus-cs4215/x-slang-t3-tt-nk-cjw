# Racket Interpreter Developer Documentation

This document is intended for developers. It has been written in the hope that it might help future developers navigate through Racket Interpreter's source code.

Racket Interpreter takes Racket code, interpretes it as Javascript, and runs it.

The project has several [Entrypoints](#entrypoints), which use underlying functionality from the [Backend](#Backend).

# Entrypoints

## [Compiler](Compiler.md)

<insert dependency diagram>

Compiler to compile Syntax to Fully Expanded Programs (FEP) using Syntax-transformers.

## [Evaluator](Evaluator.md)

<insert dependency diagram>

Evaluator for Racket programs.

## [Repl](Repl.md)

<insert dependency diagram>

A CLI tool for running `*.rkt` files.

# Backend

## [sexpr](sexpr)

Specification and utilities for sexprs.

## [reader](reader)

Parsing utilities.

## [printer](printer)

Printing utilities.

## [environment](environment)

## [modules](modules)

Racket libraries.

## [typings](typings)

TODO: What does this do

## [fep-types](fep-types)

Specification of a fully expanded program.

## [host](host)

TODO: What does this do

## [pattern](pattern)

Pattern matching utilies for developers.
