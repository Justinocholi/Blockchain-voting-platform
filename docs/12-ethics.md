# 12 — Ethical Considerations

*Covers brief §14 (Ethical Considerations).*

Technology in elections is never neutral. A voting system encodes a theory of who
gets to participate, who holds power, and who is trusted. We assess the ethical
risks candidly and propose safeguards.

---

## 1. Risk of digital exclusion

**Risk:** A technology-forward system can disenfranchise the elderly, rural, poor,
disabled, low-literacy, and device-less — who are disproportionately certain
demographics and regions. Disenfranchisement-by-design is not a side effect; it
*changes who wins*.

**Safeguards:**
- **Paper-first, offline-first** — the voter needs no device, no literacy beyond
  recognizing a logo, no connectivity ([06](06-accessibility.md), [05](05-offline-connectivity.md)).
- **We explicitly reject internet/app voting** precisely because it would
  concentrate participation among the connected ([14](14-final-recommendation.md)).
- Exclusion is tracked as a **Critical risk** with published, disaggregated
  metrics and an ombudsman ([04 T14](04-security-threat-model.md), [06 §5](06-accessibility.md)).

---

## 2. Concentration of power

**Risk:** A single entity (INEC, an incumbent, a vendor) controlling the election
system can quietly tilt outcomes — the deepest danger of *any* central electoral
technology.

**Safeguards:**
- **Separation of powers in the validator set** — rival institutions (judiciary,
  opposition, observers, academia) co-witness; **no single actor can rewrite
  history** ([01 §6](01-architecture.md)).
- **Threshold cryptography** — no single party can decrypt or certify alone ([03](03-cryptography-and-privacy.md)).
- **External public-chain anchoring** — even a fully colluding consortium is caught.
- **Open source + reproducible builds** — no hidden vendor logic.
- **Paper + RLA** — the ultimate check that survives total digital capture.

> The architecture's central ethical commitment: **distribute the power to define
> reality.** No one should be able to *assert* the result; everyone should be able
> to *verify* it.

---

## 3. Potential misuse by authorities

**Risk:** Biometric/identity infrastructure built for voting can be repurposed for
**surveillance**, voter suppression, or profiling — a grave danger in any state.

**Safeguards:**
- **Data minimization & purpose limitation** in law and code: PII/biometrics used
  *only* for accreditation, **never on the ledger**, never centralized into new
  surveillance honeypots ([07 §4](07-governance-legal.md), [09 §4](09-technical-architecture.md)).
- **No voter-choice data linkable to identity exists anywhere** — the system *cannot*
  reveal how anyone voted, even under state pressure, because that link is never created.
- **Independent oversight** (NDPC, judiciary, observers) and statutory penalties
  for repurposing.
- **Sunset & audit** of biometric processing; data residency in Nigeria.

---

## 4. Privacy implications

**Risk:** Immutable ledgers + personal data = permanent, irreversible exposure;
biometrics, once leaked, cannot be reissued.

**Safeguards:**
- **PII and ballots never on-chain**; only hashes/commitments ([01 §7](01-architecture.md)).
- **Coercion-resistant E2E-V**: voters can verify *inclusion* but cannot *prove
  choice* — protecting against vote-buying *and* over-disclosure ([03](03-cryptography-and-privacy.md)).
- **Biometric templates stay on-device / in existing protected register**, not a
  new central trove.
- **NDPA compliance, DPIA, post-quantum-aware long-term secrecy** for any
  long-lived commitments.

---

## 5. Public-perception challenges

**Risk:** "Blockchain voting" can be **over-hyped** (false confidence) or
**weaponized by losers** ("the computers were rigged") — both corrosive. Equally,
opacity breeds conspiracy.

**Safeguards:**
- **Honest marketing.** Do not oversell. Communicate clearly that **paper is the
  vote** and blockchain is a *transparency/audit layer*, not magic. Overpromising
  is itself an ethical failure that erodes trust when reality falls short.
- **Public mock elections** inviting attack — credibility through demonstrated
  resilience, not slogans ([08 §3.6](08-transparency.md)).
- **Verification civil society** — fund observers/journalists/academics who
  independently confirm results, so trust flows through credible intermediaries.
- **Transparency about limitations** — publish what the system does *not* protect
  against (coercion at home, vote-buying without proof) so expectations are honest.

---

## 6. The meta-ethic: legitimacy over novelty

The gravest ethical failure would be to deploy an impressive-sounding system that
**looks** trustworthy but isn't auditable by ordinary, software-independent means —
giving a false patina of legitimacy to a riggable process. Our entire design
resists this by making **paper + public audit primary** and treating every digital
component as something that must *prove itself* to skeptics, including the losing
side. A democratic technology must be **trustworthy to those who lose**, not just
convenient for those who run it.

> If we cannot make the losing candidate's own agents able to verify they lost,
> we have not built a voting system — we have built a more sophisticated way to be
> distrusted. That is the ethical bar, and it is the bar the design is built to clear.
