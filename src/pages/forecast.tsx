import { useMemo, useState } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { buildForecast, type ForecastInputs } from "@/calculations/forecast";
import { Shell } from "@/components/shell";
import { CHART_COLORS, chartAxisProps, chartGridProps, chartTooltipProps } from "@/lib/charts";
import { num, rub } from "@/lib/format";

const defaults: ForecastInputs = {
  months: 12,
  startOrdersPerDay: 125,
  avgCheck: 520,
  workingDays: 30,
  ordersGrowth: 2,
  checkGrowth: 0.8,
  seasonality: true
};

export default function ForecastPage() {
  const [inputs, setInputs] = useState(defaults);
  const rows = useMemo(() => buildForecast(inputs), [inputs]);
  const baseRevenue = rows[0]?.revenue ?? 0;

  return (
    <Shell>
      <div className="pageHeader">
        <div>
          <h1>Прогноз</h1>
          <p>План продаж для точки: заказы, средний чек, сезонность и прогноз выручки. На следующем этапе этот сценарий можно подключить к Store Model и Franchise.</p>
        </div>
      </div>

      <section className="band">
        <div className="sectionHead">
          <div>
            <h2>План продаж</h2>
            <span>Горизонт, заказы, средний чек и темпы роста</span>
          </div>
        </div>
        <div className="gridForm">
          <ForecastInput label="Горизонт прогноза" unit="мес" value={inputs.months} min={1} max={36} step={1} onChange={(value) => setInputs({ ...inputs, months: Math.round(value) })} />
          <ForecastInput label="Стартовые заказы" unit="в день" value={inputs.startOrdersPerDay} min={0} step={1} onChange={(value) => setInputs({ ...inputs, startOrdersPerDay: value })} />
          <ForecastInput label="Средний чек" unit="₽" value={inputs.avgCheck} min={0} step={10} onChange={(value) => setInputs({ ...inputs, avgCheck: value })} />
          <ForecastInput label="Рабочие дни" unit="дней / мес" value={inputs.workingDays} min={1} max={31} step={1} onChange={(value) => setInputs({ ...inputs, workingDays: Math.round(value) })} />
          <ForecastInput label="Рост заказов" unit="% / мес" value={inputs.ordersGrowth} min={0} max={100} step={0.1} onChange={(value) => setInputs({ ...inputs, ordersGrowth: value })} />
          <ForecastInput label="Рост среднего чека" unit="% / мес" value={inputs.checkGrowth} min={0} max={100} step={0.1} onChange={(value) => setInputs({ ...inputs, checkGrowth: value })} />
          <label className="checkLine"><input type="checkbox" checked={inputs.seasonality} onChange={(event) => setInputs({ ...inputs, seasonality: event.target.checked })} /> Учитывать сезонность</label>
          <div className="rowActions wideActions">
            <button type="button" className="primary" disabled title="Интеграция с Store Model будет добавлена следующим этапом">Использовать как план продаж</button>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <div>
            <h2>График прогноза</h2>
            <span>Выручка, заказы и средний чек по месяцам</span>
          </div>
          <LineChartIcon size={18} />
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rows} margin={{ top: 12, right: 20, bottom: 6, left: 8 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="month" {...chartAxisProps} tickFormatter={(value) => `M${value}`} />
              <YAxis yAxisId="revenue" {...chartAxisProps} tickFormatter={(value) => compactRub(Number(value))} width={78} />
              <YAxis yAxisId="volume" orientation="right" {...chartAxisProps} width={72} />
              <Tooltip {...chartTooltipProps} formatter={(value: number, name: string) => name === "Выручка" ? rub(value) : num(value, 0)} labelFormatter={(label) => `Месяц ${label}`} />
              <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Выручка" stroke={CHART_COLORS.blueSoft} strokeWidth={2.5} dot={false} />
              <Line yAxisId="volume" type="monotone" dataKey="ordersPerDay" name="Заказы / день" stroke={CHART_COLORS.olive} strokeWidth={2.5} dot={false} />
              <Line yAxisId="volume" type="monotone" dataKey="avgCheck" name="Средний чек" stroke={CHART_COLORS.warning} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="band">
        <div className="sectionHead">
          <div>
            <h2>Таблица прогноза</h2>
            <span>План продаж можно использовать как основу для Store Model и Franchise.</span>
          </div>
        </div>
        <div className="tableScroll">
          <table className="forecastTable">
            <thead><tr><th>Месяц</th><th>Заказы / день</th><th>Средний чек</th><th>Выручка / мес</th><th>Изменение к базе</th><th>Комментарий</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td>Месяц {row.month}</td>
                  <td>{num(row.ordersPerDay, 0)}</td>
                  <td>{rub(row.avgCheck)}</td>
                  <td>{rub(row.revenue)}</td>
                  <td className={row.revenue >= baseRevenue ? "positive" : "negative"}>{baseRevenue > 0 ? `${num((row.revenue / baseRevenue - 1) * 100, 1)}%` : "n/a"}</td>
                  <td>{row.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function ForecastInput({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>{label}, {unit}
      <input type="number" value={value} min={min} max={max} step={step ?? 1} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function compactRub(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 0)}k`;
  return num(value, 0);
}
