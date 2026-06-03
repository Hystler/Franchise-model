import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { rub } from "@/lib/format";

type RowMap = Record<string, any>;

export function CapexSection({ rows: initialRows }: { rows: RowMap[] }) {
  const [rows, setRows] = useState<RowMap[]>(initialRows);
  const totals = useMemo(() => {
    const initialInvestment = rows.filter((row) => row.paidBeforeOpening !== false).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const monthlyDepreciation = rows.reduce((sum, row) => {
      const life = Number(row.usefulLifeMonths || 0);
      return life > 0 ? sum + Number(row.amount || 0) / life : sum;
    }, 0);
    return { initialInvestment, monthlyDepreciation };
  }, [rows]);

  async function remove(id: string) {
    if (!confirm("Удалить статью CAPEX?")) return;
    const res = await fetch(`/api/capex/${id}`, { method: "DELETE" });
    if (res.ok) setRows((current) => current.filter((row) => row.id !== id));
  }

  async function update(id: string, rowElement: HTMLTableRowElement | null) {
    if (!rowElement) return;
    const payload = collectRowPayload(rowElement);
    const res = await fetch(`/api/capex/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const body = await res.json();
      setRows((current) => current.map((row) => (row.id === id ? body.item : row)));
    }
  }

  return (
    <section className="band" id="capex">
      <div className="sectionHead">
        <div>
          <h2>CAPEX</h2>
          <span>Инвестиции на открытие и сроки амортизации</span>
        </div>
        <strong className="sectionKpi">{rub(totals.initialInvestment)} · амортизация {rub(totals.monthlyDepreciation)} / мес</strong>
      </div>
      <form className="gridForm compactForm" method="post" action="/api/capex">
        <Input name="category" label="Статья" help="Например: кухонное оборудование" />
        <Input name="amount" label="Сумма, ₽" help="Сумма CAPEX" type="number" step={10000} />
        <Input name="usefulLifeMonths" label="Амортизация, мес" help="Например: 36" type="number" step={1} />
        <Input name="supplierComment" label="Комментарий" help="Поставщик или комментарий" />
        <label>Обязательно<select name="required" defaultValue="true"><option value="true">Да</option><option value="false">Нет</option></select></label>
        <label>До открытия<select name="paidBeforeOpening" defaultValue="true"><option value="true">Да</option><option value="false">Нет</option></select></label>
        <button className="primary" type="submit">Добавить CAPEX</button>
      </form>
      <div className="tableScroll">
        <table className="editableTable capexTable">
          <thead>
            <tr>
              <th>Статья</th>
              <th>Сумма, ₽</th>
              <th>Амортизация, мес</th>
              <th>Комментарий</th>
              <th>Обязательно</th>
              <th>До открытия</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              return (
                <tr key={row.id}>
                  <td><input name="category" defaultValue={capexCategory(row.category)} title={capexCategory(row.category)} aria-label="Статья" /></td>
                  <td><input name="amount" defaultValue={row.amount} type="number" min="0" step="10000" aria-label="Сумма" /></td>
                  <td><input name="usefulLifeMonths" defaultValue={row.usefulLifeMonths ?? ""} type="number" min="1" step="1" aria-label="Амортизация" /></td>
                  <td><input name="supplierComment" defaultValue={capexComment(row.supplierComment)} title={capexComment(row.supplierComment)} aria-label="Комментарий" /></td>
                  <td><select name="required" defaultValue={String(row.required)}><option value="true">Да</option><option value="false">Нет</option></select></td>
                  <td><select name="paidBeforeOpening" defaultValue={String(row.paidBeforeOpening)}><option value="true">Да</option><option value="false">Нет</option></select></td>
                  <td className="actionsCell">
                    <div className="rowActions compactActions">
                      <button type="button" onClick={(event) => update(row.id, event.currentTarget.closest("tr"))}>Сохранить</button>
                      <button type="button" className="danger" onClick={() => remove(row.id)}><Trash2 size={15} /> Удалить</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7}>Заполните CAPEX, чтобы рассчитать инвестиции на открытие, Payback и ROI.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OpexSection({ rows: initialRows }: { rows: RowMap[] }) {
  const [rows, setRows] = useState<RowMap[]>(initialRows);
  const fixedCosts = useMemo(() => rows.filter((row) => row.behavior === "FIXED").reduce((sum, row) => sum + Number(row.amount || 0), 0), [rows]);

  async function remove(id: string) {
    if (!confirm("Удалить статью OPEX?")) return;
    const res = await fetch(`/api/opex/${id}`, { method: "DELETE" });
    if (res.ok) setRows((current) => current.filter((row) => row.id !== id));
  }

  async function update(id: string, rowElement: HTMLTableRowElement | null) {
    if (!rowElement) return;
    const payload = collectRowPayload(rowElement);
    const res = await fetch(`/api/opex/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const body = await res.json();
      setRows((current) => current.map((row) => (row.id === id ? body.item : row)));
    }
  }

  return (
    <section className="band" id="opex">
      <div className="sectionHead">
        <div>
          <h2>OPEX</h2>
          <span>Ежемесячные расходы точки и переменные драйверы</span>
        </div>
        <strong className="sectionKpi">Постоянные расходы: {rub(fixedCosts)}</strong>
      </div>
      <form className="gridForm compactForm" method="post" action="/api/opex">
        <Input name="category" label="Статья" help="Например: аренда, ФОТ, коммунальные" />
        <Input name="amount" label="Сумма или ставка" help="₽ / мес, ₽ / заказ, ₽ / SKU или %" type="number" step={1000} />
        <label>Тип<select name="behavior" defaultValue="FIXED"><option value="FIXED">Постоянный</option><option value="VARIABLE">Переменный</option></select></label>
        <label>Драйвер<select name="driver" defaultValue="FIXED"><option value="FIXED">Фиксированный</option><option value="LINKED_TO_REVENUE">От выручки</option><option value="LINKED_TO_ORDERS">От заказов</option><option value="LINKED_TO_ITEMS">От SKU</option></select></label>
        <label className="wide">Комментарий<input name="comment" placeholder="Комментарий" /></label>
        <button className="primary" type="submit">Добавить OPEX</button>
      </form>
      <div className="tableScroll">
        <table className="editableTable opexTable">
          <thead><tr><th>Статья</th><th>Сумма/ставка</th><th>Тип</th><th>Драйвер</th><th>Комментарий</th><th>Действия</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              return (
                <tr key={row.id}>
                  <td><input name="category" defaultValue={opexCategory(row.category)} title={opexCategory(row.category)} aria-label="Статья" /></td>
                  <td><input name="amount" defaultValue={row.amount} type="number" min="0" step={row.driver === "LINKED_TO_REVENUE" ? "1" : "1000"} aria-label="Сумма" /></td>
                  <td><select name="behavior" defaultValue={row.behavior}><option value="FIXED">Постоянный</option><option value="VARIABLE">Переменный</option></select></td>
                  <td><select name="driver" defaultValue={row.driver}><option value="FIXED">Фиксированный</option><option value="LINKED_TO_REVENUE">От выручки</option><option value="LINKED_TO_ORDERS">От заказов</option><option value="LINKED_TO_ITEMS">От SKU</option></select></td>
                  <td><input name="comment" defaultValue={opexComment(row.comment)} title={opexComment(row.comment)} aria-label="Комментарий" /></td>
                  <td className="actionsCell">
                    <div className="rowActions compactActions">
                      <button type="button" onClick={(event) => update(row.id, event.currentTarget.closest("tr"))}>Сохранить</button>
                      <button type="button" className="danger" onClick={() => remove(row.id)}><Trash2 size={15} /> Удалить</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={6}>Заполните OPEX, чтобы увидеть EBITDA, операционный cashflow и Break-even.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SensitivitySection({ rows }: { rows: RowMap[] }) {
  return (
    <section className="band" id="sensitivity">
      <div className="sectionHead">
        <div>
          <h2>Sensitivity</h2>
          <span>Показывает, как ключевые допущения влияют на EBITDA и Payback.</span>
        </div>
      </div>
      <div className="tableScroll">
        <table className="financeTable sensitivityTable">
          <thead><tr><th>Параметр</th><th>-20%</th><th>-10%</th><th>База</th><th>+10%</th><th>+20%</th><th>Влияние на EBITDA</th><th>Влияние на Payback</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.parameter}>
                <td>{row.parameter}</td>
                <td>{rub(row.values["-20%"])}</td>
                <td>{rub(row.values["-10%"])}</td>
                <td>{rub(row.values.Base)}</td>
                <td>{rub(row.values["+10%"])}</td>
                <td>{rub(row.values["+20%"])}</td>
                <td className={row.impactOnEbitda < 0 ? "negative" : "positive"}>{row.impactOnEbitda == null ? "n/a" : rub(row.impactOnEbitda)}</td>
                <td>{row.impactOnPayback == null ? "n/a" : `${row.impactOnPayback} мес.`}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8}>Заполните Store Model, CAPEX и OPEX, чтобы увидеть Sensitivity.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Input({ label, name, help, type = "text", step }: { label: string; name: string; help: string; type?: string; step?: number }) {
  return (
    <label>{label}
      <input name={name} placeholder={help} title={help} type={type} min={type === "number" ? 0 : undefined} step={step} />
    </label>
  );
}

function collectRowPayload(rowElement: HTMLTableRowElement) {
  return Object.fromEntries(
    Array.from(rowElement.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"))
      .filter((field) => field.name)
      .map((field) => [field.name, field.value])
  );
}

function capexCategory(value: string) {
  return ({
    "Kitchen equipment": "Кухонное оборудование",
    "Renovation and fit-out": "Ремонт и инженерия",
    "Furniture and counter": "Мебель и стойка",
    "Signage and menu boards": "Вывеска и меню-борды",
    "POS and IT": "POS и IT",
    "Opening stock and smallware": "Стартовый склад и мелкий инвентарь"
  } as Record<string, string>)[value] ?? value;
}

function capexComment(value?: string | null) {
  return ({
    "Demo fryers, grills, refrigeration.": "Демо: фритюрницы, гриль и холодильное оборудование.",
    "Demo interior and engineering works.": "Демо: интерьер, отделка и инженерные работы.",
    "Demo service counter and small seating area.": "Демо: стойка выдачи и небольшая посадочная зона.",
    "Demo exterior signage and menu boards.": "Демо: внешняя вывеска и меню-борды.",
    "Demo POS terminals, tablets and network.": "Демо: POS-терминалы, планшеты и сеть.",
    "Demo opening inventory and small equipment.": "Демо: стартовый склад и мелкий инвентарь."
  } as Record<string, string>)[String(value ?? "")] ?? String(value ?? "");
}

function opexCategory(value: string) {
  return ({
    "Rent / аренда": "Аренда",
    "Payroll / ФОТ": "ФОТ",
    "Utilities / коммунальные": "Коммунальные и сервисы",
    "Software / POS / IT": "Софт, POS и IT",
    "Accounting / legal": "Бухгалтерия и юр. поддержка",
    "Repairs / maintenance": "Ремонт и обслуживание",
    "Local marketing fixed": "Локальный маркетинг",
    "Other fixed OPEX": "Прочий OPEX"
  } as Record<string, string>)[value] ?? value;
}

function opexComment(value?: string | null) {
  return ({
    "Demo fixed OPEX for portfolio model.": "Демо: постоянные расходы для портфолио-модели.",
    "Demo staff payroll assumption.": "Демо: допущение по ФОТ команды.",
    "Demo utilities and kitchen services.": "Демо: коммунальные и кухонные сервисы.",
    "Demo POS, CRM and subscriptions.": "Демо: POS, CRM и подписки.",
    "Demo accounting and legal support.": "Демо: бухгалтерия и юридическая поддержка.",
    "Demo maintenance reserve.": "Демо: резерв на ремонт и обслуживание.",
    "Demo fixed local marketing budget.": "Демо: фиксированный бюджет локального маркетинга.",
    "Demo miscellaneous fixed cost.": "Демо: прочие постоянные расходы."
  } as Record<string, string>)[String(value ?? "")] ?? String(value ?? "");
}
