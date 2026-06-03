export type ForecastInputs = {
  months: number;
  startOrdersPerDay: number;
  avgCheck: number;
  workingDays: number;
  ordersGrowth: number;
  checkGrowth: number;
  seasonality: boolean;
};

export type ForecastRow = {
  month: number;
  ordersPerDay: number;
  avgCheck: number;
  revenue: number;
  comment: string;
};

export function buildForecast(input: ForecastInputs): ForecastRow[] {
  return Array.from({ length: input.months }, (_, index) => {
    const month = index + 1;
    const seasonalFactor = input.seasonality ? 1 + 0.08 * Math.sin(((month - 2) / 12) * Math.PI * 2) : 1;
    const ordersPerDay = input.startOrdersPerDay * Math.pow(1 + input.ordersGrowth / 100, index) * seasonalFactor;
    const avgCheck = input.avgCheck * Math.pow(1 + input.checkGrowth / 100, index);
    const revenue = ordersPerDay * avgCheck * input.workingDays;
    return {
      month,
      ordersPerDay,
      avgCheck,
      revenue,
      comment: input.seasonality ? "С учётом сезонности" : "Линейный сценарий"
    };
  });
}
