import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import {
  Calculator,
  Database,
  Download,
  FileSpreadsheet,
  FileUp,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Table2,
  TrendingUp
} from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const current = router.pathname;
  const isData = current === "/menu" || current === "/ingredients" || current.startsWith("/sku");
  const isStore = current === "/store" || current === "/store-model" || current === "/capex" || current === "/opex" || current === "/sensitivity";
  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard size={16} />, active: current === "/" },
    { href: "/menu", label: "Данные", icon: <Database size={16} />, active: isData },
    { href: "/store-model", label: "Store Model", icon: <Calculator size={16} />, active: isStore },
    { href: "/forecast", label: "Прогноз", icon: <TrendingUp size={16} />, active: current === "/forecast" },
    { href: "/franchise", label: "Franchise", icon: <FileSpreadsheet size={16} />, active: current === "/franchise" },
    { href: "/audit", label: "Аудит", icon: <ShieldCheck size={16} />, active: current === "/checks" || current === "/audit" }
  ];

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="brand"><LayoutDashboard size={18} /> Franchise Model</Link>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={item.active ? "active" : ""}>{item.icon}{item.label}</Link>
        ))}
        <span className="navSpacer" />
        <Link href="/import" className="navAction"><FileUp size={16} /> Импорт</Link>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/export/full" className="navAction primaryNavAction"><Download size={16} /> Экспорт XLSX</a>
      </nav>
      {isData && <DataSubnav />}
      {isStore && <StoreSubnav />}
      <main className="main">{children}</main>
    </div>
  );
}

function DataSubnav() {
  return (
    <div className="subnav">
      <Link href="/menu"><Table2 size={15} /> SKU</Link>
      <Link href="/ingredients"><Layers size={15} /> Ингредиенты</Link>
      <Link href="/menu">Рецептуры</Link>
      <Link href="/ingredients">Упаковка</Link>
    </div>
  );
}

function StoreSubnav() {
  return (
    <div className="subnav">
      <Link href="/store-model#overview">Overview</Link>
      <Link href="/store-model#inputs">Inputs</Link>
      <Link href="/store-model#pnl">P&L</Link>
      <Link href="/store-model#cashflow">Cashflow</Link>
      <Link href="/store-model#capex">CAPEX</Link>
      <Link href="/store-model#opex">OPEX</Link>
      <Link href="/store-model#sensitivity">Sensitivity</Link>
      <Link href="/store-model#break-even">Break-even</Link>
      <Link href="/store-model#checks">Checks</Link>
    </div>
  );
}
