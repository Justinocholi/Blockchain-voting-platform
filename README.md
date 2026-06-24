# NaijaVote — Blockchain-Backed Electronic Voting Platform for Nigeria

**A production-grade design proposal prepared for the Independent National Electoral Commission (INEC)**

> Status: Design proposal (not yet implemented). Version 1.0 — June 2026.

---

## ⚠️ Read this first: the headline finding

This proposal was commissioned to design a "blockchain voting system." After a
rigorous, multi-disciplinary evaluation, our honest, evidence-driven conclusion
is deliberately **counter to the brief**:

> **A public, blockchain-as-the-vote-ledger system is *not* the right architecture
> for Nigeria.** What Nigeria actually needs is a **transparent, end-to-end
> verifiable (E2E-V) election system** in which a **permissioned, distributed
> append-only ledger plays a *narrow but valuable role*** — as a tamper-evident
> bulletin board and audit log — sitting on top of a fundamentally
> **paper-anchored, software-independent** voting process.**

In plain terms: **blockchain is a supporting component, not the foundation.** The
single most important property of a trustworthy election — *software
independence* (an undetected change in software cannot cause an undetectable
change in the outcome) — is delivered by **voter-verified paper ballots plus
risk-limiting audits**, not by a ledger. Blockchain does not solve the hard
problems of voting (coercion, malware on the voter's device, the
secret-ballot/verifiability tension). Where it genuinely helps is in making
**aggregation, transmission, and public auditability** tamper-evident and
non-repudiable — which is, not coincidentally, exactly where Nigeria's elections
have historically been most contested (collation and results transmission).

We were asked to "challenge assumptions where necessary." This is us doing that.
The full reasoning is in **[docs/14-final-recommendation.md](docs/14-final-recommendation.md)**.
The rest of the proposal then designs the best possible *hybrid* system on that
basis, because the realistic political reality is that "blockchain" will be in
the mandate whether or not it is strictly optimal — so we make it count.

---

## Executive summary

Nigeria runs one of the largest, most logistically demanding elections on earth:
**93.4M+ registered voters** (2023), **176,000+ polling units**, six concurrent
ballot types (Presidential, Governorship, Senate, House of Representatives, State
House of Assembly, and LGA elections), across **36 states + the FCT**, under
severe constraints: unreliable grid power, patchy 2G/3G/4G coverage, low average
digital literacy, and — most importantly — **low public trust** rooted in a
history of disputed collation and results transmission.

INEC has already moved decisively toward technology: the **Bimodal Voter
Accreditation System (BVAS)** (fingerprint + facial accreditation, replacing the
older Smart Card Reader) and the **INEC Result Viewing Portal (IReV)** are now
core infrastructure, backed by the **Electoral Act 2022**, which gives legal
standing to electronic accreditation and electronic transmission of results. Our
design **builds on BVAS and IReV rather than replacing them.**

### What we recommend

1. **Keep the ballot on paper, voter-verified.** Every vote is cast on a
   human-readable paper ballot (or produced by a ballot-marking device that
   prints one). The paper is the legal record of truth.
2. **Make collation cryptographically tamper-evident.** Polling-unit results are
   signed at source on BVAS-class devices and published to a **permissioned
   consortium ledger** (Hyperledger Fabric) acting as a national, append-only,
   multi-party-witnessed **public bulletin board** — the digital successor to
   IReV with non-repudiation built in.
3. **Adopt end-to-end verifiability (E2E-V).** Voters receive a privacy-preserving
   receipt that lets them confirm their vote was *recorded as cast* and *counted
   as recorded*, **without** being able to prove *how* they voted (coercion
   resistance).
4. **Mandate Risk-Limiting Audits (RLAs).** Statistically rigorous,
   publicly-observable manual audits of the paper provide *software-independent*
   confidence in every contest.
5. **Govern the ledger as a consortium**, with validator/orderer nodes operated
   by institutionally-separated stakeholders: INEC, the Judiciary (NJC), the
   National Assembly's nominee, the NHRC, accredited domestic observer coalitions
   (e.g. YIAGA Africa-class), academic institutions, and registered political
   party representatives — so that **no single actor can rewrite history.**
6. **Design offline-first.** Polling units operate fully offline and synchronize
   signed results opportunistically; the system never assumes connectivity at the
   point of voting.

### What we explicitly reject

- ❌ **Internet/remote voting from personal devices** at national scale — the
  device-malware and coercion risks are, by scientific consensus, currently
  unmanageable for binding political elections.
- ❌ **Public proof-of-work / proof-of-stake chains** (Ethereum L1, Bitcoin) as
  the system of record — wrong governance model, wrong cost profile, no privacy,
  unjustified energy use, and no actual security benefit over a permissioned
  ledger for this use case.
- ❌ **"The blockchain is the ballot box"** framing — it is not; the paper is.

---

## How to read this proposal

| # | Document | Covers brief sections |
|---|----------|----------------------|
| 00 | **README.md** (this file) | Executive summary, headline recommendation |
| 01 | [Blockchain & system architecture](docs/01-architecture.md) | §2, §11 |
| 02 | [Identity, registration & the voting workflow](docs/02-identity-and-voting.md) | §3, §4 |
| 03 | [Cryptography & privacy](docs/03-cryptography-and-privacy.md) | §5 |
| 04 | [Security threat model & risk register](docs/04-security-threat-model.md) | §6, §15 (risk register) |
| 05 | [Offline & low-connectivity operation](docs/05-offline-connectivity.md) | §7 |
| 06 | [Accessibility & inclusion](docs/06-accessibility.md) | §8 |
| 07 | [Governance & legal framework](docs/07-governance-legal.md) | §9 |
| 08 | [Transparency & public trust](docs/08-transparency.md) | §10 |
| 09 | [Technical architecture, APIs, data & DevSecOps](docs/09-technical-architecture.md) | §11 |
| 10 | [Performance & scalability](docs/10-performance-scalability.md) | §12 |
| 11 | [Cost & phased implementation](docs/11-cost-implementation.md) | §13 |
| 12 | [Ethical considerations](docs/12-ethics.md) | §14 |
| 13 | [Sample smart-contract pseudocode](docs/13-smart-contract-pseudocode.md) | §15 (pseudocode) |
| 14 | [Final recommendation: is blockchain genuinely advantageous?](docs/14-final-recommendation.md) | §15 (final rec) |

Diagrams use [Mermaid](https://mermaid.js.org/) and render natively on GitHub.

---

## Guiding design principles

1. **Software independence first.** No software bug or compromise should be able
   to change the outcome without detection. Paper + RLA delivers this; crypto and
   blockchain make detection *faster and more public*, not *possible in the first
   place*.
2. **Don't digitize what you can't audit.** Every digital step must have an
   independent, human-checkable counterpart.
3. **Distrust by design.** Assume insiders, vendors, and even some validators are
   adversarial. Security must come from separation of powers and verifiable math,
   not from trusting any institution.
4. **Inclusion is a security property.** A system that excludes the elderly,
   rural, disabled, or low-literacy voter is not merely unkind — it changes
   outcomes and destroys legitimacy.
5. **Legitimacy > novelty.** The goal is *trusted* elections, not *innovative*
   ones. Every technical choice is justified by whether it increases justified
   public trust.

---

## Authors

Prepared by a cross-functional team: blockchain architecture, election-systems
engineering, cybersecurity, applied cryptography, Nigerian constitutional law,
DevSecOps, product management, and UX/accessibility design.

*This is an independent design study. It is not affiliated with or endorsed by
INEC. Cost and volume figures are estimates for planning purposes and must be
validated against procurement reality.*
