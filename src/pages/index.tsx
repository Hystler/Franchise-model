import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  CircleDollarSign,
  Database,
  Download,
  FileSpreadsheet,
  FileUp,
  LayoutDashboard,
  Layers,
  LineChart as LineChartIcon,
  Plus,
  ReceiptText,
  ShieldCheck,
  Table2,
  TrendingUp,
  WalletCards
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { loadModel } from "@/lib/model";
import { CHART_COLORS, CHART_SERIES, chartAxisProps, chartGridProps, chartTooltipProps, truncateSkuName } from "@/lib/charts";
import { num, percent, rub } from "@/lib/format";

export async function getServerSideProps() {
  const data = await loadModel();
  return {
    props: {
      summary: data.model,
      checks: data.checks,
      diagnostics: data.diagnostics,
      economics: data.economics,
      sensitivity: data.sensitivity,
      cashflow: data.model.cumulativeCashflow.slice(0, 24),
      franchiseModel: data.franchiseModel,
      products: data.products,
      capex: data.capex,
      opex: data.opex,
      store: data.store
    }
  };
}

export default function Dashboard({ summary, checks, diagnostics, economics, sensitivity, cashflow, franchiseModel, products, capex, opex, store }: any) {
  const withCosts = economics.filter((sku: any) => sku.ingredientCost > 0 || sku.packagingCost > 0);
  const top = [...withCosts].sort((a, b) => b.ebitdaPerItem - a.ebitdaPerItem).slice(0, 10);
  const weak = [...withCosts].sort((a, b) => a.contributionMarginPercent - b.contributionMarginPercent).slice(0, 5);
  const activeSkuCount = products.filter((sku: any) => sku.isActive !== false).length;
  const missingRecipeCount = economics.filter((sku: any) => !sku.hasRecipe).length;
  const negativeEbitdaCount = economics.filter((sku: any) => sku.ebitdaPerItem < 0).length;
  const hasInvestmentPaybackBase = summary.initialInvestment > 0 && summary.monthlyRevenue > 0 && summary.operatingCashflow > 0;
  const forecast = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    revenue: summary.monthlyRevenue,
    ebitda: summary.ebitda,
    cashflow: summary.operatingCashflow,
    cumulativeCashflow: cashflow[index]?.cumulativeCashflow ?? 0
  }));
  const expenseStructure = [
    { name: "Себестоимость", value: summary.foodCostTotal },
    { name: "Упаковка", value: summary.packagingTotal },
    { name: "Переменные расходы", value: summary.variableCosts },
    { name: "Постоянные расходы", value: summary.fixedCosts },
    { name: "Налоги", value: summary.taxPaid },
    { name: "Амортизация", value: summary.monthlyDepreciation }
  ].filter((item) => item.value > 0);
  const breakEven = Array.from({ length: 9 }, (_, index) => {
    const ordersPerDay = Math.max(0, Math.round((summary.breakEvenOrdersPerDay ?? 50) * (0.4 + index * 0.15)));
    const revenue = ordersPerDay * (summary.monthlyRevenue / Math.max(summary.monthlyOrders, 1)) * 30;
    const scale = summary.monthlyRevenue > 0 ? revenue / summary.monthlyRevenue : 0;
    return { ordersPerDay, ebitda: summary.ebitda * scale + summary.fixedCosts * (scale - 1) };
  });
  const hasSkuCosts = withCosts.length > 0;
  const skuRanking = top.map((row: any) => ({
    shortName: truncateSkuName(row.name, 28),
    fullName: row.name,
    ebitdaPerItem: row.ebitdaPerItem
  }));
  const skuChartHeight = Math.max(320, skuRanking.length * 36);
  const tornado = sensitivity
    .map((row: any) => ({ parameter: truncateSkuName(row.parameter, 26), fullName: row.parameter, impact: row.impactOnEbitda ?? 0 }))
    .sort((a: any, b: any) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8);
  const tornadoHeight = Math.max(320, tornado.length * 42);
  const franchisePayback = franchiseModel?.franchisee?.cumulativeCashflow24 ?? [];
  const hasFranchisePreview = franchisePayback.some((row: any) => row.openingInvestment > 0 || row.cumulativeCashflow !== 0);
  const completeness = [
    { label: "Цены SKU", done: products.filter((sku: any) => sku.salePrice > 0).length, total: products.length },
    { label: "Рецептуры", done: economics.filter((sku: any) => sku.hasRecipe).length, total: economics.length },
    { label: "Упаковка SKU", done: economics.filter((sku: any) => sku.hasPackaging).length, total: economics.length },
    { label: "CAPEX", done: capex.filter((row: any) => row.amount > 0).length, total: Math.max(capex.length, 1) },
    { label: "OPEX", done: opex.filter((row: any) => row.amount > 0).length, total: Math.max(opex.length, 1) },
    { label: "Store Model", done: [store.workingDaysPerMonth, store.avgOrdersPerDay, store.avgItemsPerOrder, store.avgCheck].filter((value: number) => value > 0).length, total: 4 },
    { label: "Franchise", done: [
      franchiseModel.franchise.franchiseWorkingDaysPerMonth,
      franchiseModel.franchise.franchiseAvgOrdersPerDay,
      franchiseModel.franchise.franchiseAvgItemsPerOrder,
      franchiseModel.franchise.franchiseAvgCheck,
      franchiseModel.franchise.franchiseRent + franchiseModel.franchise.franchisePayroll + franchiseModel.franchise.franchiseOtherFixedOpex
    ].filter((value: number) => value > 0).length, total: 5 }
  ];

  return (
    <Shell>
      <div className="pageHeader">
        <div>
          <h1>Финансовая модель франшизы</h1>
          <p>Расчёт экономики точки, SKU, CAPEX, OPEX, EBITDA, cashflow, Payback, ROI и сценариев масштабирования.</p>
          <div className="badgeRow">
            <span className="pill">Демо-модель</span>
            <span className="pill">Редактируемые допущения</span>
          </div>
        </div>
        <div className="actions">
          <Link className="button" href="/import"><FileUp size={16} /> Импорт</Link>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button primary" href="/api/export/full"><Download size={16} /> XLSX</a>
        </div>
      </div>

      <div className="metrics">
        <Metric title="Выручка / мес" value={rub(summary.monthlyRevenue)} note="Текущая Store Model" icon={<CircleDollarSign size={18} />} />
        <Metric title="Валовая прибыль" value={rub(summary.grossProfit)} note="После себестоимости и упаковки" icon={<TrendingUp size={18} />} />
        <Metric title="EBITDA" value={rub(summary.ebitda)} note="До налогов и cashflow-корректировок" icon={<BarChart3 size={18} />} />
        <Metric title="Маржа EBITDA" value={percent(summary.ebitdaMargin)} note="EBITDA / выручка" icon={<LineChartIcon size={18} />} />
        <Metric title="Операционный cashflow" value={rub(summary.operatingCashflow)} note="После налогов и выплат" icon={<WalletCards size={18} />} />
        <Metric title="Инвестиции на открытие" value={rub(summary.initialInvestment)} note="CAPEX до старта" icon={<ReceiptText size={18} />} />
        <Metric title="Payback" value={hasInvestmentPaybackBase && summary.paybackMonth ? `${summary.paybackMonth} мес.` : "n/a"} note="Не считается при пустой модели" icon={<Calculator size={18} />} />
        <Metric title="Break-even / день" value={summary.monthlyRevenue > 0 && summary.breakEvenOrdersPerDay != null ? `${Math.ceil(summary.breakEvenOrdersPerDay)} заказов` : "n/a"} note="Заказы для выхода в ноль" icon={<ShieldCheck size={18} />} />
        <Metric title="Активные SKU" value={num(activeSkuCount, 0)} note="Включены в меню" icon={<Table2 size={18} />} />
        <Metric title="SKU без рецептуры" value={num(missingRecipeCount, 0)} note="Нужно заполнить состав" icon={<Layers size={18} />} />
        <Metric title="SKU с отрицательной EBITDA" value={num(negativeEbitdaCount, 0)} note="Требуют проверки цены или затрат" icon={<AlertTriangle size={18} />} />
        <Metric title="ROI" value={hasInvestmentPaybackBase && summary.roi != null ? percent(summary.roi) : "n/a"} note="Не считается без CAPEX и cashflow" icon={<Database size={18} />} />
      </div>

      <section className="band quickActions">
        <div className="sectionHead">
          <h2>Быстрые действия</h2>
          <span>Самые частые переходы для заполнения модели</span>
        </div>
        <div className="actions">
          <Link className="button primary" href="/menu"><Plus size={16} /> Добавить SKU</Link>
          <Link className="button" href="/ingredients"><Layers size={16} /> Добавить ингредиент</Link>
          <Link className="button" href="/store-model"><Calculator size={16} /> Заполнить Store Model</Link>
          <Link className="button" href="/store-model#capex"><ReceiptText size={16} /> Добавить CAPEX</Link>
          <Link className="button" href="/store-model#opex">Добавить OPEX</Link>
          <Link className="button" href="/franchise">Открыть Franchise</Link>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button" href="/api/export/full"><Download size={16} /> Экспорт XLSX</a>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <h2>Выручка / EBITDA / Cashflow</h2>
          <span>12 месяцев на базе текущих допущений</span>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={forecast} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `${value}`} />
              <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
              <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
              <Legend />
              <Bar dataKey="revenue" fill={CHART_COLORS.blueSoft} name="Выручка" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="ebitda" stroke={CHART_COLORS.olive} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blueSoft, stroke: CHART_COLORS.surface }} name="EBITDA" />
              <Line type="monotone" dataKey="cashflow" stroke={CHART_COLORS.warning} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blueSoft, stroke: CHART_COLORS.surface }} name="Cashflow" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Diagnostics diagnostics={diagnostics} />

      <div className="twoCol">
        <section className="band">
          <h2>Структура расходов</h2>
          <div className="chart">
            {expenseStructure.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseStructure} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92}>
                    {expenseStructure.map((_: any, index: number) => <Cell key={index} fill={CHART_SERIES[index % CHART_SERIES.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="emptyState">Заполните SKU, OPEX и налоговые допущения, чтобы увидеть структуру расходов.</div>}
          </div>
        </section>
        <section className="band">
          <h2>Break-even</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={breakEven} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="ordersPerDay" {...chartAxisProps} />
                <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
                <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
                <ReferenceLine y={0} stroke={CHART_COLORS.red} />
                <Line type="monotone" dataKey="ebitda" stroke={CHART_COLORS.blueSoft} strokeWidth={3} dot={{ r: 3, fill: CHART_COLORS.blueSoft }} activeDot={{ r: 5 }} name="EBITDA" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="twoCol">
        <section className="band">
          <h2>Unit Economics SKU</h2>
          {!hasSkuCosts ? (
            <div className="emptyState">Заполните рецептуры и закупочные цены, чтобы увидеть рейтинг маржинальности.</div>
          ) : (
            <>
              {economics.length > 10 && <Link className="subtleLink" href="/menu">Показать все в таблице</Link>}
              <div className="chart" style={{ height: skuChartHeight }}>
                <ResponsiveContainer width="100%" height={skuChartHeight}>
                  <BarChart data={skuRanking} layout="vertical" margin={{ left: 18, right: 18 }}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis type="number" {...chartAxisProps} tickFormatter={(value) => rub(Number(value))} />
                    <YAxis type="category" dataKey="shortName" width={220} {...chartAxisProps} />
                    <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(_, payload: any) => payload?.[0]?.payload?.fullName ?? ""} />
                    <ReferenceLine x={0} stroke={CHART_COLORS.grid} />
                    <Bar dataKey="ebitdaPerItem" name="EBITDA / SKU" fill={CHART_COLORS.olive} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
        <section className="band">
          <h2>Sensitivity: влияние на EBITDA</h2>
          <div className="chart" style={{ height: tornadoHeight }}>
            <ResponsiveContainer width="100%" height={tornadoHeight}>
              <BarChart data={tornado} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis type="number" {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} />
                <YAxis type="category" dataKey="parameter" width={210} {...chartAxisProps} />
                <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(_, payload: any) => payload?.[0]?.payload?.fullName ?? ""} />
                <Bar dataKey="impact">
                  {tornado.map((row: any, index: number) => <Cell key={index} fill={row.impact < 0 ? CHART_COLORS.red : CHART_COLORS.olive} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="twoCol">
        <section className="band">
          <h2>Payback Franchise</h2>
          {hasFranchisePreview ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={franchisePayback} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
                  <XAxis dataKey="month" tickFormatter={(value) => `M${value}`} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                  <ReferenceLine y={0} stroke={CHART_COLORS.red} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="cumulativeCashflow" name="Накопленный cashflow" stroke={CHART_COLORS.blueSoft} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="emptyState"><Link className="button primary" href="/franchise">Заполнить Franchise</Link></div>
          )}
        </section>
        <section className="band">
          <h2>Заполненность модели</h2>
          <div className="progressGrid">
            {completeness.map((item) => <ProgressCard key={item.label} {...item} />)}
          </div>
        </section>
      </div>

      <div className="twoCol">
        <section className="band">
          <h2>Самые прибыльные SKU</h2>
          <SimpleSkuList rows={top} />
        </section>
        <section className="band">
          <h2>Слабые SKU по марже</h2>
          <SimpleSkuList rows={weak} />
        </section>
      </div>

      <section className="band">
        <div className="sectionHead">
          <h2>Аудит модели</h2>
          <Link href="/checks">Открыть все</Link>
        </div>
        <div className="checks">
          {checks.slice(0, 10).map((check: any) => (
            <div className={`check ${check.severity}`} key={`${check.code}-${check.message}`}>
              <AlertTriangle size={16} />
              <span>{check.message}</span>
            </div>
          ))}
          {!checks.length && <p>Критичных проверок нет. Модель выглядит готовой для демо-сценария.</p>}
        </div>
      </section>
    </Shell>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: any[] }) {
  return (
    <section className="band warningPanel">
      <h2>Почему EBITDA / Cashflow отрицательные</h2>
      {diagnostics.length ? diagnostics.map((item) => <div className={`check ${item.severity}`} key={item.message}>{item.message}</div>) : <p>Явных причин отрицательных значений сейчас нет. Для реальной модели заполните рецептуры, упаковку и операционные допущения.</p>}
    </section>
  );
}

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


function Metric({ title, value, note, icon }: { title: string; value: string; note?: string; icon?: ReactNode }) {
  return (
    <div className="metric">
      <span>{icon}{title}</span>
      <strong>{value}</strong>
      {note && <em>{note}</em>}
    </div>
  );
}

function SimpleSkuList({ rows }: { rows: any[] }) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.productId}>
            <td>{row.name}</td>
            <td>{rub(row.ebitdaPerItem)}</td>
            <td>{percent(row.ebitdaMarginPercent)}</td>
          </tr>
        ))}
        {!rows.length && <tr><td>Добавьте SKU, чтобы построить Unit Economics.</td></tr>}
      </tbody>
    </table>
  );
}

function ProgressCard({ label, done, total }: { label: string; done: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(100, Math.round((done / safeTotal) * 100));
  return (
    <div className="progressCard">
      <div><strong>{label}</strong><span>{done} / {safeTotal}</span></div>
      <div className="progressTrack"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function compactRub(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 0)}k`;
  return num(value, 0);
}
