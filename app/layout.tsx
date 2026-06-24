import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "NaijaVote — Paper-anchored, blockchain-witnessed voting (Demo)",
  description:
    "Interactive demonstration of the NaijaVote design: a paper-anchored, end-to-end verifiable election with a permissioned consortium ledger as a tamper-evident bulletin board.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="demo-banner">
          ⚠️ Demonstration / simulation only — fictional candidates, no real ballots,
          no real cryptography. Read the design rationale in <a href="/docs">Docs</a>.
        </div>
        <header className="site">
          <div className="row">
            <a className="brand" href="/">
              <span className="dot" /> NaijaVote
            </a>
            <Nav />
          </div>
        </header>
        <main>
          <div className="container">{children}</div>
        </main>
        <footer className="site">
          <div className="container">
            NaijaVote is an independent design study and demo. Not affiliated with INEC.
            The vote is paper; the ledger is a witness. See{" "}
            <a href="/docs/14-final-recommendation">the final recommendation</a>.
          </div>
        </footer>
      </body>
    </html>
  );
}
