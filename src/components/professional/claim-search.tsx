"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { Search, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ClaimSearchProps {
  organizationId: Id<"organizations">;
  /** Called once `requestProfessionalClaim` succeeds. */
  onClaimed: () => void;
}

/**
 * "Claim an existing listing" search surface (Task 9, Step 1's claim path).
 *
 * Searches `api.professionals.searchPublishedProfessionals` (Task 5) as the
 * caller types — the query itself is bounded (max 20 results over at most
 * 200 scanned candidates) and only live-queries once at least two
 * characters are typed, via the `useQuery` "skip" sentinel
 * (`src/components/shared/ensure-app-user.tsx` already establishes this
 * pattern for a conditional query in this codebase). Selecting a result
 * calls `requestProfessionalClaim`, which only ever creates a `pending`
 * ownership row (`convex/professionalOwnership.ts`) — there is deliberately
 * no path from this component into the wizard: a pending claim grants no
 * edit access, so the only place `onClaimed` can lead is a "pending staff
 * review" landing state.
 */
export function ClaimSearch({ organizationId, onClaimed }: ClaimSearchProps) {
  const [nameQuery, setNameQuery] = React.useState("");
  const [claimingId, setClaimingId] = React.useState<Id<"professionals"> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const trimmed = nameQuery.trim();
  const results = useQuery(
    api.professionals.searchPublishedProfessionals,
    trimmed.length >= 2 ? { nameQuery: trimmed } : "skip",
  );

  const requestClaim = useMutation(api.professionalOwnership.requestProfessionalClaim);

  async function handleClaim(professionalId: Id<"professionals">) {
    setError(null);
    setClaimingId(professionalId);
    try {
      await requestClaim({ organizationId, professionalId });
      onClaimed();
    } catch (err) {
      setClaimingId(null);
      setError(
        err instanceof Error ? err.message : "Could not submit a claim for that listing.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="claim-search-input" className="text-caption font-medium text-slate">
          Search by name or firm
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <input
            id="claim-search-input"
            type="text"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="e.g. Sarah Johnson"
            className="h-11 w-full rounded-input border border-control bg-white pl-9 pr-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        <p className="text-caption text-slate/70">Type at least 2 characters to search.</p>
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      {trimmed.length < 2 ? null : results === undefined ? (
        <p className="text-compact text-slate">Searching…</p>
      ) : results.length === 0 ? (
        <p className="text-compact text-slate">
          No published listing matches &ldquo;{trimmed}&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((result) => (
            <li
              key={result.professionalId}
              className="flex items-center justify-between gap-4 rounded-input border border-border bg-white p-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-navy">{result.displayName}</span>
                {result.firmName ? (
                  <span className="text-caption text-slate">{result.firmName}</span>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={claimingId === result.professionalId}
                onClick={() => handleClaim(result.professionalId)}
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden />
                {claimingId === result.professionalId ? "Submitting…" : "Claim this listing"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
