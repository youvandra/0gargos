import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* subtle network-ish background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-8 h-[520px] w-[860px] -translate-x-1/2 rounded-[48px] border border-black/5 bg-gradient-to-b from-black/[0.02] to-transparent" />
        <div className="absolute left-1/2 top-24 -translate-x-1/2 h-56 w-[720px] opacity-50">
          <div className="absolute left-8 top-6 h-12 w-12 rounded-2xl border border-black/10 bg-white shadow-sm" />
          <div className="absolute left-44 top-2 h-12 w-12 rounded-2xl border border-black/10 bg-white shadow-sm" />
          <div className="absolute left-80 top-10 h-16 w-16 rounded-2xl border border-black/10 bg-white shadow-sm ring-2 ring-accent/30" />
          <div className="absolute right-44 top-6 h-12 w-12 rounded-2xl border border-black/10 bg-white shadow-sm" />
          <div className="absolute right-8 top-2 h-12 w-12 rounded-2xl border border-black/10 bg-white shadow-sm" />
          <div className="absolute left-20 top-28 h-px w-[560px] bg-black/10" />
          <div className="absolute left-44 top-12 h-px w-[420px] bg-black/10" />
          <div className="absolute left-80 top-18 h-px w-[260px] bg-black/10" />
        </div>
      </div>

      <div className="relative space-y-14 pt-10">
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/70">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Programmable Physical Security Layer · MVP
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Stop intent manipulation with hardware‑anchored approvals.
          </h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg text-black/60">What you approve is shown on a
            trusted device screen—separate from the host UI that can be compromised.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-white text-sm">
              Open dashboard
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-sm font-medium">Out‑of‑band truth</div>
            <div className="mt-1 text-sm text-black/60">
              Approval details appear on the device display, not on the potentially compromised browser.
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-sm font-medium">Programmable policy</div>
            <div className="mt-1 text-sm text-black/60">
              Device2FAAccount requires an extra device signature when value crosses a configured threshold.
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-sm font-medium">Verifiable audit trail</div>
            <div className="mt-1 text-sm text-black/60">
              Store approval proofs as JSON blobs in 0G Storage to keep an immutable record of intent.
            </div>
          </div>
        </section>

        <footer className="pt-8 pb-2 text-center text-xs text-black/40">
          0GArgos MVP · Demo environment (testnet) · Not production‑hardened
        </footer>
      </div>
    </div>
  );
}
