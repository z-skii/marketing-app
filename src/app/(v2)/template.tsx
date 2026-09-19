import { PageTransition } from "@/ds/motion";

/** Every navigation inside the app fades the new screen in with a small rise. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
