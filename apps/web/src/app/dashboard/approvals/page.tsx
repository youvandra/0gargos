"use client";

import { useEffect, useMemo, useState } from "react";

type RequestStatus =
  | { status: "pending"; requestId: string }
  | { status: "approved"; requestId: string; deviceSignature: string; storageRootHash?: string }
  | { status: "denied"; requestId: string }
  | { status: "not_found" };

export default function DeviceApprovalsPage() {
  const [deviceId, setDeviceId] = useState("device-001");
  const [title, setTitle] = useState("Approve UserOperation");
  const [details1, setDetails1] = useState("Transfer: 0.2 0G");
  const [details2, setDetails2] = useState("To: 0x...");
  const [userOpHash, setUserOpHash] = useState("0x");

  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus | null>(null);

  const canCreate = useMemo(() => /^0x[0-9a-fA-F]{64}$/.test(userOpHash), [userOpHash]);

  async function createRequest() {
    setStatus(null);
    const res = await fetch("/api/requests/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId, title, details1, details2, userOpHash })
    });
    const json = await res.json();
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
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Title</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Details line 1</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={details1}
              onChange={(e) => setDetails1(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium text-black/60">Details line 2</div>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent"
              value={details2}
              onChange={(e) => setDetails2(e.target.value)}
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <div className="text-xs font-medium text-black/60">userOpHash (32 bytes hex)</div>
          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-accent font-mono text-xs"
            value={userOpHash}
            onChange={(e) => setUserOpHash(e.target.value)}
            placeholder="0x..."
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

