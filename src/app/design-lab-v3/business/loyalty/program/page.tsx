import { BusinessShell } from "../../../parts";
import { ProgramView } from "./ProgramView";

/** The live program: rule, terms and both Wallet concepts; Edit reward and Edit card as contextual sheets. Program type is fixed after launch. */
export default async function ProgramPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const sp = await searchParams;
  return <BusinessShell bare active="Business" title="Program" mainClass="loy-main"><ProgramView edit={sp.edit ?? null} /></BusinessShell>;
}
