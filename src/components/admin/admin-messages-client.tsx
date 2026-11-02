"use client";

import * as React from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { Inbox, Mail } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { truncate } from "@/lib/admin/admin-formatters";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

type MessageStatus = Doc<"publicMessages">["status"];

const STATUS_TABS: { value: MessageStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const KIND_LABEL: Record<Doc<"publicMessages">["kind"], string> = {
  contact: "Contact",
  professional_interest: "Professional interest",
};

/**
 * The first CMS screen backed by real, live Convex data rather than a
 * fixture or a disabled preview — `publicMessages` has rows now that
 * `/contact` and the `/for-professionals` interest form actually write
 * (`convex/contact.ts`). Status changes are a real mutation
 * (`updateMessageStatus`), audited via `auditEvents`, not another inert
 * button — unlike every other editorial control in this CMS, which stays
 * disabled because no `cms:*` mutation exists yet for it to call. This one
 * exists because the underlying write (a public contact form) was already
 * in scope and already had somewhere to write to.
 */
export function AdminMessagesClient() {
  const [statusFilter, setStatusFilter] = React.useState<MessageStatus | "all">("all");

  const { results, status, loadMore } = usePaginatedQuery(
    api.contact.listMessages,
    statusFilter === "all" ? {} : { status: statusFilter },
    { initialNumItems: 20 },
  );

  const updateStatus = useMutation(api.contact.updateMessageStatus);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  async function handleStatusChange(messageId: Doc<"publicMessages">["_id"], next: MessageStatus) {
    setUpdatingId(messageId);
    try {
      await updateStatus({ messageId, status: next });
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: AdminColumn<Doc<"publicMessages">>[] = [
    {
      key: "from",
      header: "From",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-navy">{row.name}</span>
          <span className="text-caption text-slate">{row.email}</span>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Type",
      hideOnMobile: true,
      render: (row) => KIND_LABEL[row.kind],
    },
    {
      key: "message",
      header: "Message",
      render: (row) => (
        <span title={row.message}>
          {row.subject ? <strong className="font-medium text-navy">{row.subject}: </strong> : null}
          {truncate(row.message, 80)}
        </span>
      ),
    },
    {
      key: "received",
      header: "Received",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono tabular-nums">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <select
          value={row.status}
          disabled={updatingId === row._id}
          onChange={(event) => handleStatusChange(row._id, event.target.value as MessageStatus)}
          className={cn(
            "rounded-input border border-control bg-white px-2 py-1 text-caption font-medium text-navy",
            "transition-colors duration-150 hover:border-action disabled:opacity-50",
          )}
        >
          {STATUS_TABS.filter((tab) => tab.value !== "all").map((tab) => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Messages"
        description="Public contact and professional-interest submissions, written directly by /contact and /for-professionals."
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-caption font-medium transition-colors duration-150",
              statusFilter === tab.value
                ? "border-action bg-tint text-action"
                : "border-border bg-white text-slate hover:border-control",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "LoadingFirstPage" ? (
        <div className="flex items-center gap-2 text-compact text-slate">
          <Mail className="h-4 w-4 animate-pulse-soft" aria-hidden />
          Loading messages…
        </div>
      ) : (
        <AdminDataTable
          caption="Public contact and professional-interest messages"
          columns={columns}
          rows={results}
          rowKey={(row) => row._id}
          empty={
            <AdminEmptyState
              icon={Inbox}
              title={statusFilter === "all" ? "No messages yet" : `No ${statusFilter} messages`}
              description="Submissions from /contact and the professional-interest form on /for-professionals will appear here."
            />
          }
        />
      )}

      {status === "CanLoadMore" ? (
        <button
          type="button"
          onClick={() => loadMore(20)}
          className="w-fit rounded-input border border-control bg-white px-4 py-2 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle"
        >
          Load more
        </button>
      ) : null}

      <p className="max-w-[92ch] text-caption text-slate">
        Status changes are real and audited (<code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">auditEvents</code>,
        action <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">publicMessage.statusChanged</code>)
        — unlike every other editorial control in this CMS, which stays disabled because no backend write exists for it yet.
      </p>
    </div>
  );
}
