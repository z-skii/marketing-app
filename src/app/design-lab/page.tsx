import Link from "next/link";

const SCREENS = [
  { href: "/design-lab/user-home", name: "User Home", viewport: "phone 390x844" },
  { href: "/design-lab/user-profile", name: "User Profile", viewport: "phone 390x844" },
  { href: "/design-lab/business-home", name: "Business Home", viewport: "desktop 1440x900" },
  { href: "/design-lab/business-content", name: "Business Content", viewport: "desktop 1440x900" },
  { href: "/design-lab/public-home", name: "Public Homepage", viewport: "desktop 1440 and phone 390" },
];

export default function DesignLabIndex() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>TapMart Design Lab</h1>
      <p style={{ opacity: 0.7 }}>Coded prototypes of the round two visual direction. Mock data only; nothing here is the product.</p>
      <ul style={{ paddingLeft: 18, lineHeight: 1.9 }}>
        {SCREENS.map((s) => <li key={s.href}><Link href={s.href}>{s.name}</Link> <span style={{ opacity: 0.6 }}>({s.viewport})</span></li>)}
      </ul>
    </main>
  );
}
