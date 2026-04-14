import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const body = await req.json();
  const requestId = String(body.requestId ?? "");
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const rec = getStore().get(requestId);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (rec.status !== "approved") return NextResponse.json({ error: "request not approved" }, { status: 400 });

  const gateway = process.env.ARGOS_GATEWAY_ADDRESS ?? "";
  const relayerPk = process.env.RELAYER_PRIVATE_KEY ?? "";
  const rpcUrl = process.env.OG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
  if (!gateway) return NextResponse.json({ error: "Missing ARGOS_GATEWAY_ADDRESS" }, { status: 500 });
  if (!relayerPk) return NextResponse.json({ error: "Missing RELAYER_PRIVATE_KEY" }, { status: 500 });

  if (!rec.actionTarget || !rec.actionData || !rec.actionValueWei) {
    return NextResponse.json({ error: "missing action fields" }, { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(relayerPk, provider);

  const gw = new ethers.Contract(
    gateway,
    ["function executeApproved(bytes32 requestKey,address target,uint256 value,bytes data) returns (bytes)"],
    signer
  );

  const requestKey = ethers.keccak256(ethers.toUtf8Bytes(requestId));
  const tx = await gw.executeApproved(requestKey, rec.actionTarget, BigInt(rec.actionValueWei), rec.actionData);

  rec.aaTxHash = tx.hash;
  rec.aaStatus = "sent";
  getStore().set(requestId, rec);

  return NextResponse.json({ ok: true, txHash: tx.hash });
}

