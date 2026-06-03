export function truncateSkuName(name: string, max = 22) {
  return name.length <= max ? name : `${name.slice(0, Math.max(0, max - 1))}…`;
}

export const CHART_COLORS = {
  gold: "#D6AE68",
  goldSoft: "#F1D08A",
  copper: "#C0783E",
  copperDark: "#9A5F32",
  olive: "#8DA66A",
  oliveDark: "#6F8F4E",
  red: "#B84A3A",
  redDark: "#7A2D26",
  beige: "#B8A98E",
  surface: "#181510",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(244,232,208,0.35)",
  text: "#F4E8D0",
  muted: "#B8A98E"
};

export const CHART_SERIES = [
  CHART_COLORS.gold,
  CHART_COLORS.copper,
  CHART_COLORS.olive,
  CHART_COLORS.red,
  CHART_COLORS.goldSoft,
  CHART_COLORS.copperDark,
  CHART_COLORS.oliveDark,
  CHART_COLORS.beige
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
    border: "1px solid rgba(214,174,104,0.35)",
    borderRadius: 14,
    color: CHART_COLORS.text,
    boxShadow: "0 24px 70px rgba(0,0,0,0.48)"
  },
  labelStyle: { color: CHART_COLORS.goldSoft },
  itemStyle: { color: CHART_COLORS.text }
};

export function buildSkuMarginRanking<T extends { name: string; ingredientCost: number; packagingCost: number; contributionMargin: number }>(economics: T[]) {
  return economics
    .filter((sku) => sku.ingredientCost > 0 || sku.packagingCost > 0)
    .sort((a, b) => b.contributionMargin - a.contributionMargin)
    .slice(0, 10)
    .map((sku) => ({ ...sku, shortName: truncateSkuName(sku.name, 22), fullName: sku.name }));
}
