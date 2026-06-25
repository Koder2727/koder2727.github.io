---
title: "Surviving ENOBUFS: lossless conntrack telemetry over Netlink"
date: 2026-05-18
summary: "When you stream nf_conntrack events to userspace, the kernel will eventually outrun you. Here's how ENOBUFS happens and the buffering strategy I use to stop dropping events."
tags: ["linux", "netlink", "kernel", "go"]
---

If you've ever subscribed to `nf_conntrack` events over a Netlink socket and run it under real traffic, you've met `ENOBUFS`. One moment your consumer is happily reading connection updates; the next, `recvmsg` returns `-1` with `errno == ENOBUFS` and you've silently lost a chunk of history.

This note is about *why* that happens and the shape of a fix that actually holds up at scale.

## The setup

The kernel's conntrack subsystem can multicast events — new flows, updates, destroys — to userspace via a `NETLINK_NETFILTER` socket. You join the relevant multicast groups and read:

```go
fd, err := unix.Socket(unix.AF_NETLINK, unix.SOCK_RAW, unix.NETLINK_NETFILTER)
if err != nil {
    return err
}
// Join conntrack new/update/destroy multicast groups.
addr := &unix.SockaddrNetlink{
    Family: unix.AF_NETLINK,
    Groups: nfnlGrpConntrackNew | nfnlGrpConntrackUpdate | nfnlGrpConntrackDestroy,
}
if err := unix.Bind(fd, addr); err != nil {
    return err
}
```

The trap is hiding in plain sight: **Netlink multicast has no flow control.** The kernel does not block waiting for your consumer. It appends to the socket's receive buffer, and when that buffer is full, it drops the message and arms `ENOBUFS` for your next read.

## Why your consumer falls behind

The receive buffer is bytes, not time. Under a burst — say a deployment that churns thousands of short-lived connections — the kernel produces events far faster than a consumer that does *any* per-event work (parsing, enrichment, a map lookup, a channel send). The moment your read loop stalls on downstream backpressure, the socket buffer fills and the kernel starts dropping.

Three things make this worse than it looks:

1. **`ENOBUFS` is a notification, not a count.** You learn that you lost events, never how many or which ones.
2. **Bumping `SO_RCVBUF` only buys time.** A bigger bucket overflows later, not never. It's a shock absorber, not a fix.
3. **Parsing in the read path couples kernel throughput to your slowest dependency.** That's the real bug.

## The fix: decouple draining from processing

The principle is simple — *the only job of the thread reading the socket is to get bytes out of the kernel as fast as possible.* Everything else happens elsewhere.

I use a double-buffered, (mostly) lock-free handoff between a single reader and the processing stage:

```go
// One goroutine does nothing but drain the socket into a buffer pool.
func (r *Reader) drain() {
    for {
        buf := r.pool.Get() // pre-allocated, reused
        n, _, err := unix.Recvmsg(r.fd, buf.b, nil, 0)
        if err == unix.ENOBUFS {
            atomic.AddUint64(&r.dropped, 1)
            continue // keep draining; never block here
        }
        if err != nil {
            // handle/return
        }
        buf.n = n
        r.handoff(buf) // non-blocking publish to the parse stage
    }
}
```

A few decisions that matter:

- **Pre-allocate and recycle buffers.** Allocating per message in the hot path puts you back in the GC's hands at the worst time.
- **Make the handoff non-blocking.** If the parse stage is behind, that's a capacity problem to solve with parallelism downstream — not a reason to stop reading the socket.
- **Count drops with an atomic and export it.** `ENOBUFS` should be a first-class metric. If it's nonzero, your observability has blind spots and you need to know.

> The mental model that fixed this for me: treat the Netlink socket like a tap you can't turn off. Your job isn't to slow the water down — it's to never let the sink back up into the tap.

## What "lossless" actually means here

You cannot make the kernel wait, so "lossless" is really *"the consumer is never the bottleneck."* Once draining is decoupled from processing, the only way to drop is to be globally under-provisioned — at which point the drop counter tells you to scale the parse stage, not to fiddle with socket options.

## Takeaways

- Netlink multicast has no backpressure; `ENOBUFS` is the kernel telling you it gave up on you.
- Never parse in the read path. Drain into recycled buffers, hand off without blocking.
- `SO_RCVBUF` is a shock absorber, not a solution.
- Export the drop count. An invisible drop is a lie in your data.
