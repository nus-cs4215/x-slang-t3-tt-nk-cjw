; // magic file that's simultaneously a racket module and a typescript module
; const contents = `
(module queue '#%builtin-kernel
  (#%require /libs/racket/private/and-or)
  (#%require /libs/racket/private/cond)
  ; Implements a queue data structure

  ; we provide
  ;   make-queue
  ; which constructs an opaque queue object
  ;   queue-empty?,
  ;   enqueue!,
  ;   dequeue!
  ; which operate (imperatively) on the queue.

  ; internally,
  ; a queue is a function that takes in 2 arguments
  ; the first argument is the command name,
  ; which is either the symbol
  ;   queue-empty?, enqueue!, or dequeue!.
  ;
  ; if the command name was queue-empty?,
  ; the second argument is ignored,
  ; and the function returns #t if the queue is empty
  ; and false otherwise.
  ;
  ; if the command name was enqueue,
  ; the second argument contains the value to put on the queue,
  ; and the function returns the value that was just pushed.
  ;
  ; if the commannd name was dequeue,
  ; the second argument is ignored,
  ; and the function returns the dequeued value if successful, and errors otherwise.

  ; i'm sick of writing #%plain-lambda this should be in a library...
  (define-syntax lambda
    (#%plain-lambda (stx) (cons '#%plain-lambda (cdr stx))))

  (define make-queue
    (lambda ()
      (define queue-front '())
      (define queue-back '())

      (define shift-queue
        (lambda ()
          (if (null? queue-front)
            #t
            (begin
              (set! queue-back (cons (car queue-front) queue-back))
              (set! queue-front (cdr queue-front))
              (shift-queue)
              ))))

      (define queue-empty?
        (lambda ()
          (and (null? queue-front)
               (null? queue-back))))

      (define enqueue!
        (lambda (data)
          (set! queue-front (cons data queue-front))
          data))

      (define dequeue!
        (lambda ()
          (if (null? queue-back)
            (shift-queue)
            #t)
          (begin0
            (car queue-back)
            (set! queue-back (cdr queue-back)))))

      (lambda (command data)
        (cond
          [(symbol=? command 'queue-empty?) (queue-empty?)]
          [(symbol=? command 'enqueue!) (enqueue! data)]
          [(symbol=? command 'dequeue!) (dequeue!)]
          ))
      ))

  (define queue-empty?
    (lambda (queue)
      (queue 'queue-empty? #t)))

  (define enqueue!
    (lambda (queue data)
      (queue 'enqueue! data)))

  (define dequeue!
    (lambda (queue)
      (queue 'dequeue! #t)))

  (#%provide make-queue enqueue! queue-empty? dequeue!)

  )
; `
; exports.default = contents
; exports.contents = contents

