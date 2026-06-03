import { useState } from "react";
import { Shell } from "@/components/shell";
import { loadModel } from "@/lib/model";

const filters = [
  { value: "All", label: "Все" },
  { value: "Critical", label: "Критичные" },
  { value: "Warning", label: "Предупреждения" },
  { value: "Missing data", label: "Нет данных" },
  { value: "SKU", label: "SKU" },
  { value: "Store Model", label: "Store Model" },
  { value: "CAPEX", label: "CAPEX" },
  { value: "OPEX", label: "OPEX" }
];

export async function getServerSideProps() {
  const data = await loadModel();
  return { props: { checks: data.checks } };
}

export default function ChecksPage({ checks }: any) {
  const [filter, setFilter] = useState("All");
  const visible = checks.filter((check: any) => {
    if (filter === "All") return true;
    if (filter === "Critical") return check.severity === "critical";
    if (filter === "Warning") return check.severity === "warning";
    return check.category === filter;
  });

  return (
    <Shell>
      <div className="pageHeader"><div><h1>Аудит модели</h1><p>Автоматические проверки SKU, незаполненных допущений и рискованных соотношений.</p></div></div>
      <section className="band">
        <div className="segmented wrap">
          {filters.map((item) => <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}
        </div>
        <div className="checks">
          {visible.map((check: any) => (
            <div className={`check ${check.severity}`} key={`${check.code}-${check.message}`}>
              <strong>{severityLabel(check.severity)}</strong>
              <span>{categoryLabel(check.category)}</span>
              <span>{check.code}</span>
              <span>{check.message}</span>
            </div>
          ))}
          {!visible.length && <p>Проверки в этом фильтре не нашли проблем.</p>}
        </div>
      </section>
    </Shell>
  );
}

function severityLabel(severity: string) {
  if (severity === "critical") return "критично";
  if (severity === "warning") return "предупреждение";
  return severity;
}

function categoryLabel(category?: string | null) {
  if (!category) return "Общее";
  if (category === "Missing data") return "Нет данных";
  return category;
}
