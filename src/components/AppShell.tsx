"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const PRIMARY_NAV = [
  { href: "/", label: "Tổng quan", desc: "Tình hình ca trực và cảnh báo mới" },
  { href: "/webcam", label: "Xem camera", desc: "Theo dõi luồng hình và xử lý nhanh" },
  { href: "/events", label: "Xử lý cảnh báo", desc: "Xác minh ảnh, clip và kết quả" },
  { href: "/settings", label: "Thiết lập", desc: "Chỉnh camera, vùng và ngưỡng cảnh báo" },
];

const SUPPORT_NAV = [
  { href: "/upload", label: "Kiểm tra nhanh", desc: "Tải ảnh để xem thử kết quả AI" },
  { href: "/logs", label: "Nhật ký hệ thống", desc: "Dùng khi cần kiểm tra lỗi kỹ thuật" },
];

function NavItem({
  href,
  label,
  desc,
  active,
}: {
  href: string;
  label: string;
  desc: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.5rem] border px-4 py-4 transition ${
        active
          ? "border-sky-300/35 bg-sky-300/12 shadow-[0_18px_40px_rgba(35,140,200,0.16)]"
          : "border-white/8 bg-white/5 hover:border-white/14 hover:bg-white/7"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-sm font-semibold ${active ? "text-sky-100" : "text-white"}`}>{label}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{desc}</div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${
            active ? "bg-sky-200/14 text-sky-100" : "bg-slate-900/80 text-slate-400"
          }`}
        >
          {active ? "Đang mở" : "Mở"}
        </div>
      </div>
    </Link>
  );
}

function MobileNavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.2rem] px-2 py-2 text-center transition ${
        active ? "bg-sky-300/14 text-sky-100" : "text-slate-300"
      }`}
    >
      <span className="text-[11px] font-semibold tracking-[0.18em] uppercase">{label}</span>
    </Link>
  );
}

export default function AppShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:gap-5 lg:px-6 lg:py-6">
        <aside className="hidden rounded-[2rem] border border-white/10 bg-slate-950/74 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)] lg:w-[320px] lg:flex-none lg:p-6">
          <div className="rounded-[1.8rem] border border-sky-300/14 bg-[linear-gradient(145deg,rgba(81,186,255,0.18),rgba(6,16,26,0.18))] px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.34em] text-sky-100/80">Warehouse Supervisor</div>
            <div className="mt-3 text-2xl font-semibold text-white">Trung tâm giám sát kho</div>
            <div className="mt-3 text-sm leading-6 text-slate-200">
              Giao diện dành cho người trực ca để theo dõi camera, xác minh cảnh báo và lưu bằng chứng.
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Màn hình chính</div>
            <div className="mt-3 space-y-3">
              {PRIMARY_NAV.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  desc={item.desc}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Công cụ hỗ trợ</div>
            <div className="mt-3 space-y-3">
              {SUPPORT_NAV.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  desc={item.desc}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[1.7rem] border border-white/8 bg-white/5 px-5 py-5 text-sm text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Lưu ý trong ca trực</div>
            <div className="mt-3 leading-6">Ưu tiên camera có cảnh báo hoặc mất kết nối trước khi kiểm tra các màn khác.</div>
            <div className="mt-2 leading-6">Khi xác nhận sự kiện, nên mở ảnh hoặc clip để ghi chú rõ cho ca sau.</div>
            <div className="mt-2 leading-6">Màn hình nhật ký và kiểm tra nhanh chỉ dùng khi cần xử lý lỗi kỹ thuật.</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-3 rounded-[1.5rem] border border-white/10 bg-slate-950/68 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.34em] text-sky-100/80">Warehouse Supervisor</div>
                <div className="mt-2 text-xl font-semibold text-white">Trực ca trên điện thoại</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Theo dõi camera, xác minh cảnh báo và lưu bằng chứng ngay trên màn hình nhỏ.
                </div>
              </div>
              <div className="rounded-full border border-sky-300/25 bg-sky-300/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                Mobile
              </div>
            </div>
          </div>

          <header className="rounded-[1.7rem] border border-white/10 bg-slate-950/74 px-4 py-4 shadow-[0_28px_75px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5 sm:py-5 md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Điều hành ca trực</div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300 md:text-[15px] md:leading-7">{subtitle}</p> : null}
              </div>
              {right ? <div className="shrink-0 max-sm:w-full">{right}</div> : null}
            </div>
          </header>

          <main className="mt-4 space-y-4 pb-24 sm:mt-5 sm:space-y-5 lg:pb-0">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/92 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[720px] gap-2">
          {PRIMARY_NAV.map((item) => (
            <MobileNavItem key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
          ))}
        </div>
      </nav>
    </div>
  );
}
