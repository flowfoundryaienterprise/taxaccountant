"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Building2, Mail, ShieldAlert, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type OrgRole = "owner" | "admin" | "member" | "viewer";
type InviteRole = "admin" | "member" | "viewer";
type MembershipStatus = "invited" | "active" | "removed";

type CurrentOrganizationRow = FunctionReturnType<typeof api.organizations.currentOrganizations>[number];

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  invited: "Invited",
  active: "Active",
  removed: "Removed",
};

const INVITE_ROLE_OPTIONS: Array<{ value: InviteRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

interface MemberListProps {
  organizationId: Id<"organizations">;
}

/**
 * Member roster + invite form for one organization (`/organization/[id]`).
 *
 * `api.organizations.listOrgMembers` is `requireOrgMember`-gated server-side
 * — it throws for a signed-in caller who isn't an active member of
 * `organizationId` — so this component checks the viewer's own membership
 * via `currentOrganizations` *first* and only calls `listOrgMembers` once
 * that membership is confirmed. This also gives us the viewer's own role
 * (needed to show/hide the invite form and remove buttons) and the
 * organization's name, both already present on `currentOrganizations`'
 * rows, without a second round trip.
 */
export function MemberList({ organizationId }: MemberListProps) {
  const organizations = useQuery(api.organizations.currentOrganizations, {});

  if (organizations === undefined) {
    return <p className="text-compact text-slate">Loading organization…</p>;
  }

  const viewerOrg = organizations.find((org) => org.organizationId === organizationId);

  if (!viewerOrg) {
    return (
      <div className="flex flex-col gap-2 rounded-[1.25rem] border border-border bg-white p-6">
        <p className="flex items-center gap-2 text-compact font-medium text-navy">
          <ShieldAlert className="h-4 w-4 text-danger" aria-hidden />
          You are not a member of this organization.
        </p>
        <p className="text-caption text-slate">
          Ask an owner or admin to invite you, or double check the link you followed.
        </p>
      </div>
    );
  }

  return (
    <OrganizationRoster
      organizationId={organizationId}
      orgName={viewerOrg.name}
      viewerRole={viewerOrg.role}
    />
  );
}

function OrganizationRoster({
  organizationId,
  orgName,
  viewerRole,
}: {
  organizationId: Id<"organizations">;
  orgName: CurrentOrganizationRow["name"];
  viewerRole: OrgRole;
}) {
  const roster = useQuery(api.organizations.listOrgMembers, { organizationId });
  const inviteMember = useMutation(api.organizations.inviteMember);
  const removeMember = useMutation(api.organizations.removeMember);

  const canManage = viewerRole === "owner" || viewerRole === "admin";

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("member");
  const [inviting, setInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = React.useState<string | null>(null);

  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await inviteMember({ organizationId, email, role });
      setInviteSuccess(`Invited ${email}.`);
      setEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not invite that email.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(membershipId: Id<"organizationMembers">) {
    setRemovingId(membershipId);
    setRemoveError(null);
    try {
      await removeMember({ membershipId });
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Could not remove that member.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-navy">
          <Building2 className="h-6 w-6 text-action" aria-hidden />
          {orgName}
        </h1>
        <p className="text-caption text-slate">Your role: {ROLE_LABELS[viewerRole]}</p>
      </div>

      {canManage ? (
        <form
          onSubmit={handleInvite}
          className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5 sm:flex-row sm:items-end"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="invite-email" className="text-caption font-medium text-slate">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
            <p className="text-caption text-slate/70">
              They must already have an account — ask them to sign up at /sign-in first if they
              don&apos;t.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="text-caption font-medium text-slate">
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as InviteRole)}
              className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action"
            >
              {INVITE_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={inviting}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {inviting ? "Inviting…" : "Invite"}
          </Button>
        </form>
      ) : null}

      {inviteSuccess ? (
        <p role="status" className="text-caption font-medium text-navy">
          {inviteSuccess}
        </p>
      ) : null}
      {inviteError ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {inviteError}
        </p>
      ) : null}
      {removeError ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {removeError}
        </p>
      ) : null}

      {roster === undefined ? (
        <p className="text-compact text-slate">Loading members…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {roster.map((member) => (
            <li
              key={member._id}
              className="flex items-center justify-between gap-4 rounded-input border border-border bg-white p-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium text-navy">
                  <Mail className="h-3.5 w-3.5 text-slate" aria-hidden />
                  {member.email ?? "No email on file"}
                </span>
                <span className="text-caption text-slate">
                  {ROLE_LABELS[member.role]} · {STATUS_LABELS[member.status]}
                </span>
              </div>

              {canManage && member.status !== "removed" ? (
                <button
                  type="button"
                  disabled={removingId === member._id}
                  onClick={() => handleRemove(member._id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-input border border-control bg-white px-3 text-caption font-medium text-danger transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {removingId === member._id ? "Removing…" : "Remove"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
