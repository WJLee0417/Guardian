export async function generateHash(payload: string): Promise<string> {
  const cryptoApi = globalThis.crypto?.subtle;
  if (cryptoApi) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await cryptoApi.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

export function shortHash(hash?: string): string {
  if (!hash) return "-";
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}
