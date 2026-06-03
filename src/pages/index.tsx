import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  CircleDollarSign,
  Database,
  Download,
  FileUp,
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
import { Shell } from "@/components/shell";
import { loadModel } from "@/lib/model";
import { CHART_COLORS, CHART_SERIES, chartAxisProps, chartGridProps, chartTooltipProps, truncateSkuName } from "@/lib/charts";
import { num, percent, rub } from "@/lib/format";

export async function getServerSideProps() {
  const data = await loadModel();
  const economics = data.economics.map((sku: any) => ({
    productId: sku.productId,
    name: sku.name,
    ingredientCost: sku.ingredientCost,
    packagingCost: sku.packagingCost,
    contributionMarginPercent: sku.contributionMarginPercent,
    ebitdaMarginPercent: sku.ebitdaMarginPercent,
    ebitdaPerItem: sku.ebitdaPerItem,
    hasRecipe: sku.hasRecipe,
    hasPackaging: sku.hasPackaging
  }));
  const franchise = data.franchiseModel?.franchise ?? {};
  const summary = {
    monthlyRevenue: data.model.monthlyRevenue,
    monthlyOrders: data.model.monthlyOrders,
    grossProfit: data.model.grossProfit,
    ebitda: data.model.ebitda,
    ebitdaMargin: data.model.ebitdaMargin,
    operatingCashflow: data.model.operatingCashflow,
    initialInvestment: data.model.initialInvestment,
    paybackMonth: data.model.paybackMonth,
    roi: data.model.roi,
    breakEvenOrdersPerDay: data.model.breakEvenOrdersPerDay,
    foodCostTotal: data.model.foodCostTotal,
    packagingTotal: data.model.packagingTotal,
    variableCosts: data.model.variableCosts,
    fixedCosts: data.model.fixedCosts,
    taxPaid: data.model.taxPaid,
    monthlyDepreciation: data.model.monthlyDepreciation
  };
  const completeness = [
    { label: "Цены SKU", done: data.products.filter((sku: any) => sku.salePrice > 0).length, total: data.products.length },
    { label: "Рецептуры", done: economics.filter((sku: any) => sku.hasRecipe).length, total: economics.length },
    { label: "Упаковка SKU", done: economics.filter((sku: any) => sku.hasPackaging).length, total: economics.length },
    { label: "CAPEX", done: data.capex.filter((row: any) => row.amount > 0).length, total: Math.max(data.capex.length, 1) },
    { label: "OPEX", done: data.opex.filter((row: any) => row.amount > 0).length, total: Math.max(data.opex.length, 1) },
    { label: "Store Model", done: [data.store.workingDaysPerMonth, data.store.avgOrdersPerDay, data.store.avgItemsPerOrder, data.store.avgCheck].filter((value: number) => value > 0).length, total: 4 },
    { label: "Franchise", done: [
      franchise.franchiseWorkingDaysPerMonth,
      franchise.franchiseAvgOrdersPerDay,
      franchise.franchiseAvgItemsPerOrder,
      franchise.franchiseAvgCheck,
      (franchise.franchiseRent ?? 0) + (franchise.franchisePayroll ?? 0) + (franchise.franchiseOtherFixedOpex ?? 0)
    ].filter((value: number) => value > 0).length, total: 5 }
  ];

  return {
    props: {
      summary,
      checks: data.checks.map((check: any) => ({ code: check.code, severity: check.severity, message: check.message })),
      diagnostics: data.diagnostics.map((item: any) => ({ severity: item.severity, message: item.message })),
      economics,
      sensitivity: data.sensitivity.map((row: any) => ({ parameter: row.parameter, impactOnEbitda: row.impactOnEbitda })),
      cashflow: data.model.cumulativeCashflow.slice(0, 24).map((row: any) => ({ month: row.month, cumulativeCashflow: row.cumulativeCashflow })),
      franchisePayback: data.franchiseModel?.franchisee?.cumulativeCashflow24?.map((row: any) => ({ month: row.month, openingInvestment: row.openingInvestment, cumulativeCashflow: row.cumulativeCashflow })) ?? [],
      activeSkuCount: data.products.filter((sku: any) => sku.isActive !== false).length,
      missingRecipeCount: economics.filter((sku: any) => !sku.hasRecipe).length,
      negativeEbitdaCount: economics.filter((sku: any) => sku.ebitdaPerItem < 0).length,
      completeness
    }
  };
}

