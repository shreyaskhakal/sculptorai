import { redirect } from "next/navigation";

/**
 * Retired Authentication Route: /auth/signup
 * Public guest access is enabled; visitors are automatically redirected to the Dashboard.
 */
export default function SignupPage() {
  redirect("/dashboard");
}
