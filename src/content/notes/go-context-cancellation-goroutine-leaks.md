---
title: "select, context, and the goroutine leak you'll ship anyway"
date: 2026-02-24
summary: "The classic Go concurrency bug isn't a data race — it's a goroutine that blocks forever on a send no one will ever receive. A look at why it happens and the patterns that prevent it."
tags: ["go", "concurrency", "gotchas"]
draft: true
---

Go makes spinning up a goroutine so cheap that the real cost shows up later: the ones that never exit. No panic, no race detector warning — just a slow climb in goroutine count and memory until something falls over. Here's the canonical version and how to stop writing it.

## The leak

A worker sends its result on a channel:

```go
func fetch(ctx context.Context, url string) (Result, error) {
    ch := make(chan Result, 0) // unbuffered

    go func() {
        r := doSlowWork(url) // can't be cancelled
        ch <- r              // blocks until someone receives
    }()

    select {
    case r := <-ch:
        return r, nil
    case <-ctx.Done():
        return Result{}, ctx.Err() // we leave...
    }
}
```

When `ctx` is cancelled first, `fetch` returns. But the goroutine is still alive, blocked forever on `ch <- r`, because the only receiver just walked away. Every cancelled call leaks one goroutine *and* whatever `doSlowWork` was holding.

## Why it's so easy to miss

- It only triggers on the cancellation/timeout path, which your happy-path tests don't exercise.
- The goroutine is doing nothing wrong locally — it's a correct send. The bug is the *relationship* between sender and a receiver that no longer exists.
- Nothing crashes. You find it in production via `runtime.NumGoroutine()` trending up and to the right.

## Fix 1: give the channel a buffer

If the channel has room for the result, the send never blocks even when nobody's listening:

```go
ch := make(chan Result, 1) // the send always succeeds
```

The goroutine sends into the buffer, returns, and gets garbage collected along with the channel. This is the smallest correct fix and the right default for "one goroutine, one result" fan-out.

## Fix 2: make the work itself cancellable

A buffer stops the *leak*, but the goroutine still runs `doSlowWork` to completion, wasting CPU and I/O for a result no one wants. The better fix is to thread `ctx` all the way down so the work stops when the caller gives up:

```go
func doSlowWork(ctx context.Context, url string) (Result, error) {
    req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    // ctx cancellation now aborts the in-flight request itself.
    resp, err := http.DefaultClient.Do(req)
    ...
}
```

`context` only does something if the leaf operations actually honor it. A `ctx` you accept but never pass down is decoration.

## The rule of thumb

> Every goroutine needs a guaranteed path to exit. If you can't point to the line where it's *guaranteed* to return on every path — including cancellation — you have a leak waiting for the right timeout.

Concretely:

- For a goroutine that produces one value, use a **buffered channel** so the send can't block.
- For long-lived goroutines, give them a `<-ctx.Done()` (or a `done`/`quit` channel) case in their `select` and make sure something closes it.
- Push `context` to the leaves so cancellation actually stops work, not just abandons it.

## Catching it before prod

A cheap guard in tests: snapshot the goroutine count, run the cancellation path, give things a beat to unwind, and assert it came back down.

```go
before := runtime.NumGoroutine()
runCancelledPath()
time.Sleep(10 * time.Millisecond)
if after := runtime.NumGoroutine(); after > before {
    t.Fatalf("leaked %d goroutines", after-before)
}
```

It's blunt and a little flaky under parallel tests, but it has caught real leaks for me that no amount of staring at the happy path would have.

## Takeaways

- The classic Go leak is a goroutine blocked on a send whose receiver gave up.
- Buffer the result channel so the send can never block — the default for one-shot goroutines.
- Thread `context` to the leaves so cancellation stops the *work*, not just abandons the goroutine.
- Every goroutine needs a provable exit on every path. If you can't name it, it's a leak.
