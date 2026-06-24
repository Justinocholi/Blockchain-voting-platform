# 10 — Performance & Scalability

*Covers brief §12 (Performance and Scalability).*

> **Key insight that makes this tractable:** the ledger does **not** record 90M+
> individual votes as transactions. It records **~176,000 signed polling-unit
> result tuples per contest** (plus audit/commit events). This is the single most
> important scaling decision — it turns an impossible 90M-TPS problem into a very
> comfortable ~hundreds-of-thousands-of-transactions problem. Aggregation by PU is
> not just operationally faithful to Nigerian process; it is what makes the
> architecture scale.

---

## 1. Volumetrics (planning estimates)

| Quantity | Estimate | Basis |
|----------|----------|-------|
| Registered voters | ~93.4M | 2023 INEC figure |
| Polling units | ~176,000 | INEC |
| Wards | ~8,800 | INEC |
| LGAs | 774 | Constitutional |
| States + FCT | 37 | — |
| Concurrent ballot types | up to 6 | Presidential…LGA |
| Peak turnout | ~30–40M voters voting in a window | Historical turnout ~27–35% |

### 1.1 Ledger transaction volume (the number that matters)
- PU result tuples: **~176,000 PUs × number of contests on that day.**
  - Presidential day: ~176,000 result tuples.
  - General (Pres + NASS): up to ~3 contests/PU → ~528,000 tuples.
- Plus accreditation tallies (~176,000), audit/commit events, amendments.
- **Total per election day: low single-digit millions of ledger transactions** —
  spread over a multi-hour close-and-sync window.

### 1.2 Throughput requirement
- Even if **all 176,000 PUs closed and synced within the same 1 hour**, that is
  **~49 result tx/second** average; with bursts, design headroom to **~500–1,000
  TPS**. Fabric with BFT comfortably delivers **thousands of TPS**, so we have
  **1–2 orders of magnitude headroom.** The ledger is *not* the bottleneck;
  **connectivity and physical sync are** (addressed in [05](05-offline-connectivity.md)).

### 1.3 The "what if individual digital receipts" case
- If the optional E2E-V digital-commitment layer is enabled for, say, 30M voters
  over a 10-hour window, that's ~830 commitments/sec average — still within
  Fabric's envelope, and these can be **batched** (many commitments per
  transaction) and confined to **private collections / sharded channels per
  state** to scale horizontally.

---

## 2. Latency expectations

| Operation | Target | Notes |
|-----------|--------|-------|
| On-device accreditation | < 5 s | Local biometric match, no network |
| Vote casting (paper) | voter-paced | No system latency |
| Result signing at PU | < 10 s | Local crypto |
| Ledger commit (BFT) | < 5 s once submitted | Deterministic finality |
| Public portal visibility | seconds after sync | Subject to connectivity, not chain |
| End-to-end (PU close → public) | minutes–hours | Dominated by sync path, not compute |

We do **not** promise instant national results; we promise **verifiable** results
that appear as fast as connectivity allows, with pending units shown transparently.

---

## 3. Storage requirements

| Data | Size/unit | Total | Where |
|------|-----------|-------|-------|
| PU result tuple (on-chain) | ~2–5 KB | 176k×6 ≈ ~5 GB/cycle | Replicated to all peers |
| Audit/commit events | small | ~GBs | On-chain |
| Result-sheet images | ~200–500 KB | 176k×6 ≈ ~0.3–0.5 TB | **Off-chain** object storage; hash on-chain |
| Optional E2E-V commitments | ~1 KB | 30M ≈ ~30–60 GB | On-chain (sharded) or private collections |
| Device logs | small | ~TBs aggregate | Off-chain, hashed |

**Ledger state is modest — single-digit-to-low-tens of GB per cycle**, easily
held by every validator org. Large blobs (images, logs) live off-chain with
on-chain hashes — keeping the chain lean and replication cheap.

---

## 4. Validator resource needs (per org)

| Resource | Per validator org (planning) |
|----------|------------------------------|
| Peer + orderer nodes | 2–3 nodes, 8–16 vCPU, 32–64 GB RAM each |
| Storage | 1–2 TB NVMe (ledger + indices + headroom) |
| HSM | 1 (keys + threshold share) |
| Network | Redundant links; multi-region for core |
| Hosting | Org-operated, Nigeria-resident |

This is **commodity infrastructure** — deliberately so. No exotic hardware, no
mining farms, no GPU. A key advantage over public-chain designs: the per-org cost
is a few servers, not a data-center of miners.

---

## 5. Disaster recovery objectives

| Objective | Target |
|-----------|--------|
| **RPO** (data loss) | ≈ 0 for committed results (BFT replication across orgs/regions) + device-side sealed store + party-agent printed receipts |
| **RTO** (core services) | < 1 hour (multi-region peers; loss of one region is survivable) |
| Field continuity | Immediate fallback to **paper/manual** (no electronics needed) |
| Backup | Continuous ledger replication + periodic off-site encrypted snapshots; off-chain blobs geo-replicated |
| Ultimate recovery | **The paper ballots** — the entire digital system can be lost and the election still reconstructed and audited from paper |

The deepest DR guarantee is non-technical: **paper is the backup of last resort,**
which is precisely why the design keeps it primary.

---

## 6. Optimizations for nationwide scale

- **PU-level aggregation** (the headline optimization — keeps tx count in the
  millions, not billions).
- **Channel/shard per state** so states scale independently and a hot state
  doesn't throttle others; national channel holds aggregated roots.
- **Private data collections** for any voluminous per-voter commitments — hashes
  on the shared ledger, bulk data only where needed.
- **Off-chain blobs + on-chain hashes** for images/logs.
- **Batching** of commitment transactions.
- **Cacheable, static public read tier** behind CDN — public traffic (potentially
  millions of citizens checking results) never touches the consensus layer.
- **Store-and-forward + multi-path sync** so throughput is decoupled from
  real-time connectivity.
- **Horizontal read replicas** at state tier for observer/party query load.

> Net: the architecture is **comfortably within proven Fabric performance
> envelopes**, with the real engineering challenge being *field logistics,
> connectivity, and offline robustness* — not blockchain throughput. That is the
> honest scaling story.
