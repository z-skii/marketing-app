/** The system's empty-state card: an icon tile, a title, one honest sentence, optionally one action. */
export function EmptyCard({ icon, title, copy, action }: { icon: React.ReactNode; title: string; copy: string; action?: React.ReactNode }) {
  return (
    <div className="card reveal flex min-h-[128px] flex-col p-[18px]">
      <div className="flex items-start gap-3">
        <span className="icon-square">{icon}</span>
        <div className="min-w-0 pt-0.5">
          <p className="font-display text-[15px] leading-[19px] font-[740] tracking-[-0.15px]">{title}</p>
          <p className="mt-1 text-[13px] leading-[18px] text-ink-soft">{copy}</p>
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
