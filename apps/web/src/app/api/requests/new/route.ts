import { NextResponse } from "next/server";
import { createId, getStore, type ApprovalRequest } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();

  const deviceId = String(body.deviceId ?? "");
  const title = String(body.title ?? "Approval");
  const details1 = String(body.details1 ?? "");
  const details2 = String(body.details2 ?? "");
  const userOpHash = String(body.userOpHash ?? "");

  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  if (!/^0x[0-9a-fA-F]{64}$/.test(userOpHash))
    return NextResponse.json({ error: "userOpHash must be 32-byte hex" }, { status: 400 });

  const requestId = createId("req");
  const record: ApprovalRequest = {
    requestId,
    deviceId,
    title,
    details1,
    details2,
    userOpHash,
    status: "pending",
    createdAt: Date.now()
  };

  getStore().set(requestId, record);
  return NextResponse.json({ requestId });
}

