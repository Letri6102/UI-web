import Link from "next/link";

export default function NavCard({
  href,
  title,
  desc,
  meta,
}: {
  href: string;
  title: string;
  desc: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.8rem] border border-white/10 bg-slate-950/68 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-sky-300/35 hover:bg-slate-950/86"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white group-hover:text-sky-100">{title}</div>
          <div className="mt-3 text-sm leading-6 text-slate-300">{desc}</div>
        </div>
        {meta ? (
          <span className="rounded-full border border-sky-300/30 bg-sky-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-sky-100">
            {meta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
