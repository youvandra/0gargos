import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { uploadJsonTo0GStorage } from "@/lib/ogStorage";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const body = await req.json();

  const deviceId = String(body.deviceId ?? "");
  const requestId = String(body.requestId ?? "");
  const approved = Boolean(body.approved);
  const deviceSignature = String(body.deviceSignature ?? "");
  const userOpHash = String(body.userOpHash ?? "");

  if (!deviceId || !requestId) return NextResponse.json({ error: "deviceId/requestId required" }, { status: 400 });

  const rec = getStore().get(requestId);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (rec.deviceId !== deviceId) return NextResponse.json({ error: "device mismatch" }, { status: 403 });

  if (rec.userOpHash !== userOpHash) return NextResponse.json({ error: "userOpHash mismatch" }, { status: 400 });

  if (!approved) {
    rec.status = "denied";
    getStore().set(requestId, rec);
    return NextResponse.json({ ok: true, status: "denied" });
  }

  rec.status = "approved";
  rec.deviceSignature = deviceSignature;

  // Optional: publish on-chain approval to ArgosGateway (no-bundler mode).
  // Enabled by setting: ARGOS_GATEWAY_ADDRESS + RELAYER_PRIVATE_KEY.
  try {
    const gateway = process.env.ARGOS_GATEWAY_ADDRESS ?? "";
    const relayerPk = process.env.RELAYER_PRIVATE_KEY ?? "";
    const rpcUrl = process.env.OG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
    if (gateway && relayerPk && rec.actionHash) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(relayerPk, provider);
      const gw = new ethers.Contract(
        gateway,
        ["function approve(bytes32 requestKey, bytes32 actionHash, bytes deviceSignature)"],
        signer
      );
      const requestKey = ethers.keccak256(ethers.toUtf8Bytes(requestId));
      const tx = await gw.approve(requestKey, rec.actionHash, deviceSignature);
      rec.aaTxHash = tx.hash;
      rec.aaStatus = "sent";
    }
  } catch (e) {
    console.error("ArgosGateway approve failed:", e);
  }

  // Optional: persist the approval proof in 0G Storage (server-side).
  // Enable by setting STORAGE_SIGNER_PRIVATE_KEY in apps/web/.env
  try {
    const upload = await uploadJsonTo0GStorage({
      type: "0gargos_device_approval",
      deviceId,
      requestId,
      approved: true,
      userOpHash,
      deviceSignature,
      actionTarget: rec.actionTarget,
      actionValueWei: rec.actionValueWei,
      actionData: rec.actionData,
      actionHash: rec.actionHash,
      ts: Date.now()
    });
    if (upload?.rootHash) rec.storageRootHash = upload.rootHash;
    if (upload?.txHash) rec.storageTxHash = upload.txHash;
  } catch (e) {
    // Don't fail the approval flow if Storage upload fails in MVP.
    console.error("0G Storage upload failed:", e);
  }

  getStore().set(requestId, rec);
  return NextResponse.json({
    ok: true,
    status: "approved",
    storageRootHash: rec.storageRootHash ?? null,
    storageTxHash: rec.storageTxHash ?? null
  });
}
