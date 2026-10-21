// Mirror of pipeline/obfuscate.py: base64, then XOR with the bytes of "<id>:nearby".

const SALT = "nearby";

export function decodeTarget(token: string, puzzleId: number): string {
  const key = new TextEncoder().encode(`${puzzleId}:${SALT}`);
  const bytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
  const out = bytes.map((b, i) => b ^ key[i % key.length]!);
  return new TextDecoder().decode(out);
}
