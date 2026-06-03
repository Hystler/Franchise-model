import { AlertTriangle, Copy, Download, Save } from "lucide-react";
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
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Shell } from "@/pages/index";
import { CHART_COLORS, CHART_SERIES, chartAxisProps, chartGridProps, chartTooltipProps } from "@/lib/charts";
import { loadModel } from "@/lib/model";
import { num, percent, rub } from "@/lib/format";

export async function getServerSideProps() {
  const data = await loadModel();
  return {
    props: {
      franchise: data.franchise,
      franchiseModel: data.franchiseModel
    }
  };
}

export default function FranchisePage({ franchise, franchiseModel }: any) {
  const franchisee = franchiseModel.franchisee;
  const franchisor = franchiseModel.franchisor;
  const forecast = franchisee.monthlyForecast ?? [];
  const cashflow24 = franchisee.cumulativeCashflow24 ?? [];
  const paybackPoint = franchisee.paybackMonth24 == null
    ? null
    : cashflow24.find((row: any) => row.month === franchisee.paybackMonth24);
  const chartHeight = 320;
  const sensitivityHeight = Math.max(320, franchiseModel.sensitivity.length * 42);
  const statusLabel = franchiseModel.status === "good" ? "good" : franchiseModel.status === "critical" ? "critical" : "warning";
  const marginRows = franchisee.marginRows.map((row: any) => ({ ...row, name: financeLabel(row.name) }));
  const revenueStructure = franchisor.revenueStructure.map((row: any) => ({ ...row, name: financeLabel(row.name) }));
  const sensitivityRows = franchiseModel.sensitivity.map((row: any) => ({ ...row, factor: financeLabel(row.factor) }));
  const hasRevenueForecast = forecast.some((row: any) => row.revenue > 0);
  const hasPaybackData = cashflow24.some((row: any) => row.openingInvestment > 0 || row.cumulativeCashflow !== 0);

  return (
    <Shell>
      <div className="pageHeader franchiseHeader">
        <div>
          <h1>Franchise: экономика франчайзи и сети</h1>
          <p>Franchise считает новую точку франчайзи. Данные Store Model не используются автоматически, кроме случаев, когда вы вручную нажали «Скопировать вводные из Store Model».</p>
          <div className="badgeRow">
            <span className={`status ${statusLabel}`}>{statusText(statusLabel)}</span>
            {franchise.franchiseInputsCopiedFromStore && <span className="pill warningPill">Вводные скопированы из Store Model</span>}
            {franchiseModel.missingDataWarning && <span className="pill warningPill">{franchiseModel.missingDataWarning}</span>}
          </div>
        </div>
        <div className="actions">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button primary" href="/api/export/full"><Download size={16} /> XLSX</a>
        </div>
      </div>

      <div className="metrics franchiseMetrics">
        <Metric title="Инвестиции на открытие" value={rub(franchisee.openingInvestment)} />
        <Metric title="Выручка M1" value={rub(franchisee.revenueMonth1)} />
        <Metric title="Выручка M12" value={rub(franchisee.revenueMonth12)} />
        <Metric title="EBITDA после платежей M12" value={rub(franchisee.ebitdaAfterFeesMonth12)} tone={franchisee.ebitdaAfterFeesMonth12 < 0 ? "negative" : "positive"} />
        <Metric title="Маржа EBITDA M12" value={percent(franchisee.ebitdaMarginAfterFeesMonth12)} tone={franchisee.ebitdaMarginAfterFeesMonth12 < 0.1 ? "negative" : "positive"} />
        <Metric title="Операционный cashflow M12" value={rub(franchisee.netCashflowMonth12)} tone={franchisee.netCashflowMonth12 < 0 ? "negative" : "positive"} />
        <Metric title="Payback" value={franchisee.openingInvestment > 0 && franchisee.netCashflowMonth12 > 0 && franchisee.paybackMonth != null ? `${franchisee.paybackMonth} мес.` : "n/a"} />
        <Metric title="Годовой ROI" value={franchisee.openingInvestment > 0 && franchisee.annualROI != null ? percent(franchisee.annualROI) : "n/a"} tone={franchisee.annualROI != null && franchisee.annualROI < 0.3 ? "negative" : "positive"} />
      </div>

      <nav className="segmented wrap sectionNav" aria-label="Разделы Franchise">
        <a href="#inputs">Вводные</a>
        <a href="#charts">Графики</a>
        <a href="#pnl">P&L</a>
        <a href="#cashflow">24M Cashflow</a>
        <a href="#franchisor">Франчайзер</a>
        <a href="#scenarios">Сценарии</a>
        <a href="#checks">Аудит</a>
      </nav>

      <section className="band" id="inputs">
        <div className="sectionHead">
          <h2>Вводные</h2>
          <span>Проценты вводятся как 6 = 6%, шаг стрелок равен 1</span>
        </div>
        <form className="franchiseInputStack" method="post" action="/api/franchise">
          <InputSection title="Платежи франшизы">
            <MoneyInput name="lumpSumFee" label="Паушальный взнос, ₽" value={franchise.lumpSumFee} step={10000} />
            <label>Тип роялти
              <select name="royaltyType" defaultValue={franchise.royaltyType}>
                <option value="percent_of_revenue">Процент от выручки</option>
                <option value="fixed_monthly">Фиксированный / мес</option>
                <option value="hybrid">Гибрид</option>
              </select>
            </label>
            <PercentInput name="royaltyRate" label="Ставка роялти, %" value={franchise.royaltyRate} />
            <MoneyInput name="fixedMonthlyRoyalty" label="Фиксированный роялти, ₽ / мес" value={franchise.fixedMonthlyRoyalty} step={1000} />
            <PercentInput name="marketingFeeRate" label="Маркетинговый сбор, %" value={franchise.marketingFeeRate} />
            <PercentInput name="supplyChainMarkup" label="Наценка цепочки поставок, %" value={franchise.supplyChainMarkup} />
            <MoneyInput name="monthlyFixedFees" label="Прочие ежемесячные платежи, ₽ / мес" value={franchise.monthlyFixedFees} step={1000} />
            <MoneyInput name="monthlySupportCostPerFranchisee" label="Поддержка / франчайзи, ₽ / мес" value={franchise.monthlySupportCostPerFranchisee} step={1000} />
            <MoneyInput name="franchisorFixedTeamCosts" label="Команда франчайзера, ₽ / мес" value={franchise.franchisorFixedTeamCosts} step={1000} />
            <NumberInput name="numberOfFranchisees" label="Количество франчайзи" value={franchise.numberOfFranchisees} min={1} step={1} />
          </InputSection>

          <InputSection title="Store Model франчайзи">
            <NumberInput name="franchiseWorkingDaysPerMonth" label="Рабочие дни / мес" value={franchise.franchiseWorkingDaysPerMonth} min={0} max={31} step={1} />
            <NumberInput name="franchiseAvgOrdersPerDay" label="Заказы / день" value={franchise.franchiseAvgOrdersPerDay} min={0} step={1} />
            <NumberInput name="franchiseAvgItemsPerOrder" label="SKU / заказ" value={franchise.franchiseAvgItemsPerOrder} min={0} step={0.1} />
            <MoneyInput name="franchiseAvgCheck" label="Средний чек, ₽" value={franchise.franchiseAvgCheck} step={10} />
            <PercentInput name="franchiseDeliverySharePercent" label="Доля доставки, %" value={franchise.franchiseDeliverySharePercent} />
            <PercentInput name="franchiseAggregatorSharePercent" label="Доля агрегаторов, %" value={franchise.franchiseAggregatorSharePercent} />
            <PercentInput name="franchiseAcquiringRatePercent" label="Эквайринг, %" value={franchise.franchiseAcquiringRatePercent} />
            <PercentInput name="franchiseAggregatorCommissionPercent" label="Комиссия агрегатора, %" value={franchise.franchiseAggregatorCommissionPercent} />
            <MoneyInput name="franchiseLogisticsPerOrder" label="Логистика / заказ, ₽" value={franchise.franchiseLogisticsPerOrder} step={10} />
            <MoneyInput name="franchiseMarketingPerSku" label="Маркетинг / SKU, ₽" value={franchise.franchiseMarketingPerSku} step={10} />
            <PercentInput name="franchiseRevenueTaxRatePercent" label="Налог с выручки, %" value={franchise.franchiseRevenueTaxRatePercent} />
            <PercentInput name="franchiseProfitTaxRatePercent" label="Налог на прибыль, %" value={franchise.franchiseProfitTaxRatePercent} />
            <PercentInput name="franchiseVatRatePercent" label="НДС, %" value={franchise.franchiseVatRatePercent} />
            <MoneyInput name="franchiseOtherTaxesPerMonth" label="Прочие налоги, ₽ / мес" value={franchise.franchiseOtherTaxesPerMonth} step={1000} />
            <MoneyInput name="franchiseLoanPaymentsPerMonth" label="Платежи по займам, ₽ / мес" value={franchise.franchiseLoanPaymentsPerMonth} step={1000} />
            <MoneyInput name="franchiseOwnerWithdrawalsPerMonth" label="Выплаты собственнику, ₽ / мес" value={franchise.franchiseOwnerWithdrawalsPerMonth} step={1000} />
          </InputSection>

          <InputSection title="OPEX франчайзи">
            <MoneyInput name="franchiseRent" label="Аренда, ₽ / мес" value={franchise.franchiseRent} step={1000} />
            <MoneyInput name="franchisePayroll" label="ФОТ, ₽ / мес" value={franchise.franchisePayroll} step={1000} />
            <MoneyInput name="franchiseUtilities" label="Коммунальные, ₽ / мес" value={franchise.franchiseUtilities} step={1000} />
            <MoneyInput name="franchiseSoftware" label="Софт и POS, ₽ / мес" value={franchise.franchiseSoftware} step={1000} />
            <MoneyInput name="franchiseAccounting" label="Бухгалтерия, ₽ / мес" value={franchise.franchiseAccounting} step={1000} />
            <MoneyInput name="franchiseRepairs" label="Ремонт и обслуживание, ₽ / мес" value={franchise.franchiseRepairs} step={1000} />
            <MoneyInput name="franchiseOtherFixedOpex" label="Прочий OPEX, ₽ / мес" value={franchise.franchiseOtherFixedOpex} step={1000} />
          </InputSection>

          <InputSection title="Дополнения к инвестициям на открытие">
            <MoneyInput name="trainingFee" label="Обучение, ₽" value={franchise.trainingFee} step={10000} />
            <MoneyInput name="openingSupportFee" label="Поддержка открытия, ₽" value={franchise.openingSupportFee} step={10000} />
            <MoneyInput name="openingInventory" label="Стартовый склад, ₽" value={franchise.openingInventory} step={10000} />
            <MoneyInput name="launchMarketing" label="Запуск маркетинга, ₽" value={franchise.launchMarketing} step={10000} />
            <MoneyInput name="rentDeposit" label="Депозит аренды, ₽" value={franchise.rentDeposit} step={10000} />
            <MoneyInput name="contingencyAmount" label="Резерв, ₽" value={franchise.contingencyAmount} step={10000} />
            <PercentInput name="contingencyPercent" label="Резерв, %" value={franchise.contingencyPercent} />
            <MoneyInput name="loanAmount" label="Сумма займа, ₽" value={franchise.loanAmount} step={10000} />
          </InputSection>

          <InputSection title="Тренд выручки">
            <NumberInput name="forecastMonths" label="Месяцы прогноза" value={franchise.forecastMonths} min={1} max={60} step={1} />
            <label>Тип тренда выручки
              <select name="revenueTrendType" defaultValue={franchise.revenueTrendType}>
                <option value="flat">Ровный</option>
                <option value="growth">Рост</option>
                <option value="decline">Снижение</option>
                <option value="ramp_up">Разгон</option>
                <option value="custom">Кастомный</option>
              </select>
            </label>
            <PercentInput name="monthlyGrowthRatePercent" label="Рост / мес, %" value={franchise.monthlyGrowthRatePercent} />
            <PercentInput name="monthlyDeclineRatePercent" label="Снижение / мес, %" value={franchise.monthlyDeclineRatePercent} />
            <NumberInput name="rampUpMonths" label="Разгон, мес" value={franchise.rampUpMonths} min={1} max={60} step={1} />
            <PercentInput name="rampUpStartPercent" label="Старт разгона, %" value={franchise.rampUpStartPercent} />
            <label className="checkLine"><input type="checkbox" name="seasonalityEnabled" defaultChecked={franchise.seasonalityEnabled} /> Учитывать сезонность</label>
          </InputSection>

          <div className="rowActions wideActions">
            <button className="primary" type="submit" name="action" value="save"><Save size={16} /> Сохранить</button>
            <button type="submit" name="action" value="copy_store"><Copy size={16} /> Скопировать вводные из Store Model</button>
          </div>
        </form>
      </section>

      <section className="band" id="charts">
        <div className="sectionHead">
          <h2>Графики</h2>
          <span>Тренд выручки, EBITDA, cashflow, Payback, маржи и выручка франчайзера</span>
        </div>
        <div className="twoCol">
          <ChartCard title="Тренд выручки">
            {hasRevenueForecast ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={forecast} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Выручка" stroke={CHART_COLORS.blueSoft} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blueSoft }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Заполните Store Model франчайзи, чтобы увидеть тренд выручки." />}
          </ChartCard>

          <ChartCard title="Выручка / EBITDA / операционный cashflow">
            {hasRevenueForecast ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={forecast} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Выручка" fill={CHART_COLORS.blueSoft} radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="ebitdaAfterFees" name="EBITDA после платежей" stroke={CHART_COLORS.olive} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="netOperatingCashflow" name="Операционный cashflow" stroke={CHART_COLORS.warning} strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Нет данных для графика EBITDA и cashflow." />}
          </ChartCard>
        </div>

        <div className="twoCol">
          <ChartCard title="Накопленный cashflow / Payback">
            {hasPaybackData ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={cashflow24} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={82} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} labelFormatter={(label) => `Месяц ${label}`} />
                  <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeDasharray="4 4" />
                  {paybackPoint && <ReferenceDot x={paybackPoint.month} y={paybackPoint.cumulativeCashflow} r={6} fill={CHART_COLORS.blueSoft} stroke={CHART_COLORS.surface} />}
                  <Line type="monotone" dataKey="cumulativeCashflow" name="Накопленный cashflow" stroke={CHART_COLORS.blueSoft} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Заполните инвестиции на открытие и допущения cashflow." />}
          </ChartCard>

          <ChartCard title="Маржинальность">
            {hasRevenueForecast ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={marginRows} margin={{ top: 16, right: 24, bottom: 38, left: 12 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="name" {...chartAxisProps} interval={0} angle={-18} textAnchor="end" height={64} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => percent(Number(value))} width={78} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => percent(value)} />
                  <ReferenceLine y={0} stroke={CHART_COLORS.grid} />
                  <Bar dataKey="value" name="Маржа" radius={[8, 8, 0, 0]}>
                    {marginRows.map((row: any, index: number) => <Cell key={index} fill={row.value < 0 ? CHART_COLORS.red : CHART_SERIES[index % CHART_SERIES.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState text="График маржинальности появится после расчета выручки." />}
          </ChartCard>
        </div>

        <div className="twoCol">
          <ChartCard title="Структура выручки франчайзера">
            {revenueStructure.length ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart>
                  <Pie data={revenueStructure} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105}>
                    {revenueStructure.map((_: any, index: number) => <Cell key={index} fill={CHART_SERIES[index % CHART_SERIES.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Заполните роялти, маркетинговый сбор или ежемесячные платежи." />}
          </ChartCard>

          <ChartCard title="Sensitivity франшизы">
            {sensitivityRows.length ? (
              <ResponsiveContainer width="100%" height={sensitivityHeight}>
                <BarChart data={sensitivityRows} layout="vertical" margin={{ top: 16, right: 24, bottom: 8, left: 28 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis type="number" {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} />
                  <YAxis type="category" dataKey="factor" width={120} {...chartAxisProps} />
                  <Tooltip {...chartTooltipProps} formatter={(value: number) => rub(value)} />
                  <ReferenceLine x={0} stroke={CHART_COLORS.grid} />
                  <Bar dataKey="ebitdaImpact" name="Влияние на EBITDA" radius={[0, 8, 8, 0]}>
                    {sensitivityRows.map((row: any, index: number) => <Cell key={index} fill={row.ebitdaImpact < 0 ? CHART_COLORS.red : CHART_COLORS.olive} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Sensitivity появится после заполнения модели." />}
          </ChartCard>
        </div>
      </section>

      <section className="band" id="pnl">
        <div className="sectionHead">
          <h2>P&L франчайзи: месяц 1 / месяц 12</h2>
          <span>Месяц 12 используется в верхних KPI и сценариях</span>
        </div>
        <div className="tableScroll financeTableWrap">
          <table className="financeTable">
            <thead>
              <tr>
                <th>P&L франчайзи</th>
                <th>Месяц 1</th>
                <th>Месяц 12</th>
                <th>% выручки M12</th>
              </tr>
            </thead>
            <tbody>
              {franchisee.pnlRowsMonth12.map((row: any, index: number) => {
                const month1 = franchisee.pnlRowsMonth1[index];
                return (
                  <tr key={row.key} className={`${row.kind === "total" ? "totalRow" : ""} ${row.kind === "subtotal" ? "subtotalRow" : ""} ${row.kind === "margin" ? "marginRow" : ""}`}>
                    <td>{financeLabel(row.label)}</td>
                    <td className={valueTone(month1?.value)}>{row.kind === "margin" ? percent(month1?.value ?? 0) : rub(month1?.value ?? 0)}</td>
                    <td className={valueTone(row.value)}>{row.kind === "margin" ? percent(row.value) : rub(row.value)}</td>
                    <td className={row.margin != null ? valueTone(row.margin) : ""}>{row.margin == null ? "-" : percent(row.margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band" id="cashflow">
        <div className="sectionHead">
          <h2>24M Cashflow</h2>
          <span>Месяц 0 включает инвестиции на открытие, дальше каждый месяц считается отдельно</span>
        </div>
        <div className="tableScroll cashflowTableWrap">
          <table className="cashflowTable">
            <thead>
              <tr>
                <th>Месяц</th>
                <th>Выручка</th>
                <th>Заказы</th>
                <th>Себестоимость</th>
                <th>Переменные</th>
                <th>Постоянные</th>
                <th>EBITDA после платежей</th>
                <th>Налоги</th>
                <th>Операционный cashflow</th>
                <th>Накоплено</th>
              </tr>
            </thead>
            <tbody>
              {cashflow24.map((row: any) => (
                <tr key={row.month} className={row.month === 0 ? "totalRow" : ""}>
                  <td>{cashflowLabel(row.label)}</td>
                  <td>{rub(row.revenue)}</td>
                  <td>{num(row.orders, 0)}</td>
                  <td>{rub(row.foodCost + row.packagingCost)}</td>
                  <td>{rub(row.variableCosts)}</td>
                  <td>{rub(row.fixedCosts)}</td>
                  <td className={valueTone(row.ebitdaAfterFees)}>{rub(row.ebitdaAfterFees)}</td>
                  <td>{rub(-row.taxes)}</td>
                  <td className={valueTone(row.netOperatingCashflow)}>{rub(row.netOperatingCashflow)}</td>
                  <td className={valueTone(row.cumulativeCashflow)}>{rub(row.cumulativeCashflow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band" id="franchisor">
        <div className="sectionHead">
          <h2>Экономика франчайзера</h2>
          <span>{franchise.numberOfFranchisees} франчайзи в сетевом режиме</span>
        </div>
        <div className="metrics compactMetrics">
          <Metric title="Выручка / франчайзи / мес" value={rub(franchisor.monthlyRevenue)} />
          <Metric title="Разовая выручка" value={rub(franchisor.oneTimeRevenue)} />
          <Metric title="Распределённая команда" value={rub(franchisor.allocatedFixedTeamCosts)} />
          <Metric title="EBITDA франчайзера / франчайзи" value={rub(franchisor.ebitda)} tone={franchisor.ebitda < 0 ? "negative" : "positive"} />
          <Metric title="Общая EBITDA / мес" value={rub(franchisor.totalMonthlyEBITDA)} tone={franchisor.totalMonthlyEBITDA < 0 ? "negative" : "positive"} />
          <Metric title="Маржа EBITDA" value={percent(franchisor.ebitdaMargin)} />
        </div>
        <div className="tableScroll">
          <table>
            <tbody>
              <SimpleRow label="Роялти" value={rub(franchisor.royalty)} />
              <SimpleRow label="Маркетинговый сбор" value={rub(franchisor.marketingFee)} />
              <SimpleRow label="Выручка от наценки цепочки поставок" value={rub(franchisor.supplyChainMarkupRevenue)} />
              <SimpleRow label="Ежемесячные фиксированные платежи" value={rub(franchisor.monthlyFixedFees)} />
              <SimpleRow label="Поддержка / франчайзи" value={rub(-franchisor.supportCostPerFranchisee)} />
              <SimpleRow label="Распределённые расходы команды" value={rub(-franchisor.allocatedFixedTeamCosts)} />
              <SimpleRow label="EBITDA франчайзера" value={rub(franchisor.ebitda)} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="band" id="scenarios">
        <div className="sectionHead">
          <h2>Сценарии</h2>
          <span>Нижний, базовый и верхний сценарии используют независимые вводные Franchise</span>
        </div>
        <div className="tableScroll">
          <table className="financeTable">
            <thead>
              <tr>
                <th>Метрика</th>
                <th>Нижний</th>
                <th>База</th>
                <th>Верхний</th>
              </tr>
            </thead>
            <tbody>
              {franchiseModel.scenarios.rows.map((row: any) => (
                <tr key={row.metric}>
                  <td>{financeLabel(row.metric)}</td>
                  <td className={valueTone(row.Downside)}>{formatScenarioValue(row.Downside, row.format)}</td>
                  <td className={valueTone(row.Base)}>{formatScenarioValue(row.Base, row.format)}</td>
                  <td className={valueTone(row.Upside)}>{formatScenarioValue(row.Upside, row.format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band" id="checks">
        <div className="sectionHead">
          <h2>Аудит</h2>
          <span>Что ломает экономику франчайзи</span>
        </div>
        {franchiseModel.missingDataWarnings.length > 0 && (
          <div className="checks warningBlock">
            <div className="check warning">{franchiseModel.missingDataWarning}</div>
            {franchiseModel.missingDataWarnings.map((message: string) => <div className="check warning" key={message}>{message}</div>)}
          </div>
        )}
        <div className="twoCol">
          <div className="checks">
            <h3>Топ-причины</h3>
            {franchiseModel.breakers.length ? franchiseModel.breakers.map((item: string) => (
              <div className="check warning" key={item}><AlertTriangle size={16} /> {item}</div>
            )) : <div className="check info">Явных слабых мест в модели Franchise сейчас нет.</div>}
          </div>
          <div className="checks">
            <h3>Аудит Franchise</h3>
            {franchiseModel.checks.length ? franchiseModel.checks.map((check: any) => (
              <div className={`check ${check.severity}`} key={`${check.code}-${check.message}`}>
                <AlertTriangle size={16} /> {check.message}
              </div>
            )) : <div className="check info">Критичных проверок Franchise нет.</div>}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function InputSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="inputGroup">
      <h3>{title}</h3>
      <div className="gridForm">{children}</div>
    </div>
  );
}

function NumberInput({
  label,
  name,
  value,
  min,
  max,
  step
}: {
  label: string;
  name: string;
  value: string | number;
  min?: number;
  max?: number;
  step: number;
}) {
  return (
    <label>{label}
      <input name={name} defaultValue={value} inputMode="decimal" type="number" min={min} max={max} step={step} />
    </label>
  );
}

function PercentInput({ label, name, value }: { label: string; name: string; value: string | number }) {
  return <NumberInput label={label} name={name} value={value} min={0} max={100} step={1} />;
}

function MoneyInput({ label, name, value, step }: { label: string; name: string; value: string | number; step: number }) {
  return <NumberInput label={label} name={name} value={value} min={0} step={step} />;
}

function Metric({ title, value, tone }: { title: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function SimpleRow({ label, value }: { label: string; value: string }) {
  return <tr><td>{label}</td><td><strong>{value}</strong></td></tr>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="chartPanel">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="emptyState">{text}</div>;
}

function valueTone(value: number | null | undefined) {
  if (value == null) return "";
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "";
}

function formatScenarioValue(value: number | null, format: string) {
  if (value == null) return "n/a";
  if (format === "money") return rub(value);
  if (format === "percent") return percent(value);
  if (format === "month") return `${num(value, 0)} мес.`;
  return num(value, 1);
}

function statusText(status: string) {
  if (status === "good") return "готово";
  if (status === "critical") return "критично";
  return "внимание";
}

function cashflowLabel(label: string) {
  const match = label.match(/Month (\d+)/);
  return match ? `Месяц ${match[1]}` : label;
}

function financeLabel(label: string) {
  const labels: Record<string, string> = {
    revenue: "Выручка",
    "orders/day": "Заказы / день",
    "avg check": "Средний чек",
    "food cost": "Себестоимость",
    rent: "Аренда",
    royalty: "Роялти",
    Revenue: "Выручка",
    "Food cost": "Себестоимость",
    Packaging: "Упаковка",
    "Gross profit": "Валовая прибыль",
    "Gross margin": "Валовая маржа",
    "Gross margin, %": "Валовая маржа, %",
    "Contribution profit": "Маржинальная прибыль",
    "Contribution margin": "Маржа вклада",
    "Contribution margin, %": "Маржа вклада, %",
    "Variable costs": "Переменные расходы",
    "Fixed costs": "Постоянные расходы",
    "Franchise OPEX": "OPEX Franchise",
    "EBITDA before fees": "EBITDA до платежей",
    "EBITDA before franchise fees": "EBITDA до платежей франшизы",
    "EBITDA margin before fees, %": "Маржа EBITDA до платежей, %",
    "EBITDA after fees": "EBITDA после платежей",
    "EBITDA after franchise fees": "EBITDA после платежей франшизы",
    "EBITDA margin after fees": "Маржа EBITDA после платежей",
    "EBITDA margin after fees, %": "Маржа EBITDA после платежей, %",
    Taxes: "Налоги",
    "Net cashflow": "Операционный cashflow",
    "Net operating cashflow": "Операционный cashflow",
    "Net cashflow margin, %": "Маржа cashflow, %",
    Royalty: "Роялти",
    "Marketing fee": "Маркетинговый сбор",
    "Supply-chain markup": "Наценка цепочки поставок",
    "Monthly fixed fees": "Ежемесячные фиксированные платежи",
    "Lump sum": "Паушальный взнос",
    Training: "Обучение",
    "Opening support": "Поддержка открытия",
    "Loan payments": "Платежи по займам",
    "Owner withdrawals": "Выплаты собственнику",
    "Payback month": "Payback, мес",
    "Break-even orders/day": "Break-even заказов / день"
  };
  return labels[label] ?? label;
}

function compactRub(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 0)}k`;
  return num(value, 0);
}
