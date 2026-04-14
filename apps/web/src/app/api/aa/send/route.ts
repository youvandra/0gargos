import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { buildAndSignUserOp } from "@/lib/userOp";
import { bundlerRpc } from "@/lib/bundlerRpc";

export async function POST(req: Request) {
  const body = await req.json();
  const requestId = String(body.requestId ?? "");
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const rec = getStore().get(requestId);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (rec.status !== "approved") return NextResponse.json({ error: "request not approved" }, { status: 400 });

  const rpcUrl = process.env.OG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "16602");
  const entryPoint = process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS ?? "";
  const factory = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "";
  const demoTarget = process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS ?? "";
  const deviceAddress = process.env.NEXT_PUBLIC_AA_DEVICE_ADDRESS ?? "";
  const thresholdWei = BigInt(process.env.NEXT_PUBLIC_DEVICE_VALUE_THRESHOLD_WEI ?? "1000000000000000");
  const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL ?? "";
  const ownerPk = process.env.OWNER_PRIVATE_KEY ?? "";

  if (!entryPoint || !factory || !demoTarget || !deviceAddress) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_ENTRYPOINT_ADDRESS / FACTORY_ADDRESS / DEMO_CONTRACT_ADDRESS / AA_DEVICE_ADDRESS" },
      { status: 500 }
    );
  }
  if (!bundlerUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_BUNDLER_RPC_URL" }, { status: 500 });
  if (!ownerPk) return NextResponse.json({ error: "Missing OWNER_PRIVATE_KEY (server-side signer)" }, { status: 500 });

  // Build + sign userOp (owner-only signature). We keep call value 0 so on-chain device signature isn't required yet.
  const { userOp, userOpHash, sender } = await buildAndSignUserOp({
    rpcUrl,
    chainId,
    entryPoint,
    factory,
    demoTarget,
    ownerPrivateKey: ownerPk,
    deviceAddress,
    thresholdWei,
    bundlerUrl
  });

  rec.aaSender = sender;
  rec.aaUserOpHash = userOpHash;
  rec.aaStatus = "sent";
  getStore().set(requestId, rec);

  // Send to bundler
  const bundlerUserOpHash = await bundlerRpc<string>(bundlerUrl, "eth_sendUserOperation", [userOp, entryPoint]);

  return NextResponse.json({ ok: true, sender, userOpHash, bundlerUserOpHash });
}
