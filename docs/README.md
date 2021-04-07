# Racket Interpreter Developer Documentation

This document is intended for developers. It has been written in the hope that it might help future developers navigate through Racket Interpreter's source code.

Racket Interpreter takes Racket code, interpretes it as Javascript, and runs it.

The project has several [Entrypoints](#entrypoints), which use underlying functionality from the [](#Backend).

# Entrypoints

[compiler](#compiler)
[evaluator](#evaluator)
[repl](#repl)

# Backend

[sexpr](#sexpr)
[reader](#reader)
[printer](#printer)
[environment](#environment)
[modules](#modules)

[testing](#testing)
[typings](#typings)
[utils](#utils)

[fep-types](#fep-types.ts)
[host](#host.ts)
[ts](#index.ts)
[pattern](#pattern)
