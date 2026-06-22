// Lightweight client-side crypto helpers used to *simulate* the tamper-evident
// ledger, device signatures and vote commitments. These are illustrative only —
// the real design (see /docs) uses threshold cryptography, blind signatures and
// a permissioned Hyperledger Fabric ledger.

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function shortHash(h: string, n = 16): string {
  if (!h) return "";
  return h.length > n ? h.slice(0, n) + "…" : h;
}

export function randomHex(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
