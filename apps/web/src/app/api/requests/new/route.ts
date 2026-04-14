import { NextResponse } from "next/server";
import { createId, getStore, type ApprovalRequest } from "@/lib/store";
import { ethers } from "ethers";

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

  // Default gated action (no-bundler mode): call ArgosDemo.ping()
  // This makes the MVP actually use our smart contract without requiring a bundler.
  const demoAddr = process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS ?? "";
  const pingData = new ethers.Interface(["function ping()"]).encodeFunctionData("ping", []);
  const actionTarget = String(body.actionTarget ?? demoAddr);
  const actionValueWei = String(body.actionValueWei ?? "0");
  const actionData = String(body.actionData ?? pingData);

  const requestKey = ethers.keccak256(ethers.toUtf8Bytes(requestId));
  const actionHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256", "bytes"],
      [requestKey, actionTarget, BigInt(actionValueWei), actionData]
    )
  );

  const record: ApprovalRequest = {
    requestId,
    deviceId,
    title,
    details1,
    details2,
    userOpHash,
    actionTarget,
    actionValueWei,
    actionData,
    actionHash,
    status: "pending",
    createdAt: Date.now()
  };

  getStore().set(requestId, record);
  return NextResponse.json({ requestId });
}
