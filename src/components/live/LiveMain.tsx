/**
 * Arranges the live surfaces as ONE screen at every size. No tabs, no swipe:
 * The Spot, the Top 3, and the Board window are all simultaneously visible.
 * Desktop puts The Spot beside the Top 3 rail with the Board running under
 * both; phones stack the same surfaces in a compact column, with The Spot as
 * the largest block. The panels arrive server-rendered as props; this is pure
 * layout.
 */
export function LiveMain({
  spot,
  top,
  board,
}: {
  spot: React.ReactNode;
  top: React.ReactNode;
  board: React.ReactNode;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(clamp(10.5rem,34vh,19rem),1fr)_auto_auto] short:grid-rows-[minmax(12rem,1fr)_auto_auto] lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto]">
      <section
        aria-label="The Spot"
        className="flex min-h-0 flex-col lg:col-span-8 lg:row-start-1 lg:border-r lg:border-rule"
      >
        {spot}
      </section>

      <section
        aria-label="Top 3"
        className="flex min-h-0 flex-col border-t border-rule lg:col-span-4 lg:row-start-1 lg:border-t-0"
      >
        {top}
      </section>

      <section
        aria-label="The Board"
        className="flex min-h-0 flex-col border-t-[1.5px] border-ink lg:col-span-12 lg:row-start-2"
      >
        {board}
      </section>
    </div>
  );
}
