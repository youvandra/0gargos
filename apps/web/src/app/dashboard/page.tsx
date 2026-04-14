"use client";

import { useEffect, useState } from "react";

type Stats = {
  pending: number;
  approved: number;
  denied: number;
  total: number;
  recent: Array<{ requestId: string; status: string; createdAt: number }>;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 p-5">
      <div className="text-xs uppercase tracking-wider text-black/40">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      const res = await fetch("/api/requests/stats");
      const json = (await res.json()) as Stats;
      setStats(json);
    };
    tick();
    t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-black/60">
          0GArgos is a programmable physical security layer: sensitive operations require an out-of-band device approval
          (TFT + button), and proofs can be anchored to 0G infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats?.pending ?? 0} />
        <StatCard label="Approved" value={stats?.approved ?? 0} />
        <StatCard label="Denied" value={stats?.denied ?? 0} />
        <StatCard label="Total" value={stats?.total ?? 0} />
      </div>

      <div className="rounded-xl border border-black/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <div className="font-medium">Recent activity</div>
          <div className="text-xs text-black/50">auto-refresh</div>
        </div>
        <div className="p-5">
          {stats?.recent?.length ? (
            <div className="space-y-3">
              {stats.recent.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                  <div className="font-mono text-xs">{r.requestId}</div>
                  <div className="text-xs text-black/60">{r.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-black/60">No activity yet. Create a device approval request first.</div>
          )}
        </div>
      </div>
    </div>
  );
}
