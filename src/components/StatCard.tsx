export default function StatCard({
  label,
  value,
  hint,
  compact = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      {hint ? <div className={`${compact ? "mt-2 leading-5" : "mt-3 leading-6"} text-sm text-slate-300`}>{hint}</div> : null}
    </div>
  );
}
