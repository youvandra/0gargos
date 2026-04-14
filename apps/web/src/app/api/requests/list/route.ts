import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const rows = Array.from(getStore().values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({
      requestId: r.requestId,
      deviceId: r.deviceId,
      status: r.status,
      userOpHash: r.userOpHash,
      deviceSignature: r.deviceSignature,
      storageRootHash: r.storageRootHash,
      storageTxHash: r.storageTxHash,
      createdAt: r.createdAt
    }));

  return NextResponse.json({ rows });
}