export default function Dashboard({ summary, checks, diagnostics, economics, sensitivity, cashflow, franchisePayback, activeSkuCount, missingRecipeCount, negativeEbitdaCount, completeness }: any) {
  const withCosts = economics.filter((sku: any) => sku.ingredientCost > 0 || sku.packagingCost > 0);
  const top = [...withCosts].sort((a, b) => b.ebitdaPerItem - a.ebitdaPerItem).slice(0, 10);
  const weak = [...withCosts].sort((a, b) => a.contributionMarginPercent - b.contributionMarginPercent).slice(0, 5);
  const hasInvestmentPaybackBase = summary.initialInvestment > 0 && summary.monthlyRevenue > 0 && summary.operatingCashflow > 0;
  const hasPayback = hasInvestmentPaybackBase && summary.paybackMonth;
  const hasRoi = hasInvestmentPaybackBase && summary.roi != null;
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
  const hasFranchisePreview = franchisePayback.some((row: any) => row.openingInvestment > 0 || row.cumulativeCashflow !== 0);
  const cashflowLineColor = forecast.some((row) => row.cashflow < 0) ? CHART_COLORS.red : CHART_COLORS.warning;

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
        <Metric title="Выручка / мес" value={rub(summary.monthlyRevenue)} note="Текущая модель точки" icon={<CircleDollarSign size={18} />} />
        <Metric title="Валовая прибыль" value={rub(summary.grossProfit)} note="После себестоимости и упаковки" icon={<TrendingUp size={18} />} />
        <Metric title="EBITDA" value={rub(summary.ebitda)} note="До налогов и cashflow-корректировок" icon={<BarChart3 size={18} />} />
        <Metric title="Маржа EBITDA" value={percent(summary.ebitdaMargin)} note="EBITDA / выручка" icon={<LineChartIcon size={18} />} />
        <Metric title="Операционный cashflow" value={rub(summary.operatingCashflow)} note="После налогов и выплат" icon={<WalletCards size={18} />} />
        <Metric title="Инвестиции на открытие" value={rub(summary.initialInvestment)} note="CAPEX до старта" icon={<ReceiptText size={18} />} />
        <Metric title="Payback" value={hasPayback ? `${summary.paybackMonth} мес.` : "n/a"} note={hasPayback ? "На базе текущих CAPEX и cashflow" : "Не считается без CAPEX и cashflow"} icon={<Calculator size={18} />} />
        <Metric title="Break-even / день" value={summary.monthlyRevenue > 0 && summary.breakEvenOrdersPerDay != null ? `${Math.ceil(summary.breakEvenOrdersPerDay)} заказов` : "n/a"} note="Заказы для выхода в ноль" icon={<ShieldCheck size={18} />} />
        <Metric title="Активные SKU" value={num(activeSkuCount, 0)} note="Включены в меню" icon={<Table2 size={18} />} />
        <Metric title="SKU без рецептуры" value={num(missingRecipeCount, 0)} note="Нужно заполнить состав" icon={<Layers size={18} />} />
        <Metric title="SKU с отрицательной EBITDA" value={num(negativeEbitdaCount, 0)} note="Требуют проверки цены или затрат" icon={<AlertTriangle size={18} />} />
        <Metric title="ROI" value={hasRoi ? percent(summary.roi) : "n/a"} note={hasRoi ? "Годовой ROI по текущим допущениям" : "Не считается без CAPEX и cashflow"} icon={<Database size={18} />} />
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

      <section className="band dashboardFinanceChart">
        <div className="sectionHead">
          <h2>Выручка / EBITDA / Cashflow</h2>
          <span>Выручка показана отдельно от операционных линий, чтобы масштаб не искажал EBITDA и Cashflow.</span>
        </div>
        <div className="dashboardChartStack">
          <div className="chartPane">
            <div className="chartPaneTitle">Выручка <span>12 месяцев</span></div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={forecast} margin={{ top: 10, right: 20, bottom: 4, left: 8 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
                <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
                <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                <Line type="monotone" dataKey="revenue" name="Выручка" stroke={CHART_COLORS.blueSoft} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blueSoft, stroke: CHART_COLORS.surface, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chartPane">
            <div className="chartPaneTitle">EBITDA и Cashflow <span>операционные линии</span></div>
            <ResponsiveContainer width="100%" height={205}>
              <LineChart data={forecast} margin={{ top: 10, right: 20, bottom: 4, left: 8 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
                <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
                <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                <Legend verticalAlign="top" height={24} />
                <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeDasharray="4 5" />
                <Line type="monotone" dataKey="ebitda" stroke={CHART_COLORS.olive} strokeWidth={2.8} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.olive, stroke: CHART_COLORS.surface, strokeWidth: 2 }} name="EBITDA" />
                <Line type="monotone" dataKey="cashflow" stroke={cashflowLineColor} strokeWidth={2.8} dot={false} activeDot={{ r: 5, fill: cashflowLineColor, stroke: CHART_COLORS.surface, strokeWidth: 2 }} name="Cashflow" />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
          <h2>Unit Economics по SKU</h2>
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
          <h2>Чувствительность модели</h2>
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
          <h2>Payback франшизы</h2>
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
            {completeness.map((item: { label: string; done: number; total: number }) => <ProgressCard key={item.label} {...item} />)}
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
