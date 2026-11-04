"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, UserRound } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  accountLabel: string;
}

/**
 * Same top-bar pattern as `AdminHeader`'s account menu (bell, avatar,
 * "signed in as" + sign out) — public accounts use Better Auth the same
 * way staff accounts do (`@/lib/auth/client`), so signing out is a real
 * `authClient.signOut()` call, not a placeholder button.
 */
export function DashboardHeader({ title, accountLabel }: DashboardHeaderProps) {
  const [signingOut, setSigningOut] = React.useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-4 sm:px-6">
      <p className="truncate text-compact font-semibold text-navy">{title}</p>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Notifications — not available yet"
          disabled
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate transition-colors duration-150 hover:bg-subtle"
        >
          <Bell className="h-4.5 w-4.5" aria-hidden />
        </button>

        <div className="group relative shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-action">
              <UserRound className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden max-w-32 truncate lg:inline">{accountLabel}</span>
          </button>

          <div
            className={cn(
              "absolute top-full right-0 z-10 mt-2 hidden w-48 flex-col gap-1 rounded-card border border-border bg-white p-1.5 shadow-[var(--shadow-float)]",
              "group-focus-within:flex",
            )}
          >
            <span className="truncate px-2.5 py-1.5 text-caption text-slate">{accountLabel}</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 rounded-[0.5rem] px-2.5 py-2 text-left text-compact font-medium text-slate transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
