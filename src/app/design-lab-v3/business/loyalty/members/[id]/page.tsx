import { BusinessShell } from "../../../../parts";
import { Members } from "../Members";
import { MemberDetail } from "./MemberDetail";

/** One member: progress, source, Wallet and history with the counter actions. Phone shows the detail as a full page; from 1024 the roster stays beside it. Fixture state only. */
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <BusinessShell bare active="Business" title="Member" mainClass="loy-main">
      <div className="member-page"><MemberDetail id={id} /></div>
      <div className="member-page-desk"><Members filter={null} source={null} selected={id} /></div>
    </BusinessShell>
  );
}
