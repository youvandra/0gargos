"use client";

import { useEffect, useState } from "react";

type Row = {
  requestId: string;
  deviceId: string;
  status: "pending" | "approved" | "denied";
  userOpHash: string;
  deviceSignature?: string;
  storageRootHash?: string;
  storageTxHash?: string;
  createdAt: number;
};

function Badge({ status }: { status: Row["status"] }) {
  const cls =
    status === "approved"
      ? "bg-black text-white"
      : status === "pending"
        ? "bg-accent text-white"
        : "bg-black/10 text-black";
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${cls}`}>{status}</span>;
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      const res = await fetch("/api/requests/list");
      const json = (await res.json()) as { rows: Row[] };
      setRows(json.rows);
    };
    tick();
    t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-black/60">
          Production-style log view (MVP). If enabled, approvals can also be stored in 0G Storage.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 overflow-hidden">
        <div className="grid grid-cols-[1.2fr_.7fr_.7fr] md:grid-cols-[1.3fr_.8fr_.8fr_1fr] gap-3 px-5 py-3 border-b border-black/10 text-xs uppercase tracking-wider text-black/40">
          <div>Request</div>
          <div>Status</div>
          <div className="hidden md:block">Device</div>
          <div>Storage</div>
        </div>

        <div className="divide-y divide-black/10">
          {rows.length ? (
            rows.map((r) => (
              <div key={r.requestId} className="grid grid-cols-[1.2fr_.7fr_.7fr] md:grid-cols-[1.3fr_.8fr_.8fr_1fr] gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{r.requestId}</div>
                  <div className="font-mono text-[11px] text-black/50 truncate">{r.userOpHash}</div>
                </div>
                <div className="flex items-start">
                  <Badge status={r.status} />
                </div>
                <div className="hidden md:block text-sm text-black/70">{r.deviceId}</div>
                <div className="min-w-0">
                  {r.storageRootHash ? (
                    <div className="space-y-1">
                      <a
                        className="block font-mono text-[11px] truncate text-black/80 hover:underline"
                        href="https://storagescan-galileo.0g.ai/"
                        target="_blank"
                        rel="noreferrer"
                        title="Open 0G Storage Scan (Galileo)"
                      >
                        {r.storageRootHash}
                      </a>
                      {r.storageTxHash ? (
                        <a
                          className="block font-mono text-[11px] truncate text-black/60 hover:underline"
                          href={`https://chainscan-galileo.0g.ai/tx/${r.storageTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on 0G ChainScan"
                        >
                          tx: {r.storageTxHash}
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm text-black/40">—</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-black/60">No requests yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
