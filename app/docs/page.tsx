import Link from "next/link";
import { listDocs } from "@/lib/docs";

export const dynamic = "force-static";

export default function DocsIndex() {
  const docs = listDocs();
  return (
    <>
      <div className="card">
        <span className="pill">The proposal</span>
        <h1 style={{ marginBottom: 4 }}>NaijaVote design documentation</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          The full, evidence-driven design study — architecture, cryptography, threat model,
          Nigerian legal analysis, cost, ethics, and the honest answer to whether blockchain is
          genuinely the right tool. Read the{" "}
          <Link href="/docs/14-final-recommendation">final recommendation</Link> if you read only
          one.
        </p>
      </div>
      <div className="grid cols-2">
        {docs.map((d) => (
          <Link key={d.slug} className="card" href={`/docs/${d.slug}`} style={{ display: "block" }}>
            <div className="small muted">{d.slug}</div>
            <strong>{d.title}</strong>
          </Link>
        ))}
      </div>
    </>
  );
}
