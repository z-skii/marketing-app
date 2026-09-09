import { SignInForm } from "../auth-form";
import { signInAction } from "../actions";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return <SignInForm action={signInAction} next={sp.next} error={sp.error} />;
}
