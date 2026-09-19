import type { CSSProperties, ReactNode } from "react";

/** A realistic phone frame: dark body, rounded screen, a small notch. Children fill the screen. */
export function Phone({ children, className = "", style, large = false }: { children: ReactNode; className?: string; style?: CSSProperties; large?: boolean }) {
  return (
    <div className={`lp-phone ${large ? "is-lg" : ""} ${className}`} style={style} aria-hidden>
      <span className="lp-phone-notch" />
      <div className="lp-phone-screen">{children}</div>
    </div>
  );
}

/** A laptop frame for the business composition. */
export function Laptop({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`lp-laptop ${className}`} style={style} aria-hidden>
      <div className="lp-laptop-screen">{children}</div>
      <div className="lp-laptop-base" />
    </div>
  );
}
