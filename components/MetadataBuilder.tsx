"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton.tsx";

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

function clean(input: string): string {
  const s = input.trim();
  const url = s.match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i);
  return (url ? url[1] : s).replace(/^@/, "");
}

/** Builds the metadata and description line for a token, from the handle the creator types. */
export function MetadataBuilder() {
  const [raw, setRaw] = useState("");
  const handle = clean(raw);
  const valid = HANDLE_RE.test(handle);
  const shown = valid ? handle : "yourhandle";
  const json = JSON.stringify({ name: "My Token", symbol: "MINE", description: `fees to @${shown}`, feeRecipient: `@${shown}` }, null, 2);
  const line = `fees to @${shown}`;

  return (
    <div className="builder">
      <label className="field">
        <span>X handle that gets the fees</span>
        <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="@handle or x.com/handle" autoComplete="off" />
      </label>
      {raw && !valid && <p className="field-error">That isn't a valid X handle: 1–15 letters, numbers or underscores.</p>}

      <div className="copy-row">
        <div>
          <div className="copy-label">Description line (if the launch form only has a description)</div>
          <code>{line}</code>
        </div>
        <CopyButton text={line} />
      </div>
      <div className="copy-block">
        <div className="copy-head">
          <span className="copy-label">Metadata JSON</span>
          <CopyButton text={json} />
        </div>
        <pre>{json}</pre>
      </div>
    </div>
  );
}
