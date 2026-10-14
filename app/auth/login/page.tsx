import { redirect } from "next/navigation";

/**
 * Retired Authentication Route: /auth/login
 * Public guest access is enabled; visitors are automatically redirected to the Dashboard.
 */
export default function LoginPage() {
  redirect("/dashboard");
}
