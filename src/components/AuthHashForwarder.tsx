"use client";

import { useEffect } from "react";

/**
 * Supabase clamps a sign-in link's redirect target to the bare site URL when
 * the exact path isn't on its allow list, which strands the visitor on the
 * homepage with their tokens sitting in the URL fragment. Any page that loads
 * with auth tokens in the fragment forwards them to /auth/confirm, where the
 * sign-in actually completes.
 */
export function AuthHashForwarder() {
  useEffect(() => {
    const { pathname, hash } = window.location;
    if (pathname !== "/auth/confirm" && /(^#|&)(access_token|error_description)=/.test(hash)) {
      window.location.replace("/auth/confirm" + hash);
    }
  }, []);
  return null;
}
