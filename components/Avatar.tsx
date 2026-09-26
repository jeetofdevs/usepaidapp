"use client";

import { useState } from "react";

const TEMPLATE = process.env.NEXT_PUBLIC_AVATAR_URL_TEMPLATE ?? "https://unavatar.io/x/{handle}";

/** X profile picture, falling back to the handle's initial if it can't load. */
export function Avatar({ handle, size = 64 }: { handle: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = TEMPLATE ? TEMPLATE.replace("{handle}", encodeURIComponent(handle)) : "";
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        handle[0]?.toUpperCase()
      )}
    </div>
  );
}
