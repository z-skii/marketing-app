import { SignUpForm } from "../auth-form";
import { signUpAction } from "../actions";

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return <SignUpForm action={signUpAction} next={sp.next} />;
}
