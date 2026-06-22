# 13 — Sample Smart-Contract (Chaincode) Pseudocode

*Covers the smart-contract pseudocode deliverable in brief §15.*

> Illustrative pseudocode for **Hyperledger Fabric chaincode** (Go-flavored). It
> emphasizes the security-relevant logic: role checks, append-only semantics,
> idempotency, signature verification, time windows, and the threshold/RLA gates.
> **No PII or raw ballots appear** — by design. Production code must be formally
> reviewed, fuzzed, and independently audited.

---

## 1. Identity, roles & invariants

```go
// Every transactor is an X.509 identity issued by an org's MSP.
// Roles are derived from the certificate's OU / org, never self-asserted.
type Role int
const (
    RoleINEC Role = iota
    RoleObserver
    RoleJudiciary
    RoleParty
    RoleAcademia
    RoleDevice        // a provisioned BVAS+ device cert
    RolePresidingOfficer
)

// Hard invariants enforced everywhere:
//  I1: results are APPEND-ONLY; never updated or deleted.
//  I2: a PU result is idempotent on its deterministic ID.
//  I3: nothing commits outside the election's open/close window.
//  I4: every result carries valid device + officer + (>=1) witness signatures.
//  I5: certification requires k-of-n threshold signatures AND a passed RLA gate.
//  I6: no function ever reads/writes voter identity or vote-choice-linked data.

func callerRole(ctx) Role        { /* parse MSP identity */ }
func requireRole(ctx, r Role)    { if callerRole(ctx) != r { panic("unauthorized") } }
func requireAnyRole(ctx, rs ...Role) { /* ... */ }
```

---

## 2. Election lifecycle

```go
type Election struct {
    ID            string
    Contests      []Contest
    BallotDefHash string        // hash of signed ballot definition
    OpenAt, CloseAt int64
    State         string        // CREATED | OPEN | CLOSED | CERTIFIED
    SetupSigs     []Signature   // INEC + >=1 observer co-sign
}

func CreateElection(ctx, e Election, sigs []Signature) error {
    requireRole(ctx, RoleINEC)
    require(verifyMultiSig(e, sigs, need=2, roles={RoleINEC, RoleObserver}),
            "setup must be co-signed by INEC + observer")
    require(getState(ctx, e.ID) == nil, "election exists")   // no overwrite (I1)
    e.State = "CREATED"
    putState(ctx, e.ID, e)
    emitAudit(ctx, "ELECTION_CREATED", e.ID)
    return nil
}

func OpenElection(ctx, id string) error {
    requireRole(ctx, RoleINEC)
    e := mustGet(ctx, id)
    require(now(ctx) >= e.OpenAt, "too early")
    e.State = "OPEN"; putState(ctx, id, e)
    emitAudit(ctx, "ELECTION_OPENED", id)
}
```

> `now(ctx)` uses the **transaction timestamp from the ordering service**, not a
> peer's local clock, so time-window checks are deterministic across the BFT
> network.

---

## 3. Recording a polling-unit result (the core path)

```go
type PUResult struct {
    PUID, ElectionID  string
    ContestCounts     map[string]map[string]uint64 // contestID -> candidateID -> count
    AccreditedCount   uint64
    ValidVotes        uint64
    RejectedVotes     uint64
    ResultSheetHash   string       // hash of EC8 photo (image off-chain)
    ResultRound       uint32       // 0 = original; >0 = explicit amendment
    DeviceSig         Signature
    OfficerSig        Signature
    WitnessSigs       []Signature  // party agents / observers present
    SyncPath          string       // DATA | SMS | RELAY | PHYSICAL
}

func resultID(r PUResult) string {
    return sha256(r.ElectionID + "|" + r.PUID + "|" + itoa(r.ResultRound))
}

func RecordPUResult(ctx, r PUResult) error {
    requireAnyRole(ctx, RoleDevice, RolePresidingOfficer)
    e := mustGet(ctx, r.ElectionID)

    // I3: must be within (or just after) the voting window, before certification.
    require(e.State == "OPEN" || e.State == "CLOSED", "election not accepting results")

    // I4: signatures must verify against provisioned device + officer + >=1 witness.
    require(verifyDeviceSig(r) && verifyOfficerSig(r) && len(r.WitnessSigs) >= 1
            && verifyWitnessSigs(r), "invalid signatures")

    // Sanity: votes cannot exceed accreditation (anti-stuffing cross-check).
    require(r.ValidVotes + r.RejectedVotes <= r.AccreditedCount, "votes exceed accredited")

    id := resultID(r)
    existing := getState(ctx, id)

    if existing != nil {
        // I2: idempotent replay (same content) is a no-op; conflicting => FLAG, never overwrite (I1).
        if hash(existing) == hash(r) {
            emitAudit(ctx, "PU_RESULT_REPLAY_NOOP", id)
            return nil
        }
        emitAudit(ctx, "PU_RESULT_CONFLICT", id)  // visible, investigable
        return error("conflicting result for same id; submit a signed amendment instead")
    }

    // Amendments: a higher ResultRound must reference and justify the prior round.
    if r.ResultRound > 0 {
        require(getState(ctx, resultID(withRound(r, r.ResultRound-1))) != nil,
                "amendment must supersede an existing round")
        require(hasReasonCode(r), "amendment requires signed reason")
    }

    putState(ctx, id, r)                 // APPEND ONLY
    emitAudit(ctx, "PU_RESULT_RECORDED", id)
    return nil
}
```

Key properties visible above: **append-only**, **idempotent on deterministic ID**,
**conflicts surfaced not hidden**, **amendments are explicit and justified**, and
an **accreditation-vs-votes anti-stuffing check**. No identity is touched.

---

