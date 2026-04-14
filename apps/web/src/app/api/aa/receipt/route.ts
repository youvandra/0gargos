import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { bundlerRpc } from "@/lib/bundlerRpc";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId") ?? "";
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const rec = getStore().get(requestId);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!rec.aaUserOpHash) return NextResponse.json({ error: "userOp not sent" }, { status: 400 });

  const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL ?? "";
  if (!bundlerUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_BUNDLER_RPC_URL" }, { status: 500 });

  const receipt = await bundlerRpc<any>(bundlerUrl, "eth_getUserOperationReceipt", [rec.aaUserOpHash]);
  if (!receipt) return NextResponse.json({ status: "pending" });

  const txHash = receipt.receipt?.transactionHash ?? receipt.transactionHash ?? null;
  if (txHash) {
    rec.aaTxHash = txHash;
    rec.aaStatus = "mined";
    getStore().set(requestId, rec);
  }

  return NextResponse.json({ status: "mined", txHash, receipt });
}

