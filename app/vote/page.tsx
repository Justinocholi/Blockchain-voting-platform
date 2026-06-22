"use client";

import Link from "next/link";
import { useState } from "react";
import { CANDIDATES, ELECTION, MY_POLLING_UNIT, candidateById, pollingUnitById } from "@/lib/election";
import { accredit, castVote } from "@/lib/ledger";

type Step = "accredit" | "ballot" | "confirm" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "accredit", label: "1 · Accreditation" },
  { key: "ballot", label: "2 · Mark ballot" },
  { key: "confirm", label: "3 · Verify paper" },
  { key: "done", label: "4 · Receipt" },
];

export default function VotePage() {
  const [step, setStep] = useState<Step>("accredit");
  const [vin, setVin] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{
    trackingCode: string;
    commitment: string;
    resultHash: string;
  } | null>(null);

  const pu = pollingUnitById(MY_POLLING_UNIT);

  function doAccredit() {
    setError(null);
    if (vin.trim().length < 4) {
      setError("Enter a Voter ID (any 4+ characters for the demo, e.g. ABC123).");
      return;
    }
    setScanning(true);
    // Simulate a biometric capture delay.
    setTimeout(() => {
      try {
        const t = accredit(vin);
        setToken(t);
        setScanning(false);
        setStep("ballot");
      } catch (e: any) {
        setScanning(false);
        setError(e?.message ?? "Accreditation failed.");
      }
    }, 900);
  }

  async function doCast() {
    if (!choice) return;
    setBusy(true);
    const r = await castVote(choice);
    setReceipt(r);
    setBusy(false);
    setStep("done");
  }

  function reset() {
    setStep("accredit");
    setVin("");
    setToken(null);
    setChoice(null);
    setReceipt(null);
    setError(null);
  }

  return (
    <>
      <div className="card">
        <span className="pill">{ELECTION.title} · Demo</span>
        <h1 style={{ marginBottom: 4 }}>Cast your vote</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Assigned polling unit: <strong>{pu?.id}</strong> — {pu?.name}, {pu?.state}
        </p>

        <div className="steps">
          {STEPS.map((s) => {
            const order = STEPS.findIndex((x) => x.key === step);
            const idx = STEPS.findIndex((x) => x.key === s.key);
            const cls = idx === order ? "active" : idx < order ? "done" : "";
            return (
              <div key={s.key} className={`step ${cls}`}>
                {s.label}
              </div>
            );
          })}
        </div>

        {step === "accredit" && (
          <div>
            <p className="muted">
              In the real system this is a BVAS device matching your fingerprint/face against
              the register for this polling unit. Here, enter any Voter ID to simulate it. A
              successful match issues an <strong>anonymous, single-use voting token</strong>.
            </p>
            <label className="field" htmlFor="vin">
              Voter ID (VIN)
            </label>
            <input
              id="vin"
              className="input"
              placeholder="e.g. ABC123"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              disabled={scanning}
            />
            {error && <p className="notice err" style={{ marginTop: 12 }}>{error}</p>}
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={doAccredit} disabled={scanning}>
                {scanning ? "🔍 Capturing biometric…" : "Accredit with BVAS"}
              </button>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>
              Try accrediting the same VIN twice to see one-person-one-vote enforced.
            </p>
          </div>
        )}

        {step === "ballot" && (
          <div>
            <p className="notice" style={{ marginBottom: 16 }}>
              ✓ Accredited. Anonymous voting token issued:{" "}
              <span className="mono">{token?.slice(0, 16)}…</span> — this is{" "}
              <strong>not linked to your identity</strong>.
            </p>
            <p className="muted">Select one candidate. (Recognise by name, party &amp; colour — no reading required.)</p>
            {CANDIDATES.map((c) => (
              <button
                key={c.id}
                className={`ballot-option ${choice === c.id ? "selected" : ""}`}
                onClick={() => setChoice(c.id)}
              >
                <span className="ballot-logo" style={{ background: c.color }}>
                  {c.abbr}
                </span>
                <span>
                  <span className="ballot-name">{c.name}</span>
                  <br />
                  <span className="muted small">{c.party}</span>
                </span>
                <span style={{ marginLeft: "auto", fontSize: 22 }}>
                  {choice === c.id ? "☑" : "☐"}
                </span>
              </button>
            ))}
            <button className="btn block" disabled={!choice} onClick={() => setStep("confirm")}>
              Continue
            </button>
          </div>
        )}

        {step === "confirm" && choice && (
          <div>
            <p className="muted">
              This is the <strong>human-readable paper ballot</strong> you would verify and drop
              in the box. Nothing is recorded until you confirm.
            </p>
            <div className="receipt" style={{ marginBottom: 16 }}>
              <div className="small muted">PRINTED BALLOT · {pu?.id}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
                <span className="ballot-logo" style={{ background: candidateById(choice)?.color }}>
                  {candidateById(choice)?.abbr}
                </span>
                <div>
                  <div className="ballot-name" style={{ fontSize: 18 }}>
                    {candidateById(choice)?.name}
                  </div>
                  <div className="muted">{candidateById(choice)?.party}</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn" onClick={doCast} disabled={busy}>
                {busy ? "Casting…" : "✓ This is correct — cast my vote"}
              </button>
              <button className="btn secondary" onClick={() => setStep("ballot")} disabled={busy}>
                ← Change my choice
              </button>
            </div>
          </div>
        )}

        {step === "done" && receipt && (
          <div>
            <p className="notice">✓ Your paper ballot is cast and the polling-unit tally updated on the ledger.</p>
            <div className="receipt" style={{ marginTop: 16 }}>
              <div className="small muted">VOTER VERIFICATION RECEIPT</div>
              <h2 style={{ margin: "6px 0 2px", letterSpacing: 2 }}>{receipt.trackingCode}</h2>
              <p className="small muted" style={{ marginTop: 0 }}>
                Keep this code. It proves your ballot was <strong>recorded</strong> — it does{" "}
                <strong>not</strong> reveal or prove how you voted (coercion resistance).
              </p>
              <table className="pu" style={{ marginTop: 8 }}>
                <tbody>
                  <tr>
                    <th>Choice commitment</th>
                    <td className="mono">{receipt.commitment.slice(0, 32)}…</td>
                  </tr>
                  <tr>
                    <th>PU result hash (new chain head)</th>
                    <td className="mono">{receipt.resultHash.slice(0, 32)}…</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="btn" href={`/verify?code=${receipt.trackingCode}`}>
                Verify this receipt →
              </Link>
              <Link className="btn secondary" href="/bulletin">
                See it on the bulletin board
              </Link>
              <button className="btn ghost" onClick={reset}>
                Cast another (new voter)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
