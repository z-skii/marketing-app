"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * A fixture image that is not requested until it is needed: either when
 * `when` turns true (a beat the film has reached) or, without `when`,
 * when the element comes within `margin` of the viewport. The browser's
 * own lazy loading distance on a short phone document pulls later scene
 * media into the first load; this keeps the first load to what the hero
 * paints. Width and height reserve the space before the file exists.
 */
export function LateImg({ src, srcSet, when, margin = 720, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string; when?: boolean; margin?: number }) {
  const ref = useRef<HTMLImageElement>(null);
  const [seen, setSeen] = useState(false);
  const on = when === true || seen;
  useEffect(() => {
    if (on || when === false) return;
    const el = ref.current; if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: `${margin}px 0px` });
    io.observe(el); return () => io.disconnect();
  }, [on, when, margin]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={on ? src : undefined} srcSet={on ? srcSet : undefined} alt={alt} decoding="async" {...rest} style={{ ...(rest.style ?? {}), visibility: on ? undefined : "hidden" }} />;
}
