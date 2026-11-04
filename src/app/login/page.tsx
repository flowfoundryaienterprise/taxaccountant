import { AuthPage } from "@/components/shared/auth-page";
export const metadata = { title: "Sign In", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthPage mode="signin" />; }
