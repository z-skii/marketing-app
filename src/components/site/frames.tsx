/* eslint-disable @next/next/no-img-element */
/**
 * Device frames for the public site. Every image inside one is a real
 * production capture from public/marketing/frames: a 390x844 screen at 2x
 * or a 1440x900 desktop screen, taken from the running product with demo
 * accounts. The frames are fluid: the phone scales from the --w custom
 * property, so the same markup serves the phone strip and the desktop stage.
 */

type Loading = { eager?: boolean };

export function PhoneFrame({ name, alt, eager }: { name: string; alt: string } & Loading) {
  return (
    <div className="site-phone">
      <div className="site-phone-screen">
        <img src={`/marketing/frames/${name}.webp`} alt={alt} width={390} height={844} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : undefined} />
      </div>
    </div>
  );
}

export function BrowserFrame({ name, alt, eager }: { name: string; alt: string } & Loading) {
  return (
    <div className="site-browser">
      <div className="site-browser-strip" aria-hidden><span /><span /><span /></div>
      <img src={`/marketing/frames/${name}.webp`} alt={alt} width={1440} height={900} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

/** Supporting photography: a real photograph at its own ratio, never a screen. */
export function Photo({ src, alt, ratio, width, height, eager, className = "" }: { src: string; alt: string; ratio: "wide" | "portrait" | "square"; width: number; height: number; className?: string } & Loading) {
  return (
    <div className={`site-photo is-${ratio} ${className}`}>
      <img src={src} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}
