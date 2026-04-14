import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId") ?? "";
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  const store = getStore();
  for (const rec of store.values()) {
    if (rec.deviceId === deviceId && rec.status === "pending") {
      return NextResponse.json({
        hasRequest: true,
        requestId: rec.requestId,
        title: rec.title,
        details1: rec.details1,
        details2: rec.details2,
        userOpHash: rec.userOpHash
      });
    }
  }

  return NextResponse.json({ hasRequest: false });
}

