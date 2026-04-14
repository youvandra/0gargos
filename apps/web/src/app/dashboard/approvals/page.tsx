"use client";

import { useEffect, useMemo, useState } from "react";

type RequestStatus =
  | { status: "pending"; requestId: string }
  | {
      status: "approved";
      requestId: string;
      deviceSignature: string;
      storageRootHash?: string;
      storageTxHash?: string;
      aaUserOpHash?: string;
      aaTxHash?: string;
      aaStatus?: string;
    }
  | { status: "denied"; requestId: string }
  | { status: "not_found" };

export default function DeviceApprovalsPage() {
  const [deviceId, setDeviceId] = useState("device-001");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [userOpHash, setUserOpHash] = useState("");

  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [aaSending, setAaSending] = useState(false);
  const [aaMsg, setAaMsg] = useState<string | null>(null);

  const canCreate = useMemo(() => /^0x[0-9a-fA-F]{64}$/.test(userOpHash), [userOpHash]);

  async function safeJson(res: Response): Promise<any> {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Non-JSON response from server", raw: text };
    }
  }

  async function createRequest() {
    setStatus(null);
    const res = await fetch("/api/requests/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId,
        title: title || "Approve transaction",
        details1: amount,
        details2: address,
        userOpHash
      })
    });
    const json = await safeJson(res);
    setRequestId(json.requestId);
  }

  useEffect(() => {
    if (!requestId) return;
    let timer: any;
    const tick = async () => {
      const res = await fetch(`/api/requests/status?requestId=${requestId}`);
      const json = (await res.json()) as RequestStatus;
      setStatus(json);
    };
    tick();
    timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [requestId]);

  async function sendUserOp() {
    if (!requestId) return;
    setAaSending(true);
    setAaMsg(null);
    try {
      const res = await fetch("/api/aa/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error ?? "send failed");
      setAaMsg(`UserOp sent: ${json.bundlerUserOpHash}`);
    } catch (e: any) {
      setAaMsg(e.message ?? String(e));
    } finally {
      setAaSending(false);
    }
  }

  async function executeOnChain() {
    if (!requestId) return;
    setAaSending(true);
    setAaMsg(null);
    try {
      const res = await fetch("/api/onchain/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error ?? "execute failed");
      setAaMsg(`Executed: ${json.txHash}`);
    } catch (e: any) {
      setAaMsg(e.message ?? String(e));
    } finally {
      setAaSending(false);
    }
  }

  async function checkReceipt() {
    if (!requestId) return;
    const res = await fetch(`/api/aa/receipt?requestId=${requestId}`);
    const json = await res.json();
    if (json?.txHash) setAaMsg(`Mined: ${json.txHash}`);
    else setAaMsg("Pending...");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Device approvals</h1>
        <p className="text-sm text-black/60">
          Create an approval request. Your ESP32 device polls <span className="font-mono text-xs">/api/device/poll</span>{" "}
          and responds to <span className="font-mono text-xs">/api/device/respond</span>.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Device ID</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="device-001"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Title</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Approve transaction"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Amount</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001 0G"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Address</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0xRecipient..."
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <div className="text-xs font-medium text-black/60">userOpHash (32 bytes hex)</div>
          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent font-mono text-xs"
            value={userOpHash}
            onChange={(e) => setUserOpHash(e.target.value)}
            placeholder="0x + 64 hex chars"
          />
          <div className="text-[11px] text-black/50">
            MVP: paste any 32-byte hash. Next step: compute it from a real UserOperation using EntryPoint.
          </div>
        </label>

        <button
          disabled={!canCreate}
          onClick={createRequest}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          Create request
        </button>
      </div>

      <div className="rounded-xl border border-black/10 p-5 space-y-2">
        <div className="text-sm font-medium">Request status</div>
        {!requestId ? (
          <div className="text-sm text-black/60">No active request.</div>
        ) : status?.status === "pending" ? (
          <div className="text-sm">
            <span className="text-black/60">Pending:</span> <span className="font-mono text-xs">{requestId}</span>
          </div>
        ) : status?.status === "approved" ? (
          <div className="space-y-2">
            <div className="text-sm text-accent font-medium">Approved</div>
            <div className="text-xs font-mono break-all">deviceSignature: {status.deviceSignature}</div>
            {status.storageRootHash && (
              <div className="text-xs font-mono break-all">storageRootHash: {status.storageRootHash}</div>
            )}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={executeOnChain}
                disabled={aaSending}
                className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white text-sm disabled:opacity-40"
              >
                {aaSending ? "Sending..." : "Execute on-chain"}
              </button>
              <button
                onClick={checkReceipt}
                className="inline-flex items-center justify-center rounded-lg border border-black/10 px-4 py-2 text-black text-sm"
              >
                Check receipt
              </button>
            </div>
            {status.aaUserOpHash && <div className="text-xs font-mono break-all">aaUserOpHash: {status.aaUserOpHash}</div>}
            {status.aaTxHash && (
              <a
                className="text-xs font-mono break-all hover:underline"
                href={`https://chainscan-galileo.0g.ai/tx/${status.aaTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                tx: {status.aaTxHash}
              </a>
            )}
            {aaMsg && <div className="text-xs text-black/60">{aaMsg}</div>}
          </div>
        ) : status?.status === "denied" ? (
          <div className="text-sm text-black/60">Denied: {requestId}</div>
        ) : (
          <div className="text-sm text-black/60">Loading...</div>
        )}
      </div>
    </div>
  );
}
