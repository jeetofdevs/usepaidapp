import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pkceChallenge, sign, verify } from "../lib/session.ts";

test("signed sessions verify, and reject tampering, wrong keys and expiry", () => {
  const token = sign({ handle: "alice", exp: Date.now() + 60_000 }, "k1");
  assert.equal(verify<{ handle: string; exp: number }>(token, "k1")?.handle, "alice");
  assert.equal(verify(token, "k2"), null);

  const [body, mac] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ handle: "mallory", exp: Date.now() + 60_000 })).toString("base64url");
  assert.equal(verify(`${forged}.${mac}`, "k1"), null);
  assert.equal(verify(`${body}.`, "k1"), null);
  assert.equal(verify(undefined, "k1"), null);

  const expired = sign({ handle: "alice", exp: Date.now() - 1 }, "k1");
  assert.equal(verify(expired, "k1"), null);
});

test("pkceChallenge is unpadded base64url of SHA-256", () => {
  const verifier = "abc-DEF_123.~xyz";
  const expected = createHash("sha256").update(verifier).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const got = pkceChallenge(verifier);
  assert.equal(got, expected);
  assert.match(got, /^[A-Za-z0-9_-]{43}$/);
});
