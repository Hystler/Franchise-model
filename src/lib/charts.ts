export function truncateSkuName(name: string, max = 22) {
  return name.length <= max ? name : `${name.slice(0, Math.max(0, max - 1))}…`;
}

export const CHART_COLORS = {
  blue: "#5F8FCF",
  blueSoft: "#8EC5FF",
  steel: "#9BA4B2",
  silver: "#D7DCE3",
  olive: "#76C893",
  warning: "#E0B15E",
  red: "#E06A5F",
  redDark: "#7A2D26",
  graphite: "#252B36",
  surface: "#12161C",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(245,247,250,0.45)",
  text: "#F5F7FA",
  muted: "#AAB2C0"
};

export const CHART_SERIES = [
  CHART_COLORS.blueSoft,
  CHART_COLORS.steel,
  CHART_COLORS.olive,
  CHART_COLORS.warning,
  CHART_COLORS.silver,
  CHART_COLORS.blue,
  CHART_COLORS.graphite,
  CHART_COLORS.red
];

export const chartGridProps = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: "3 6",
  vertical: false
};

export const chartAxisProps = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.muted, fontSize: 12 }
};

export const chartTooltipProps = {
  contentStyle: {
    background: CHART_COLORS.surface,
    border: "1px solid rgba(156,203,255,0.25)",
    borderRadius: 14,
    color: CHART_COLORS.text,
    boxShadow: "0 24px 70px rgba(0,0,0,0.48)"
  },
  labelStyle: { color: CHART_COLORS.blueSoft },
  itemStyle: { color: CHART_COLORS.text }
};

export function buildSkuMarginRanking<T extends { name: string; ingredientCost: number; packagingCost: number; contributionMargin: number }>(economics: T[]) {
  return economics
    .filter((sku) => sku.ingredientCost > 0 || sku.packagingCost > 0)
    .sort((a, b) => b.contributionMargin - a.contributionMargin)
    .slice(0, 10)
    .map((sku) => ({ ...sku, shortName: truncateSkuName(sku.name, 22), fullName: sku.name }));
}
