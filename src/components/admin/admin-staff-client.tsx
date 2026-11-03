"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { ShieldAlert, ShieldCheck, Users } from "lucide-react";
import type { FunctionReturnType } from "convex/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

type ListStaffRow = FunctionReturnType<typeof api.staff.listStaff>[number];
type StaffRole = "cms_admin" | "cms_editor";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "cms_admin", label: "Admin" },
  { value: "cms_editor", label: "Editor" },
];

/**
 * `/admin/staff` — grant, change, and revoke CMS access
 * (`docs/superpowers/specs/2026-11-03-staff-management-ui-design.md`).
 *
 * `cms_admin` only, server-side: every mutation here re-checks the role
 * itself (`convex/staff.ts`), so this screen being hard to reach for a
 * `cms_editor` is never the actual security boundary — just the first
 * line, matching every other admin boundary in this CMS.
 */
export function AdminStaffClient() {
  const viewer = useQuery(api.staff.currentStaff, {});

  if (viewer === undefined) {
    return (
      <div className="flex items-center gap-2 text-compact text-slate">
        <ShieldCheck className="h-4 w-4 animate-pulse-soft" aria-hidden />
        Loading staff…
      </div>
    );
  }

  if (viewer === null || viewer.role !== "cms_admin") {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader title="Staff" />
        <AdminEmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="Staff management is restricted to CMS admins. Ask an existing admin if you need a role changed."
        />
      </div>
    );
  }

  return <StaffRoster />;
}

function StaffRoster() {
  const roster = useQuery(api.staff.listStaff, {});
  const changeRole = useMutation(api.staff.changeStaffRole);
  const setActive = useMutation(api.staff.setStaffActive);

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function handleRoleChange(row: ListStaffRow, role: StaffRole) {
    setUpdatingId(row._id);
    setActionError(null);
    try {
      await changeRole({ id: row._id, role });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleActiveToggle(row: ListStaffRow) {
    setUpdatingId(row._id);
    setActionError(null);
    try {
      await setActive({ id: row._id, active: !row.active });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: AdminColumn<ListStaffRow>[] = [
    {
      key: "member",
      header: "Member",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-medium text-navy">
            {row.name ?? "—"}
            {row.isSelf ? (
              <span className="rounded-full bg-tint px-2 py-0.5 text-caption font-medium text-action">
                You
              </span>
            ) : null}
          </span>
          <span className="text-caption text-slate">{row.email ?? "No email on file"}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <select
          value={row.role}
          disabled={updatingId === row._id || row.isSelf}
          onChange={(event) => handleRoleChange(row, event.target.value as StaffRole)}
          className={cn(
            "rounded-input border border-control bg-white px-2 py-1 text-caption font-medium text-navy",
            "transition-colors duration-150 hover:border-action disabled:opacity-50",
          )}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-caption font-medium text-navy">
            {row.active ? "Active" : "Deactivated"}
          </span>
          <button
            type="button"
            disabled={updatingId === row._id || row.isSelf}
            onClick={() => handleActiveToggle(row)}
            className="inline-flex h-8 w-fit items-center gap-1.5 rounded-input border border-control bg-white px-3 text-caption font-medium text-navy transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
          >
            {row.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Staff"
        description="CMS staff accounts, roles and access. Changes here are real and audited."
      />

      {actionError ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {actionError}
        </p>
      ) : null}

      {roster === undefined ? (
        <div className="flex items-center gap-2 text-compact text-slate">
          <ShieldCheck className="h-4 w-4 animate-pulse-soft" aria-hidden />
          Loading staff…
        </div>
      ) : (
        <AdminDataTable
          caption="CMS staff accounts"
          columns={columns}
          rows={roster}
          rowKey={(row) => row._id}
          empty={
            <AdminEmptyState
              icon={Users}
              title="No staff yet"
              description="This should not happen — at least the bootstrap admin account should be listed here."
            />
          }
        />
      )}

      <p className="max-w-[92ch] text-caption text-slate">
        Role and status changes are real and audited (
        <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">auditEvents</code>,
        actions <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">staff.roleChanged</code>,{" "}
        <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">staff.activated</code> /{" "}
        <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">staff.deactivated</code>).
      </p>
    </div>
  );
}
