import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-14 flex items-center px-5 border-b border-border bg-surface">
        <Link href="/" className="font-semibold tracking-tight text-[15px]">{SITE_NAME}</Link>
        <span className="hidden sm:inline ml-3 text-[12.5px] text-text-3">{SITE_TAGLINE}</span>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
