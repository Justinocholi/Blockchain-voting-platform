"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pollingUnitById } from "@/lib/election";
import { Commitment, verifyReceipt } from "@/lib/ledger";

function VerifyInner() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Commitment | null | undefined>(undefined);

  useEffect(() => {
    const c = params.get("code");
    if (c) {
      setCode(c);
      setResult(verifyReceipt(c));
    }
  }, [params]);

  function check() {
    setResult(verifyReceipt(code));
  }

  return (
    <div className="card">
      <span className="pill">End-to-end verifiability</span>
      <h1 style={{ marginBottom: 4 }}>Verify your receipt</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Enter your tracking code to confirm your ballot was <strong>recorded as cast</strong>.
        The system can prove inclusion <strong>without</strong> revealing — or letting you prove
        to anyone else — how you voted. That is what defeats vote-buying.
      </p>

      <label className="field" htmlFor="code">
        Tracking code
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          id="code"
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="e.g. A1B2C3D4E5"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn" onClick={check}>
          Verify
        </button>
      </div>

      {result === null && (
        <p className="notice err" style={{ marginTop: 18 }}>
          ✗ No ballot found for that code in this browser&apos;s ledger. Cast a vote on the{" "}
          <a href="/vote">Vote</a> page first, or check the code.
        </p>
      )}

      {result && (
        <div className="receipt" style={{ marginTop: 18 }}>
          <p className="notice" style={{ marginBottom: 14 }}>
            ✓ Recorded as cast. Your ballot is included in the tally.
          </p>
          <table className="pu">
            <tbody>
              <tr>
                <th>Tracking code</th>
                <td className="mono">{result.trackingCode}</td>
              </tr>
              <tr>
                <th>Polling unit</th>
                <td>
                  {result.puId} — {pollingUnitById(result.puId)?.name}
                </td>
              </tr>
              <tr>
                <th>Recorded at</th>
                <td>{new Date(result.recordedAt).toLocaleString()}</td>
              </tr>
              <tr>
                <th>Your choice</th>
                <td>
                  <em className="muted">
                    🔒 Not revealed — by design. The commitment hides it and the receipt cannot
                    prove it to a coercer.
                  </em>
                </td>
              </tr>
              <tr>
                <th>Commitment</th>
                <td className="mono">{result.commitment.slice(0, 40)}…</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="card"><p className="muted">Loading…</p></div>}>
      <VerifyInner />
    </Suspense>
  );
}
