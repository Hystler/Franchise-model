import { Shell } from "@/pages/index";
import { CapexSection, OpexSection, SensitivitySection } from "@/components/store-model-sections";
import { loadModel } from "@/lib/model";
import { CHART_COLORS, chartAxisProps, chartGridProps, chartTooltipProps } from "@/lib/charts";
import { num, percent, rub } from "@/lib/format";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export async function getServerSideProps() {
  const data = await loadModel();
  return {
    props: {
      store: JSON.parse(JSON.stringify(data.storeRaw)),
      tax: JSON.parse(JSON.stringify(data.taxRaw)),
      model: data.model,
      diagnostics: data.diagnostics,
      capexRows: JSON.parse(JSON.stringify(data.capexRaw)),
      opexRows: JSON.parse(JSON.stringify(data.opexRaw)),
      sensitivity: data.sensitivity,
      checks: data.checks
    }
  };
}

export default function StorePage({ store, tax, model, diagnostics, capexRows, opexRows, sensitivity, checks }: any) {
  const forecast = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    revenue: model.monthlyRevenue,
    ebitda: model.ebitda,
    cashflow: model.operatingCashflow
  }));
  const cashflowRows = model.cumulativeCashflow.slice(0, 24);
  const storeChecks = checks.filter((check: any) => ["Store Model", "CAPEX", "OPEX", "Missing data"].includes(check.category));

  return (
    <Shell>
      <div className="pageHeader">
        <div>
          <h1>Store Model</h1>
          <p>Операционная модель точки: вводные, P&L, Cashflow, CAPEX, OPEX, Sensitivity, Break-even и проверки по экономике.</p>
        </div>
      </div>

      <section className="band" id="overview">
        <div className="sectionHead">
          <div>
            <h2>Overview</h2>
            <span>Ключевые метрики точки на базе текущих допущений</span>
          </div>
        </div>
        <div className="metrics compactMetrics">
          <Metric title="Выручка / мес" value={rub(model.monthlyRevenue)} />
          <Metric title="Валовая прибыль" value={rub(model.grossProfit)} />
          <Metric title="EBITDA" value={`${rub(model.ebitda)} / ${percent(model.ebitdaMargin)}`} tone={model.ebitda < 0 ? "negative" : "positive"} />
          <Metric title="Cashflow" value={rub(model.operatingCashflow)} tone={model.operatingCashflow < 0 ? "negative" : "positive"} />
          <Metric title="Payback" value={model.initialInvestment > 0 && model.monthlyRevenue > 0 && model.operatingCashflow > 0 && model.paybackMonth ? `${model.paybackMonth} мес.` : "n/a"} />
          <Metric title="Break-even / день" value={model.breakEvenOrdersPerDay == null ? "n/a" : `${Math.ceil(model.breakEvenOrdersPerDay)} заказов`} />
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={forecast} margin={{ top: 12, right: 18, bottom: 6, left: 8 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
              <YAxis yAxisId="left" {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
              <YAxis yAxisId="right" orientation="right" {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
              <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
              <Bar yAxisId="left" dataKey="revenue" name="Выручка" fill={CHART_COLORS.blueSoft} radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="ebitda" name="EBITDA" stroke={CHART_COLORS.olive} strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="cashflow" name="Cashflow" stroke={CHART_COLORS.warning} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <form className="band" id="inputs" method="post" action="/api/store">
        <div className="sectionHead">
          <div>
            <h2>Inputs</h2>
            <span>Вводные точки, налоги, комиссии и доставка</span>
          </div>
        </div>
        <div className="gridForm">
          <Input name="workingDaysPerMonth" label="Рабочие дни" unit="дней / мес" value={store.workingDaysPerMonth} min={1} max={31} step={1} help="Например: 30" />
          <Input name="avgOrdersPerDay" label="Заказы" unit="заказов / день" value={store.avgOrdersPerDay} min={0} step={1} help="Среднее число заказов в день" />
          <Input name="avgItemsPerOrder" label="SKU / заказ" unit="шт" value={store.avgItemsPerOrder} min={0.1} step={0.1} help="Среднее количество позиций в одном заказе. Например: 1.4" />
          <Input name="avgCheck" label="Средний чек" unit="₽" value={store.avgCheck} min={0} step={10} help="Средний чек одного заказа" />
          <Input name="deliveryShare" label="Доля доставки" unit="%" value={store.deliveryShare} min={0} max={100} step={1} help="Доля заказов на доставку. 10 = 10%" />
          <Input name="aggregatorShare" label="Доля агрегаторов" unit="%" value={store.aggregatorShare} min={0} max={100} step={1} help="Доля доставки через агрегаторы. 50 = 50%" />
          <Input name="acquiringRate" label="Эквайринг" unit="%" value={store.acquiringRate} min={0} max={100} step={1} help="Комиссия эквайринга. 2.5 = 2.5%" />
          <Input name="aggregatorCommissionRate" label="Комиссия агрегатора" unit="%" value={store.aggregatorCommissionRate} min={0} max={100} step={1} help="Комиссия агрегатора от заказа. 25 = 25%" />
          <Input name="deliveryLogisticsCostPerOrder" label="Логистика / заказ" unit="₽ / заказ" value={store.deliveryLogisticsCostPerOrder} min={0} step={10} help="Переменная стоимость доставки на один заказ доставки" />
          <Input name="marketingCostPerItem" label="Маркетинг / SKU" unit="₽ / SKU" value={store.marketingCostPerItem} min={0} step={10} help="Переменный маркетинг на одну проданную позицию" />
          <Input name="loanPaymentsMonthly" label="Платежи по займам" unit="₽ / мес" value={store.loanPaymentsMonthly} min={0} step={1000} help="Ежемесячные платежи по займам, если есть" />
          <Input name="ownerWithdrawalsMonthly" label="Выплаты собственнику" unit="₽ / мес" value={store.ownerWithdrawalsMonthly} min={0} step={1000} help="Выплаты собственнику, если учитываются в cashflow" />
          <Input name="revenueTaxRate" label="Налог с выручки" unit="%" value={tax?.revenueTaxRate ?? ""} min={0} max={100} step={1} help="Налог с выручки. 6 = 6%" />
          <Input name="profitTaxRate" label="Налог на прибыль" unit="%" value={tax?.profitTaxRate ?? ""} min={0} max={100} step={1} help="Налог с прибыли. 20 = 20%" />
          <Input name="vatRate" label="НДС" unit="%" value={tax?.vatRate ?? ""} min={0} max={100} step={1} help="НДС. 20 = 20%. Сейчас справочное поле, не включается в tax paid автоматически" />
          <Input name="otherTaxes" label="Прочие налоги" unit="₽ / мес" value={tax?.otherTaxes ?? 0} min={0} step={1000} help="Прочие налоги и обязательные платежи в месяц" />
        </div>
        <p className="muted">НДС требует отдельной налоговой логики, сейчас используется как справочное поле или упрощенное допущение.</p>
        <p><button className="primary" type="submit">Сохранить допущения</button></p>
      </form>
      <Diagnostics diagnostics={diagnostics} />

      <section className="band" id="pnl">
        <div className="sectionHead">
          <div>
            <h2>P&L</h2>
            <span>Помесячная экономика точки в текущей конфигурации</span>
          </div>
        </div>
        <table>
          <tbody>
            <Row label="Выручка" value={rub(model.monthlyRevenue)} />
            <Row label="Себестоимость" value={rub(model.foodCostTotal)} />
            <Row label="Упаковка" value={rub(model.packagingTotal)} />
            <Row label="Валовая прибыль" value={rub(model.grossProfit)} />
            <Row label="Переменные расходы" value={rub(model.variableCosts)} />
            <Row label="Постоянные расходы" value={rub(model.fixedCosts)} />
            <Row label="Налог с выручки" value={rub(model.revenueTax)} />
            <Row label="Налог на прибыль" value={rub(model.profitTax)} />
            <Row label="НДС справочно, не включен в уплаченные налоги" value={rub(model.vatReference)} />
            <Row label="EBITDA" value={`${rub(model.ebitda)} / ${percent(model.ebitdaMargin)}`} tone={model.ebitda < 0 ? "negative" : "positive"} />
            <Row label="Уплаченные налоги" value={rub(model.taxPaid)} />
            <Row label="Операционный cashflow" value={rub(model.operatingCashflow)} tone={model.operatingCashflow < 0 ? "negative" : "positive"} />
            <Row label="Break-even выручка" value={model.breakEvenRevenue == null ? "n/a" : rub(model.breakEvenRevenue)} />
            <Row label="Payback" value={model.initialInvestment > 0 && model.monthlyRevenue > 0 && model.operatingCashflow > 0 && model.paybackMonth ? `${model.paybackMonth} мес.` : "n/a"} />
          </tbody>
        </table>
      </section>

      <section className="band" id="cashflow">
        <div className="sectionHead">
          <div>
            <h2>Cashflow</h2>
            <span>24 месяца накопленного cashflow после инвестиций на открытие</span>
          </div>
        </div>
        <div className="tableScroll">
          <table className="cashflowTable">
            <thead><tr><th>Месяц</th><th>Операционный cashflow</th><th>Накопленный cashflow</th></tr></thead>
            <tbody>
              {cashflowRows.map((row: any) => (
                <tr key={row.month}>
                  <td>Месяц {row.month}</td>
                  <td className={row.netCashflow < 0 ? "negative" : "positive"}>{rub(row.netCashflow)}</td>
                  <td className={row.cumulativeCashflow < 0 ? "negative" : "positive"}>{rub(row.cumulativeCashflow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CapexSection rows={capexRows} />
      <OpexSection rows={opexRows} />
      <SensitivitySection rows={sensitivity} />

      <section className="band" id="break-even">
        <div className="sectionHead">
          <div>
            <h2>Break-even</h2>
            <span>Сколько заказов в день нужно для выхода в ноль</span>
          </div>
        </div>
        <div className="twoCol">
          <div className="breakdown">
            <BreakdownItem label="Break-even выручка" value={model.breakEvenRevenue == null ? "n/a" : rub(model.breakEvenRevenue)} />
            <BreakdownItem label="Break-even заказов / мес" value={model.breakEvenOrders == null ? "n/a" : `${num(model.breakEvenOrders, 0)} заказов`} />
            <BreakdownItem label="Break-even заказов / день" value={model.breakEvenOrdersPerDay == null ? "n/a" : `${Math.ceil(model.breakEvenOrdersPerDay)} заказов`} />
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={buildBreakEvenRows(model)} margin={{ top: 12, right: 18, bottom: 6, left: 8 }}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="ordersPerDay" {...chartAxisProps} />
                <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
                <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
                <ReferenceLine y={0} stroke={CHART_COLORS.red} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={CHART_COLORS.blueSoft} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="band" id="checks">
        <div className="sectionHead">
          <div>
            <h2>Checks по точке</h2>
            <span>Риски Store Model, CAPEX, OPEX и незаполненных данных</span>
          </div>
        </div>
        <div className="checks">
          {storeChecks.map((check: any) => <div className={`check ${check.severity}`} key={`${check.code}-${check.message}`}>{check.message}</div>)}
          {!storeChecks.length && <div className="check info">Критичных проверок по точке сейчас нет.</div>}
        </div>
      </section>
    </Shell>
  );
}

function Input({
  label,
  name,
  unit,
  value,
  help,
  min,
  max,
  step = 1
}: {
  label: string;
  name: string;
  unit: string;
  value: string | number;
  help: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label>
      <span>{label}, {unit}</span>
      <input name={name} defaultValue={value} inputMode="decimal" type="number" min={min} max={max} step={step} placeholder={help} />
      <small>{help}</small>
    </label>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return <tr><td>{label}</td><td><strong className={tone ? `value ${tone}` : ""}>{value}</strong></td></tr>;
}

function BreakdownItem({ label, value }: { label: string; value: string }) {
  return <div className="breakdownRow"><span>{label}</span><strong>{value}</strong></div>;
}

function Metric({ title, value, tone }: { title: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: any[] }) {
  return (
    <section className="band warningPanel">
      <h2>Почему EBITDA / Cashflow отрицательные</h2>
      {diagnostics.length ? diagnostics.map((item) => <div className={`check ${item.severity}`} key={item.message}>{item.message}</div>) : <p>Явных причин отрицательных значений сейчас нет. Если модель пустая, заполните Store Model, рецептуры, упаковку, OPEX и CAPEX.</p>}
    </section>
  );
}

function buildBreakEvenRows(model: any) {
  return Array.from({ length: 9 }, (_, index) => {
    const base = model.breakEvenOrdersPerDay ?? 50;
    const ordersPerDay = Math.max(0, Math.round(base * (0.4 + index * 0.15)));
    const revenue = ordersPerDay * (model.monthlyRevenue / Math.max(model.monthlyOrders, 1)) * 30;
    const scale = model.monthlyRevenue > 0 ? revenue / model.monthlyRevenue : 0;
    return { ordersPerDay, ebitda: model.ebitda * scale + model.fixedCosts * (scale - 1) };
  });
}

function compactRub(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 0)}k`;
  return num(value, 0);
}
