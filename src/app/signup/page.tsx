import { AuthPage } from "@/components/shared/auth-page";
export const metadata = { title: "Create an Account", robots: { index: false, follow: false } };
export default function SignupPage() { return <AuthPage mode="signup" />; }
