; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module syntax-case '#%builtin-kernel
  ; Implements syntax-case raw-syntax-case (pattern matching + un-matching)
  ;            pattern-match pattern-unmatch (applying patterns)
  ;            make-cons-pattern make-datum-pattern make-var-pattern make-star-pattern make-plus-pattern (constructing patterns)
  ;            pattern-parse (constructing patterns more easily)
  ; (raw-syntax-case is the composition of pattern-match and pattern-unmatch basically)
  ; (and syntax-case is the composition of pattern-parse and raw-syntax-case   )

  (#%require
   /libs/racket/private/and-or
   /libs/racket/private/car-et-al
   /libs/racket/private/cond
   /libs/racket/private/dict
   /libs/racket/private/let
   /libs/racket/private/quasiquote
   /libs/racket/private/queue
   )

  (#%provide syntax-case raw-syntax-case)
  (#%provide pattern-match pattern-unmatch)
  (#%provide make-cons-pattern make-datum-pattern make-var-pattern make-star-pattern make-plus-pattern)
  (#%provide pattern-parse)
  (#%provide test-result)
  (define test-result 5)

  ; (raw-syntax-case is the composition of pattern-match and pattern-unmatch basically)
  ; (and syntax-case is the composition of pattern-parse and raw-syntax-case   )

  ; pattern-parse takes in an sexpr
  ; and replaces the following constructs
  ; with their corresponding pattern objects.
  ;   (something ... . rest)  --> (make-star-pattern something rest)
  ;   (something ...+ . rest) --> (make-plus-pattern something rest)
  ;   (lhs . rhs)             --> (make-cons-pattern lhs rhs)
  ;   'some-symbol            --> (make-datum-pattern 'some-symbol)
  ;   some-symbol             --> (make-var-pattern  'some-symbol)
  ;   other-datum             --> (make-datum-pattern other-datum)
  ; The typescript implementation...
  ; uses paattern matching to do this.
  ; Yes.
  ; The typescript implementation uses pattern matching
  ; to implement pattern parsing,
  ; a preprocessing step before pattern matching.
  ;
  ; We shall do the same.

  (define-syntax lambda
    (#%plain-lambda (stx) (cons '#%plain-lambda (cdr stx))))

  (define make-match-object
    (lambda ()
      (make-dict)))

  (define match-object-has?
    (lambda (match-object var-name)
      (and (dict-has-key? match-object var-name)
           (not (queue-empty? (dict-ref match-object var-name))))))

  (define match-object-enqueue!
    (lambda (match-object var-name matched-expr)
      (if (dict-has-key? match-object var-name)
        (enqueue! (dict-ref match-object var-name) matched-expr)
        (let [(new-queue (make-queue))]
          (enqueue! new-queue matched-expr)
          (dict-set! match-object var-name new-queue)))))

  (define match-object-dequeue!
    (lambda (match-object var-name)
      (dequeue! (dict-ref match-object var-name))))

  ; A pattern object is a list-structure constructed with the constructors
  ;   datum-pattern, var-pattern, cons-pattern, star-pattern, make-plus-pattern
  ; and nothing else.
  ; if you attempt to use the matching library with a non-pattern, expect crashes.

  (define make-datum-pattern
    (lambda (datum)
      ~(datum ,datum)))

  (define make-var-pattern
    (lambda (var-name)
      ~(var ,var-name)))

  (define make-cons-pattern
    (lambda (lhs-pattern rhs-pattern)
      ~(cons ,lhs-pattern ,rhs-pattern)))

  (define make-star-pattern
    (lambda (repeat-pattern tail-pattern)
      ~(star ,repeat-pattern ,tail-pattern)))

  (define make-plus-pattern
    (lambda (repeat-pattern tail-pattern)
      ~(plus ,repeat-pattern ,tail-pattern)))

  ; pattern-match will take in an expression and a pattern
  ; and return a pair of a boolean indicating success
  ; and the match object if the match succeeded.

  (define pattern-match
    (lambda (expr pattern)
      (define match-object (make-match-object))
      (define match_
        (lambda (expr pattern)
          (define pattern-type (car pattern))
          (cond
            [(symbol=? pattern-type 'datum)
             (eq? expr (cadr pattern))]

            [(symbol=? pattern-type 'var)
             (begin
               (match-object-enqueue! match-object (cadr pattern) expr)
               #t
               )]

            [(symbol=? pattern-type 'cons)
             (and (cons? expr)
                  (match_ (car expr) (cadr pattern))
                  (match_ (cdr expr) (caddr pattern)))]

            [(symbol=? pattern-type 'star)
             (if (and (cons? expr)
                      (match_ (car expr) (cadr pattern)))
               (match_ (cdr expr) pattern)
               (match_ expr (caddr pattern)))]

            [(symbol=? pattern-type 'plus)
             (and (cons? expr)
                  (match_ (car expr) (cadr pattern))
                  (match_ (cdr expr) (cons 'star (cdr pattern))))]

            )))
      (cons (match_ expr pattern) match-object)))

  ; pattern-unmatch will take in a match object and a pattern
  ; and return a pair of a boolean indicating success
  ; and the sexpr if the unmatch succeeded.

  (define pattern-unmatch
    (lambda (match-object pattern)
      (define pattern-type (car pattern))
      (cond
        [(symbol=? pattern-type 'datum)
         (cons #t (cadr pattern))]

        [(symbol=? pattern-type 'var)
         (if (match-object-has? match-object (cadr pattern))
           (cons #t (match-object-dequeue! match-object (cadr pattern)))
           (cons #f #f))]

        [(symbol=? pattern-type 'cons)
         (let [(lhs-unmatch (pattern-unmatch match-object (cadr pattern)))]
           (if (car lhs-unmatch)
             (let [(rhs-unmatch (pattern-unmatch match-object (caddr pattern)))]
               (if (car rhs-unmatch)
                 (cons #t (cons (cdr lhs-unmatch) (cdr rhs-unmatch)))
                 (cons #f #f)))
             (cons #f #f)))]

        [(symbol=? pattern-type 'star)
         (let [(rep-unmatch (pattern-unmatch match-object (cadr pattern)))]
           (if (car rep-unmatch)
             (let [(again-unmatch (pattern-unmatch match-object pattern))]
               (cons (and (car rep-unmatch) (car again-unmatch))
                     (cons (cdr rep-unmatch) (cdr again-unmatch))))
             (pattern-unmatch match-object (caddr pattern))))]

        [(symbol=? pattern-type 'plus)
         (let [(lhs-unmatch (pattern-unmatch match-object (cadr pattern)))]
           (if (car lhs-unmatch)
             (let [(rhs-unmatch (pattern-unmatch match-object (cons 'star (cdr pattern))))]
               (if (car rhs-unmatch)
                 (cons #t (cons (cdr lhs-unmatch) (cdr rhs-unmatch)))
                 (cons #f #f)))
             (cons #f #f)))]

        )
      ))

  ; (raw-syntax-case input-expr [pattern-object unpattern-object] . rest-cases)
  ; expands to
  ; (let* ([input          input-expr]
  ;        [match-result   (pattern-match input pattern-object)]
  ;        [match-success? (car match-result)]
  ;        [match-object   (cdr match-result)])
  ;   (if match-success?
  ;     (cdr (pattern-unmatch match-object unpattern-object))
  ;     (raw-syntax-case input . rest-cases)))
  ;
  ; (raw-syntax-case input-expr)
  ; expands to
  ; 'no-match
  (define-syntax raw-syntax-case
    (lambda (raw-syntax-case+stx)
      (define input-expr (cadr raw-syntax-case+stx))
      (define cases (cddr raw-syntax-case+stx))
      (if (null? cases)
        ''no-match
        (let ([case             (car cases)]
              [rest-cases       (cdr cases)])
          ~(let ([r-s-c-input__          ,input-expr])
             (let ([r-s-c-match-result__   (pattern-match r-s-c-input__ ,(car case))])
               (let ([r-s-c-match-success? (car r-s-c-match-result__)]
                     [r-s-c-match-object   (cdr r-s-c-match-result__)])
                 (if r-s-c-match-success?
                   (cdr (pattern-unmatch r-s-c-match-object ,(cadr case)))
                   (raw-syntax-case r-s-c-input__ . ,rest-cases)))))
          ))))

  (define star-spec-pattern
    (make-cons-pattern (make-var-pattern 'repeat-pattern) (make-cons-pattern (make-datum-pattern '...) (make-var-pattern 'tail-pattern)))
    )
  (define star-unpattern
    (make-cons-pattern (make-datum-pattern 'star) (make-cons-pattern (make-var-pattern 'repeat-pattern) (make-cons-pattern (make-var-pattern 'tail-pattern) (make-datum-pattern '()))))
    )
  (define plus-spec-pattern
    (make-cons-pattern (make-var-pattern 'repeat-pattern) (make-cons-pattern (make-datum-pattern '...+) (make-var-pattern 'tail-pattern)))
    )
  (define plus-unpattern
    (make-cons-pattern (make-datum-pattern 'plus) (make-cons-pattern (make-var-pattern 'repeat-pattern) (make-cons-pattern (make-var-pattern 'tail-pattern) (make-datum-pattern '()))))
    )
  (define literal-spec-pattern
    (make-cons-pattern (make-datum-pattern 'quote) (make-cons-pattern (make-var-pattern 'datum-value) (make-datum-pattern '())))
    )
  (define literal-unpattern
    (make-cons-pattern (make-datum-pattern 'datum) (make-cons-pattern (make-var-pattern 'datum-value) (make-datum-pattern '())))
    )
  (define anything-pattern
    (make-var-pattern 'anything)
    )
  (define anything-unpattern
    (make-cons-pattern (make-datum-pattern 'anything) (make-cons-pattern (make-var-pattern 'anything) (make-datum-pattern '())))
    )

  (define pattern-parse
    (lambda (pattern-spec)
      (define outer-parse
        (raw-syntax-case pattern-spec
          [star-spec-pattern star-unpattern]
          [plus-spec-pattern plus-unpattern]
          [literal-spec-pattern literal-unpattern]
          [anything-pattern anything-unpattern]
          ))
      (define match-type (car outer-parse))
      (cond
        ; (repeat-pattern ... . tail-patttern)
        [(symbol=? match-type 'star) ~(star ,(pattern-parse (cadr outer-parse)) ,(pattern-parse (caddr outer-parse)))]
        ; (repeat-pattern ...+ . tail-patttern)
        [(symbol=? match-type 'plus) ~(plus ,(pattern-parse (cadr outer-parse)) ,(pattern-parse (caddr outer-parse)))]
        ; 'something
        [(symbol=? match-type 'datum) outer-parse]
        ; we couldn't detect the right spec from a simple pattern matching
        ; (lhs . rhs)
        [(cons? pattern-spec) (make-cons-pattern (pattern-parse (car pattern-spec)) (pattern-parse (cdr pattern-spec)))]
        ; some-symbol
        [(symbol? pattern-spec) (make-var-pattern pattern-spec)]
        ; other-datum
        [#t (make-datum-pattern pattern-spec)])
      ))

  (define-syntax syntax-case
    (lambda (syntax-case+stx)
      (define input-expr (cadr syntax-case+stx))
      (define cases (cddr syntax-case+stx))
      (if (null? cases)
        ''no-match
        (let ([case             (car cases)]
              [rest-cases       (cdr cases)])
          (let ([parsed-pattern   (pattern-parse (car case))]
                [parsed-unpattern (pattern-parse (cadr case))])
            ~(let ([s-c-input__ ,input-expr])
               (let ([s-c-match-result__ (pattern-match s-c-input__ ',parsed-pattern)])
                 (let ([s-c-match-success? (car s-c-match-result__)]
                       [s-c-match-object   (cdr s-c-match-result__)])
                   (if s-c-match-success?
                     (cdr (pattern-unmatch s-c-match-object ',parsed-unpattern))
                     (syntax-case s-c-input__ . ,rest-cases)))))
            )))))

  )
; `
; exports.default = contents
; exports.contents = contents

