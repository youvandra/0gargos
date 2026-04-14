import Link from "next/link";

const NavItem = ({ href, label }: { href: string; label: string }) => {
  const isExternal = /^https?:\/\//.test(href);
  const className = "rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/[0.04] hover:text-black";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={className}>
      {label}
    </Link>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      <aside className="md:sticky md:top-6 h-fit rounded-xl border border-black/10 p-3">
        <div className="px-3 py-2">
          <div className="text-xs uppercase tracking-wider text-black/40">Dashboard</div>
          <div className="mt-1 font-semibold">0GArgos</div>
        </div>

        <nav className="mt-2 flex flex-col gap-1">
          <NavItem href="/dashboard" label="Overview" />
          <NavItem href="/dashboard/approvals" label="Device approvals" />
          <NavItem href="/dashboard/audit" label="Audit log" />
          <div className="mt-2 border-t border-black/10 pt-2" />
          <NavItem href="https://chainscan-galileo.0g.ai" label="0G Explorer" />
        </nav>
      </aside>

      <section className="space-y-6">{children}</section>
    </div>
  );
}
