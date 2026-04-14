import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const rows = Array.from(getStore().values());
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const denied = rows.filter((r) => r.status === "denied").length;
  const total = rows.length;

  const recent = rows
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)
    .map((r) => ({ requestId: r.requestId, status: r.status, createdAt: r.createdAt }));

  return NextResponse.json({ pending, approved, denied, total, recent });
}

