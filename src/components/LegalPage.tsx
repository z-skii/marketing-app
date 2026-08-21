import { Header } from "./Header";
import { Footer } from "./Footer";

/** Shared shell for the policy pages: one readable column, no decoration. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header user={null} />
      <main id="main" className="shell py-12 md:py-20">
        <article className="max-w-2xl">
          <h1 className="font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] md:text-5xl">
            {title}
          </h1>
          <p className="eyebrow mt-4">Last updated {updated}</p>
          <div className="mt-10 flex flex-col gap-6 text-ink-soft [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-700 [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
            {children}
          </div>
          <p className="rule mt-14 pt-6 font-mono text-xs text-ink-faint">
            These are starter product documents written for an early build. Have them
            reviewed by a lawyer before operating at any scale.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
