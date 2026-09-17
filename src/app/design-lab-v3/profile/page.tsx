import V2UserProfile from "../../design-lab-v2/profile/page";

/** The V2 Personal Profile, unchanged in intent, reachable inside V3. */
export default function V3UserProfile(props: { searchParams: Promise<{ public?: string }> }) { return <V2UserProfile {...props} />; }
