import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId") ?? "";
  if (!requestId) return NextResponse.json({ status: "not_found" });

  const rec = getStore().get(requestId);
  if (!rec) return NextResponse.json({ status: "not_found" });

  if (rec.status === "pending") return NextResponse.json({ status: "pending", requestId });
  if (rec.status === "denied") return NextResponse.json({ status: "denied", requestId });

  return NextResponse.json({
    status: "approved",
    requestId,
    deviceSignature: rec.deviceSignature,
    storageRootHash: rec.storageRootHash,
    storageTxHash: rec.storageTxHash
  });
}
