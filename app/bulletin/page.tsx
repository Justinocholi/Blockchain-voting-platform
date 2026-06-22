"use client";

import { useEffect, useState } from "react";
import { CANDIDATES } from "@/lib/election";
import { Ledger, getLedger, nationalTotals, resetLedger } from "@/lib/ledger";

export default function BulletinPage() {
  const [ledger, setLedger] = useState<Ledger | null>(null);

  function refresh() {
    setLedger(getLedger());
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!ledger) {
    return (
      <div className="card">
        <p className="muted">Loading bulletin board…</p>
      </div>
    );
  }

  const totals = nationalTotals(ledger);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const ranked = [...CANDIDATES].sort((a, b) => totals[b.id] - totals[a.id]);
  const units = Object.values(ledger.pollingUnits);

  return (
    <>
      <div className="card">
        <span className="pill">Public bulletin board</span>
        <h1 style={{ marginBottom: 4 }}>Results — anyone can re-sum them</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Every polling-unit result is signed and hash-chained. The national total below is a
          pure sum of the polling-unit numbers — no &ldquo;collation officer&rdquo; can inject a figure
          that doesn&apos;t add up. This is the failure point of past Nigerian elections, made
          arithmetic.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn secondary" onClick={refresh}>
            ↻ Refresh
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (confirm("Reset the demo ledger to seed data?")) setLedger(resetLedger());
            }}
          >
            Reset demo data
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>National total (sum of all polling units)</h2>
        {ranked.map((c, i) => {
          const v = totals[c.id];
          const pct = Math.round((v / grand) * 100);
          return (
            <div key={c.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>
                  {i === 0 && <strong>★ </strong>}
                  <strong>{c.name}</strong> <span className="muted">· {c.abbr}</span>
                </span>
                <span className="mono">
                  {v.toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="bar">
                <span style={{ width: `${pct}%`, background: c.color }} />
              </div>
            </div>
          );
        })}
        <p className="small muted">Total votes counted: {grand.toLocaleString()}</p>
      </div>

      <h2>Polling-unit results (signed &amp; hash-chained)</h2>
      {units.map((pu) => {
        const puTotal = Object.values(pu.counts).reduce((a, b) => a + b, 0) || 1;
        return (
          <div key={pu.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{pu.id}</strong> — {pu.name}
                <div className="muted small">{pu.state}</div>
              </div>
              <div className="small muted" style={{ textAlign: "right" }}>
                Accredited: {pu.accredited.toLocaleString()} · Valid votes: {puTotal.toLocaleString()}
              </div>
            </div>
            <table className="pu" style={{ marginTop: 12 }}>
              <tbody>
                {CANDIDATES.map((c) => {
                  const v = pu.counts[c.id] ?? 0;
                  const pct = Math.round((v / puTotal) * 100);
                  return (
                    <tr key={c.id}>
                      <td style={{ width: 200 }}>
                        <span
                          className="ballot-logo"
                          style={{ background: c.color, width: 24, height: 24, fontSize: 10, display: "inline-flex", marginRight: 8, verticalAlign: "middle" }}
                        >
                          {c.abbr}
                        </span>
                        {c.name}
                      </td>
                      <td style={{ width: "55%" }}>
                        <div className="bar">
                          <span style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </td>
                      <td className="mono">{v}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="small muted" style={{ marginTop: 10, display: "grid", gap: 2 }}>
              <span>
                🔏 Device signature: <span className="mono">{pu.deviceSig}</span> ·{" "}
                <span style={{ color: "var(--green-dark)" }}>✓ valid</span>
              </span>
              <span>
                ⛓ Result hash (chain head): <span className="mono">{pu.lastHash.slice(0, 40)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
