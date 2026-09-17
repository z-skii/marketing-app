import { BusinessShell } from "../../../parts";
import { Members } from "./Members";

/** Members: the roster, with the selected member's detail beside it from 1024. filter=repeat|ready and source=<source> are views over the same local projections. Fixture state only. */
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ filter?: string; source?: string; m?: string }> }) {
  const sp = await searchParams;
  return <BusinessShell bare active="Business" title="Members" mainClass="loy-main"><Members filter={sp.filter ?? null} source={sp.source ?? null} selected={sp.m ?? null} /></BusinessShell>;
}
