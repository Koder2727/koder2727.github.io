---
title: "Priority allocation without the churn"
date: 2026-04-02
summary: "Dense integer priorities make every firewall rule insertion a cascade of rewrites. A simple gapped-numbering scheme turns O(n) re-programming into O(1) most of the time."
tags: ["distributed-systems", "networking", "algorithms", "ovn"]
draft: true
---

A distributed firewall is, underneath, an ordered list of rules. Order is the whole game: the first matching ACL wins, so "where a rule sits relative to its neighbors" *is* its semantics. In OVN, that order is encoded as an integer `priority` on each ACL.

The naive approach — assign priorities `1, 2, 3, 4, …` — works beautifully until the first time someone inserts a rule in the middle.

## The churn problem

Say you have rules at priorities `1..1000` and a user inserts one rule between `500` and `501`. With dense numbering there's no integer between them, so you renumber everything from `501` upward. That's:

- ~500 ACL updates programmed into the dataplane,
- for a *single* logical change,
- during which the table is transiently inconsistent.

Now make policy updates high-frequency — many small edits per second across a cluster — and this renumbering churn becomes the dominant cost. The system spends its time rewriting priorities instead of enforcing policy, and every rewrite is a chance for a window where traffic hits the wrong rule.

## Gapped numbering

The fix is to stop using consecutive integers. Spread rules across a large priority space with gaps between them:

```
rule A -> 100000
rule B -> 200000
rule C -> 300000
```

Inserting between A and B is now just:

```
rule X -> (100000 + 200000) / 2 = 150000
```

One write. No neighbors touched. This is the same idea as fractional / "LexoRank"-style ordering, specialized to a bounded integer range.

```go
// Pick a priority strictly between lo and hi without disturbing neighbors.
func between(lo, hi int) (int, bool) {
    if hi-lo < 2 {
        return 0, false // no room; caller must rebalance this region
    }
    return lo + (hi-lo)/2, true
}
```

The midpoint halves the available gap each time, so a region can only absorb `log2(gap)` insertions before it runs out of room. With a starting gap of `2^17` that's ~17 insertions in the *exact same slot* before you must rebalance — and in practice insertions spread out, so you rarely hit it.

## Minimal rebalance

When a local gap is exhausted, the goal is to rebalance **as few rules as possible** — ideally just the saturated window, not the whole table.

1. Find the smallest contiguous span around the collision that has enough total room.
2. Re-space *only those* rules evenly across that span's priority range.
3. Leave everything outside the span untouched.

```go
func rebalance(rules []*Rule, start, end, lo, hi int) {
    n := end - start
    step := (hi - lo) / (n + 1)
    for i := 0; i < n; i++ {
        rules[start+i].Priority = lo + step*(i+1)
    }
}
```

The win is bounding the blast radius. A global renumber is `O(total rules)`; a local rebalance is `O(rules in the saturated window)`, which is tiny and constant-ish in practice. In the system I worked on, switching from dense numbering to gapped priorities plus minimal rebalance cut rule realization time by roughly **30%**, mostly by eliminating the renumber cascades.

## Why this matters for stability, not just speed

Churn isn't only a latency cost. Every priority rewrite you push to the dataplane is a moment where the rule table is in flux. Fewer writes means fewer transient states, which means fewer windows where a packet can match the wrong ACL during an update. **Minimizing churn is a correctness property, not just a performance one.**

## Takeaways

- Dense integer priorities make middle-insertion `O(n)`. Don't use them for ordered, frequently-edited tables.
- Gapped numbering + midpoint insertion makes the common case a single write.
- When a gap saturates, rebalance the smallest window that fixes it — never the whole table.
- Less churn = fewer transient inconsistencies = a more stable dataplane.
