/** The public phone frame: 390x844 logical viewport, 6px side and 10px top and bottom bezels, graphite, no ornament. */
export function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`pub-phoneframe ${className}`} style={{ boxShadow: "var(--tm-shadow-device)" }}>
      <div className="pub-phoneframe-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </div>
    </div>
  );
}

/** The public browser frame: a 32px title strip, a 1px boundary, 10px outer radius, around a real 1440x1000 capture. */
export function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="pub-browser">
      <div className="pub-browser-strip" aria-hidden><span /><span /><span /></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

