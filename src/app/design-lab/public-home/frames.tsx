/**
 * The public phone frame. Built at its logical 402x864 outer size (a
 * 390x844 viewport with 6px side and 10px top and bottom graphite bezels,
 * a 30px outer and 24px viewport radius), then scaled as one object to the
 * requested display width so the proportions never drift.
 */
export function PhoneFrame({ src, alt, width, className = "", children }: { src?: string; alt: string; width: number; className?: string; children?: React.ReactNode }) {
  const scale = width / 402;
  return (
    <div className={`pub-phone ${className}`} style={{ width, height: Math.round(864 * scale) }}>
      <div className="pub-phoneframe" style={{ transform: `scale(${scale})`, boxShadow: "var(--tm-shadow-device)" }}>
        <div className="pub-phoneframe-screen">
          {children ?? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} width={390} height={844} />
          )}
        </div>
      </div>
    </div>
  );
}

/** The public browser frame: a 32px title strip, a 1px boundary, 10px outer radius, around a real 1440x1000 capture. */
export function BrowserFrame({ src, alt, children }: { src?: string; alt: string; children?: React.ReactNode }) {
  return (
    <div className="pub-browser">
      <div className="pub-browser-strip" aria-hidden><span /><span /><span /></div>
      {children ?? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
      )}
    </div>
  );
}
