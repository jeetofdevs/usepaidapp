// X handles: 1–15 chars, letters, digits, underscore.
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export function normalizeHandle(input: string): string | null {
  let s = input.trim();
  const url = s.match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i);
  if (url) s = url[1];
  s = s.replace(/^@/, "");
  if (!HANDLE_RE.test(s)) return null;
  return s.toLowerCase();
}

export type TokenMetadata = {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  twitter?: string;
  x?: string;
  [key: string]: unknown;
};

/**
 * Finds the X account a token routes its fees to.
 * Checked in order: an explicit `feeRecipient` / `x` / `twitter` field,
 * then a "fees: @handle" (or "fees to @handle") marker in the description.
 */
export function handleFromMetadata(meta: TokenMetadata): string | null {
  for (const key of ["feeRecipient", "x", "twitter"]) {
    const v = meta[key];
    if (typeof v === "string") {
      const h = normalizeHandle(v);
      if (h) return h;
    }
  }
  if (typeof meta.description === "string") {
    const m = meta.description.match(/fees?\s*(?:to|:|->|→)\s*@([A-Za-z0-9_]{1,15})\b/i);
    if (m) return normalizeHandle(m[1]);
  }
  return null;
}
