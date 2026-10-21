"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexStatus() {
  if (!convexConfigured) {
    return (
      <p className="mt-2 text-compact text-slate">
        Not yet connected: <code>NEXT_PUBLIC_CONVEX_URL</code> is not configured in this
        environment. convex/schema.ts and convex/healthCheck.ts are written and ready for{" "}
        <code>npx convex dev</code>.
      </p>
    );
  }
  return <ConvexStatusConnected />;
}

function ConvexStatusConnected() {
  const status = useQuery(api.healthCheck.status);

  if (status === undefined) {
    return <p className="mt-2 text-compact text-slate">Connecting to Convex&hellip;</p>;
  }

  return (
    <p className="mt-2 text-compact text-slate">
      Live query succeeded &mdash; <code>healthCheck:status</code> returned{" "}
      <code>ok: {String(status.ok)}</code> at{" "}
      {new Date(status.serverTime).toLocaleTimeString()}.
    </p>
  );
}
