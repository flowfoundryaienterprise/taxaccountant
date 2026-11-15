"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export function ClaimsQueue() {
  const claims = useQuery(api.staff.listPendingClaims, {});
  const decideClaim = useMutation(api.staff.decideClaim);
  const [busyId, setBusyId] = useState<Id<"professionalOwnership"> | null>(null);
  const [error, setError] = useState("");

  async function decide(ownershipId: Id<"professionalOwnership">, decision: "approve" | "reject") {
    setBusyId(ownershipId);
    setError("");
    try {
      await decideClaim({ ownershipId, decision });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The claim could not be decided.");
    } finally {
      setBusyId(null);
    }
  }

  if (claims === undefined) return <p role="status" className="text-compact text-slate">Loading ownership claims…</p>;

  return <section className="rounded-card border border-border bg-white p-5 md:p-6">
    <h2 className="text-xl font-semibold text-navy">Pending ownership claims</h2>
    <p className="mt-2 text-compact text-slate">Check the organization’s authority to represent the listing before granting edit access. A decision is recorded in the audit log. The queue shows up to 100 oldest pending claims.</p>
    {error ? <p role="alert" className="mt-4 text-compact text-danger">{error}</p> : null}
    {claims.length === 0 ? <p className="mt-6 text-compact text-slate">No claims await review.</p> :
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-compact">
          <thead className="bg-tint text-navy"><tr><th scope="col" className="p-3">Professional</th><th scope="col" className="p-3">Claiming organization</th><th scope="col" className="p-3">Requested</th><th scope="col" className="p-3">Decision</th></tr></thead>
          <tbody>{claims.map(claim => <tr key={claim._id} className="border-b border-border last:border-b-0">
            <td className="p-3 font-medium text-navy">{claim.professionalDisplayName}</td>
            <td className="p-3">{claim.organizationName}</td>
            <td className="p-3"><time dateTime={new Date(claim.requestedAt).toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(claim.requestedAt)}</time></td>
            <td className="flex gap-2 p-3"><Button size="sm" disabled={busyId !== null} onClick={() => decide(claim._id, "approve")}>Approve</Button><Button size="sm" variant="outline" disabled={busyId !== null} onClick={() => decide(claim._id, "reject")}>Reject</Button></td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>;
}
