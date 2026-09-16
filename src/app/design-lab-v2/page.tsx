import Link from "next/link";

/** The V2 Design Lab index: the four experiences of the first phase. Fixture data only. */
export default function V2Index() {
  const routes = [
    { href: "/design-lab-v2/site", label: "Public Homepage" },
    { href: "/design-lab-v2/home", label: "User Home" },
    { href: "/design-lab-v2/profile", label: "User Profile" },
    { href: "/design-lab-v2/business", label: "Business Home" },
  ];
  return (
    <main style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, margin: "0 0 16px" }}>TapMart V2 Design Lab</h1>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {routes.map((r) => <li key={r.href}><Link href={r.href} style={{ display: "block", padding: "12px 0", borderTop: "1px solid #ccc" }}>{r.label}</Link></li>)}
      </ul>
    </main>
  );
}
