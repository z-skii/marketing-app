import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Rail } from "../parts";
import { loopday, contentFiles, shoots, upcomingPosts } from "../mock";
import { ContentWorkspace } from "./ContentWorkspace";

/**
 * Prototype 04: Business Content on desktop. One real delivered original
 * contained in a graphite stage, a filmstrip of the other actual files,
 * and one white decisive inspector: file state, provenance, caption, a
 * separate post state, and the actions. No money anywhere in review.
 * Then the independent service rows. Fixture data only.
 */
export function BusinessContentScreen({ embed = false }: { embed?: boolean } = {}) {
  const newCount = contentFiles.filter((f) => f.state === "New").length;
  return (
    <div className="desk">
      <Rail mode="Business" active="Content" business={{ name: loopday.name, logo: loopday.logo, initials: loopday.initials }} />
      <main className="desk-main" id={embed ? undefined : "main"} style={{ paddingTop: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <h1 className="t-page" style={{ margin: 0 }}>Content</h1>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{loopday.plan} · {loopday.planState} · <Link href="#plan" style={{ color: "var(--tm-accent)" }}>Manage plan</Link></p>
          </div>
          <Link href="#brand" className="btn btn-secondary">Brand kit</Link>
        </div>
        <div className="filters" role="group" aria-label="Views" style={{ marginTop: 20 }}>
          {["Overview", "Library", "Calendar", "Shoots"].map((v, i) => <button key={v} type="button" aria-pressed={i === 0} style={{ fontSize: 16 }}>{v}</button>)}
        </div>

        <div style={{ marginTop: 16, height: 30, display: "flex", alignItems: "baseline", gap: 16 }}>
          <h2 className="t-section" style={{ margin: 0, fontSize: 24, lineHeight: "30px" }}>Ready to review</h2>
          <p className="t-meta" style={{ margin: 0 }}>{newCount} file needs approval · {contentFiles.length} delivered files</p>
        </div>

        <ContentWorkspace files={contentFiles} shootLabel="Shoot 01 · May 7, 2026" uploader="Imani Cole" />

        <section aria-labelledby="shoots-title" style={{ marginTop: 32, maxWidth: 816 }}>
          <h2 id="shoots-title" className="t-section" style={{ margin: 0, fontSize: 24, lineHeight: "30px" }}>This month&apos;s shoots</h2>
          {shoots.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <hr className="divider" />}
              <Link href={`#${s.id}`} className="row-link" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, alignItems: "center", minHeight: 72, padding: "12px 0" }}>
                <span>
                  <span className="t-task" style={{ display: "block" }}>{s.title}{s.when ? <span className="t-meta"> · {s.when}</span> : null}</span>
                  <span className="t-meta" style={{ display: "block" }}>
                    <span className={`status ${s.delivery ? "confirmed" : "neutral"}`}>{s.state}</span>{s.delivery ? ` · ${s.delivery} · ${s.files}` : ""} · {s.planned}
                  </span>
                  {s.creator && <span className="t-meta" style={{ display: "block" }}>Assigned creator {s.creator.name}{s.creator.verified ? " · Verified creator" : ""}</span>}
                </span>
                <ArrowRight size={20} aria-hidden style={{ color: "var(--tm-accent)" }} />
              </Link>
            </div>
          ))}
        </section>

        <section aria-labelledby="posts-title" style={{ marginTop: 32, maxWidth: 816 }}>
          <h2 id="posts-title" className="t-section" style={{ margin: 0, fontSize: 24, lineHeight: "30px" }}>Upcoming posts</h2>
          {upcomingPosts.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <hr className="divider" />}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, alignItems: "center", minHeight: 64, padding: "12px 0" }}>
                <span>
                  <span className="t-task" style={{ display: "block" }}>{p.title} <span className="t-meta">· {p.platform}</span></span>
                  <span className="t-meta" style={{ display: "block" }}><span className={`status ${p.state === "Failed" ? "problem" : "waiting"}`}>{p.state}</span>{p.when ? ` · ${p.when}` : ""} · {p.note}</span>
                </span>
                {p.state === "Failed" && <Link href="#connections" className="btn btn-secondary btn-sm">Open Connections</Link>}
              </div>
            </div>
          ))}
        </section>
        <p className="t-meta" style={{ marginTop: 24 }}>Demo content service · fictional shoot and files</p>
      </main>
    </div>
  );
}