## 4. Aggregation that anyone can recompute

```go
// Collation is DETERMINISTIC and PUBLIC: totals are a pure function of recorded
// PU results. No human can inject a number that doesn't sum from the PU layer.
func CollationTotal(ctx, electionID, contestID, level, regionID string) Tally {
    pus := puResultsInRegion(ctx, electionID, regionID, level) // PU/ward/LGA/state/national
    total := emptyTally()
    for _, r := range pus {
        round := latestRound(ctx, r.PUID)        // honor amendments, append-only history intact
        addInto(total, round.ContestCounts[contestID])
    }
    return total   // independently reproducible by any observer from public data
}
```

---

## 5. Digital E2E-V layer (optional): commitments, nullifiers, threshold tally

```go
// Encrypted ballot commitment for verifiable receipts. Stores NO identity.
type Commitment struct {
    TrackingCode string
    Ciphertext   bytes     // encrypted under threshold election pubkey
    WellFormed   ZKProof   // proves "exactly one valid selection", reveals nothing
}

func SubmitCommitment(ctx, c Commitment, nullifier string) error {
    requireRole(ctx, RoleDevice)
    require(verifyZK(c.WellFormed, c.Ciphertext), "ballot not well-formed")
    require(getState(ctx, "NUL:"+nullifier) == nil, "double-vote: nullifier spent") // I-onevote
    putState(ctx, "NUL:"+nullifier, true)              // mark spent (no identity)
    putState(ctx, "CMT:"+c.TrackingCode, c)            // append-only
    emitAudit(ctx, "COMMITMENT_RECORDED", c.TrackingCode)
}

// Voter verification: inclusion only, never reveals choice.
func VerifyRecorded(ctx, trackingCode string) bool {
    return getState(ctx, "CMT:"+trackingCode) != nil   // "recorded as cast"
}

// Tally: homomorphic sum, then THRESHOLD decryption of the total only.
func PublishTally(ctx, electionID, contestID string,
                  partialDecryptions []PartialDecryption) Tally {
    cipherSum := homomorphicAdd(allCommitments(ctx, electionID, contestID)) // no decryption
    require(len(partialDecryptions) >= K_THRESHOLD, "need k-of-n trustees")
    plain, proof := combineThreshold(cipherSum, partialDecryptions)         // decrypt TOTAL only
    require(verifyDecryptionProof(cipherSum, plain, proof), "bad decryption proof")
    emitAudit(ctx, "TALLY_PUBLISHED", contestID)
    return Tally{ Result: plain, Proof: proof }   // individual ballots NEVER decrypted
}
```

---

## 6. Certification gated by threshold signatures AND a passed RLA

```go
type Certification struct {
    ElectionID, Level, RegionID string
    ReportedOutcome string
    ThresholdSigs   []Signature   // k-of-n consortium trustees
    RLAReportHash   string        // hash of published, observed RLA result
    RLAPassed       bool
}

func Certify(ctx, c Certification) error {
    requireAnyRole(ctx, RoleINEC, RoleJudiciary)

    // I5: cannot certify without a passed, software-independent paper audit.
    require(c.RLAPassed, "Risk-Limiting Audit has not confirmed the outcome")
    require(rlaReportExists(ctx, c.RLAReportHash), "RLA report not on record")

    // k-of-n threshold across institutionally-separated trustees.
    require(verifyThresholdSigs(c, need=K_THRESHOLD, distinctOrgs=true),
            "insufficient independent trustee signatures")

    // Outcome must match the publicly recomputable collation.
    require(c.ReportedOutcome == deriveOutcome(ctx, c.ElectionID, c.Level, c.RegionID),
            "reported outcome does not match recomputed collation")

    putState(ctx, "CERT:"+c.ElectionID+":"+c.RegionID, c)  // append-only
    emitAudit(ctx, "CERTIFIED", c.ElectionID+":"+c.RegionID)
}
```

---

## 7. Append-only audit log + external anchoring

```go
func emitAudit(ctx, eventType, ref string) {
    ev := AuditEvent{ Type: eventType, Ref: ref, ActorOrg: callerOrg(ctx),
                      Time: now(ctx), Sig: signByCaller(ctx) }
    // Audit events are append-only and cannot be amended or deleted.
    appendOnly(ctx, "AUDIT:"+uuid(), ev)
}

// Off-chain anchoring service periodically commits a Merkle root externally.
func RecordAnchor(ctx, root string, externalTxRef string) error {
    requireRole(ctx, RoleINEC)   // co-witnessed off-chain; recorded here for the public
    appendOnly(ctx, "ANCHOR:"+root, AnchorRecord{root, externalTxRef, now(ctx)})
    emitAudit(ctx, "ANCHORED", root)
}
```

---

## 8. What this pseudocode deliberately demonstrates

| Property | Where |
|----------|-------|
| Append-only, no silent edits | every `putState`/`appendOnly`, conflict handling |
| Idempotent offline sync | `resultID` + replay no-op (§3) |
| One-person-one-vote (digital layer) | nullifier spend (§5) |
| Ballot secrecy / coercion resistance | inclusion-only `VerifyRecorded`, threshold tally (§5) |
| No PII / no choice-linked data on chain | absent everywhere (invariant I6) |
| Separation of powers | multi-sig setup, k-of-n distinct-org certification |
| Software independence | **certification blocked until RLA on paper passes** (§6) |
| Public recomputability | `CollationTotal`, `deriveOutcome` (§4, §6) |
| External immutability witness | anchoring (§7) |

> The most important line in this entire file is `require(c.RLAPassed, ...)`: the
> chain **refuses to certify** an outcome the paper audit hasn't independently
> confirmed. That single gate is what keeps blockchain in its proper, supporting
> place.
