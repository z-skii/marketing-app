"use client";

import { useEffect } from "react";

/**
 * The auth provider clamps an email link's redirect target to the bare site
 * URL when the exact path isn't on its allow list, which strands the visitor
 * on the homepage with their tokens sitting in the URL fragment. Any page
 * that loads with auth tokens in the fragment forwards them where they
 * belong: password-recovery tokens to /auth/reset, verification tokens to
 * /auth/confirm.
 */
export function AuthHashForwarder() {
  useEffect(() => {
    const { pathname, hash } = window.location;
    // The /auth/* pages read their own fragments; never redirect them.
    if (pathname.startsWith("/auth/")) return;
    if (!/(^#|&)(access_token|error_description|error_code)=/.test(hash)) return;

    const recovery = /(^#|&)type=recovery(&|$)/.test(hash);
    const target = recovery ? "/auth/reset" : "/auth/confirm";
    window.location.replace(target + hash);
  }, []);
  return null;
}
