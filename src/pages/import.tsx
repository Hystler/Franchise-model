import { useState } from "react";
import * as XLSX from "xlsx";
import { Shell } from "@/pages/index";

const templates = [
  { kind: "menu", label: "Меню", file: "menu_template.csv" },
  { kind: "ingredients", label: "Ингредиенты", file: "ingredients_template.csv" },
  { kind: "recipes", label: "Рецептуры", file: "recipes_template.csv" }
];

export default function ImportPage() {
  const [message, setMessage] = useState("");

  async function upload(kind: string, file?: File) {
    if (!file) return;
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
    const res = await fetch(`/api/import/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    const body = await res.json();
    setMessage(res.ok ? `Импортировано: ${body.count}` : body.error);
  }

  return (
    <Shell>
      <div className="pageHeader">
        <div>
          <h1>Импорт CSV/XLSX</h1>
          <p>Загрузите меню, ингредиенты и рецептуры. CAPEX, OPEX и налоги лучше заполнять вручную в соответствующих разделах, чтобы assumptions оставались прозрачными.</p>
        </div>
      </div>
      <section className="band">
        <div className="gridForm">
          {templates.map((item) => (
            <label key={item.kind}>{item.label}<input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => upload(item.kind, e.target.files?.[0])} /></label>
          ))}
        </div>
        {message && <p><strong>{message}</strong></p>}
      </section>
      <section className="band">
        <h2>CSV-шаблоны</h2>
        <table><tbody>{templates.map((item) => <tr key={item.file}><td>{item.label}</td><td>{item.file}</td><td><a href={`/templates/${item.file}`}>Скачать</a></td></tr>)}</tbody></table>
      </section>
    </Shell>
  );
}
