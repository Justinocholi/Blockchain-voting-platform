// Browser-local simulation of the consortium "bulletin board" ledger.
// State lives in localStorage so the demo is fully interactive without a backend.
// This mirrors the design's data model (signed per-polling-unit results, an
// append-only hash chain, and choice-hiding vote commitments) WITHOUT real
// cryptography or a real distributed ledger.

import { CANDIDATES, MY_POLLING_UNIT, POLLING_UNITS } from "./election";
import { randomHex, sha256 } from "./hash";

const STORAGE_KEY = "naijavote_ledger_v2";

export type PUState = {
  id: string;
  name: string;
  state: string;
  counts: Record<string, number>;
  accredited: number;
  deviceSig: string; // simulated device signature
  lastHash: string; // simulated append-only hash chain head
};

export type Commitment = {
  trackingCode: string;
  puId: string;
  commitment: string; // sha256(choice|nonce) — hides the choice
  recordedAt: number;
};

export type Ledger = {
  pollingUnits: Record<string, PUState>;
  commitments: Record<string, Commitment>;
  usedVINs: string[];
};

// Seed numbers so the bulletin board looks alive on first visit.
const SEED: Record<string, { counts: Record<string, number>; accredited: number }> = {
  "PU-001": { counts: { c1: 120, c2: 95, c3: 60, c4: 30 }, accredited: 312 },
  "PU-014": { counts: { c1: 40, c2: 180, c3: 25, c4: 70 }, accredited: 327 },
  "PU-027": { counts: { c1: 150, c2: 40, c3: 110, c4: 35 }, accredited: 348 },
  "PU-033": { counts: { c1: 90, c2: 88, c3: 70, c4: 52 }, accredited: 305 },
};

function seedLedger(): Ledger {
  const pollingUnits: Record<string, PUState> = {};
  for (const pu of POLLING_UNITS) {
    const seed = SEED[pu.id] ?? { counts: {}, accredited: 0 };
    const counts: Record<string, number> = {};
    for (const c of CANDIDATES) counts[c.id] = seed.counts[c.id] ?? 0;
    pollingUnits[pu.id] = {
      id: pu.id,
      name: pu.name,
      state: pu.state,
      counts,
      accredited: seed.accredited,
      deviceSig: randomHex(12),
      lastHash: "GENESIS-" + pu.id,
    };
  }
  return { pollingUnits, commitments: {}, usedVINs: [] };
}

export function getLedger(): Ledger {
  if (typeof window === "undefined") return seedLedger();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seedLedger();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as Ledger;
  } catch {
    return seedLedger();
  }
}

function saveLedger(l: Ledger) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(l));
}

export function resetLedger(): Ledger {
  const fresh = seedLedger();
  saveLedger(fresh);
  return fresh;
}

/** Accreditation: enforce one-person-one-vote, return a simulated blind-signed token. */
export function accredit(vin: string): string {
  const v = vin.trim().toUpperCase();
  const l = getLedger();
  if (l.usedVINs.includes(v)) {
    throw new Error(
      "This voter ID has already been accredited at this device. One person, one vote."
    );
  }
  l.usedVINs.push(v);
  saveLedger(l);
  return randomHex(16); // unlinkable, single-use voting token (simulated blind signature)
}

/** Cast a vote: increments the PU tally, extends the hash chain, records a choice-hiding commitment. */
export async function castVote(
  candidateId: string
): Promise<{ trackingCode: string; commitment: string; resultHash: string; puId: string }> {
  const l = getLedger();
  const pu = l.pollingUnits[MY_POLLING_UNIT];
  pu.counts[candidateId] = (pu.counts[candidateId] ?? 0) + 1;
  pu.accredited = (pu.accredited ?? 0) + 1;

  const nonce = randomHex(8);
  const commitment = await sha256(candidateId + "|" + nonce); // hides the choice
  const trackingCode = (await sha256(nonce + commitment)).slice(0, 10).toUpperCase();

  // Append-only, tamper-evident hash chain over the running tally.
  pu.lastHash = await sha256(pu.lastHash + "|" + JSON.stringify(pu.counts));

  l.commitments[trackingCode] = {
    trackingCode,
    puId: MY_POLLING_UNIT,
    commitment,
    recordedAt: Date.now(),
  };
  saveLedger(l);
  return { trackingCode, commitment, resultHash: pu.lastHash, puId: MY_POLLING_UNIT };
}

/** Voter verification: confirms a ballot was RECORDED without revealing the choice. */
export function verifyReceipt(code: string): Commitment | null {
  const l = getLedger();
  return l.commitments[code.trim().toUpperCase()] ?? null;
}

export function nationalTotals(l: Ledger): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const c of CANDIDATES) totals[c.id] = 0;
  for (const pu of Object.values(l.pollingUnits)) {
    for (const c of CANDIDATES) totals[c.id] += pu.counts[c.id] ?? 0;
  }
  return totals;
}
