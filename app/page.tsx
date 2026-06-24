import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero card">
        <span className="pill">Design study · Interactive demo</span>
        <h1>A voting platform Nigerians can verify — not just trust.</h1>
        <p className="lead">
          NaijaVote keeps the <strong>paper ballot as the legal vote</strong>, accredits
          voters with biometrics (BVAS), and publishes every signed polling-unit result to a
          <strong> permissioned consortium ledger</strong> that acts as a tamper-evident,
          multi-institution bulletin board. Blockchain is the witness; paper and audits are
          the truth.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" href="/vote">
            ▶ Try the voting flow
          </Link>
          <Link className="btn secondary" href="/bulletin">
            View the live bulletin board
          </Link>
          <Link className="btn ghost" href="/docs">
            Read the full proposal
          </Link>
        </div>
      </section>

      <div className="grid cols-3">
        <div className="card">
          <h3>1 · Accredit</h3>
          <p className="muted small">
            Strong in-person verification (PVC + biometric) issues an anonymous, single-use
            voting token — proving eligibility without linking to your ballot.
          </p>
        </div>
        <div className="card">
          <h3>2 · Vote on paper</h3>
          <p className="muted small">
            You mark and verify a human-readable ballot. The paper is the record of truth and
            the basis for risk-limiting audits.
          </p>
        </div>
        <div className="card">
          <h3>3 · Verify</h3>
          <p className="muted small">
            Polling-unit results are signed and posted to the ledger. You can confirm your
            ballot was recorded — without revealing how you voted.
          </p>
        </div>
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>What this demo shows (and doesn&apos;t)</h2>
        <div className="grid cols-2">
          <div>
            <h3>✓ Demonstrated</h3>
            <ul className="muted">
              <li>One-person-one-vote accreditation &amp; duplicate prevention</li>
              <li>Paper-style ballot marking and confirmation</li>
              <li>Choice-hiding vote commitment &amp; receipt code</li>
              <li>Append-only, hash-chained polling-unit results</li>
              <li>Publicly re-summable collation (PU → national)</li>
              <li>Receipt verification without revealing the choice</li>
            </ul>
          </div>
          <div>
            <h3>✗ Simulated, not real</h3>
            <ul className="muted">
              <li>No real biometrics, threshold crypto, or blind signatures</li>
              <li>The &ldquo;ledger&rdquo; is your browser&apos;s local storage, not a real consortium chain</li>
              <li>No real Hyperledger Fabric / BFT consensus running</li>
              <li>Hashes illustrate tamper-evidence; they are not a security guarantee</li>
            </ul>
            <p className="small">
              The honest engineering, threat model, cryptography and the question
              &ldquo;is blockchain even the right tool?&rdquo; are all in the{" "}
              <Link href="/docs">design docs</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
