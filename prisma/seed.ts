import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function readEnvValue(key: string) {
  if (process.env[key]) return process.env[key];

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return undefined;

  const match = fs.readFileSync(envPath, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) return undefined;

  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

const prisma = new PrismaClient({
  datasourceUrl: readEnvValue("DIRECT_URL") ?? readEnvValue("DATABASE_URL")
});

type IngredientSeed = {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  purchaseUnit: "kg" | "liter" | "piece";
  edibleYieldPercent?: number;
  storageLossPercent?: number;
};

type PackagingSeed = {
  id: string;
  name: string;
  costPerUnit: number;
  usedForCategory?: string;
};

type RecipeSeed = {
  ingredient: string;
  quantity: number;
  unit: "g" | "ml" | "piece";
  yieldLossPercent?: number;
};

type ProductSeed = {
  id: string;
  category: string;
  name: string;
  description: string;
  salePrice: number;
  recipes: RecipeSeed[];
  packaging: Array<{ id: string; units?: number }>;
};

const DEMO_NOTE =
  "Demo assumptions for a portfolio financial model. Values are illustrative, editable, and not financial advice.";

const ingredients: IngredientSeed[] = [
  { id: "demo-ingredient-white-bun", name: "Булочка белая", category: "Хлеб", purchasePrice: 26, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-black-bun", name: "Булочка черная", category: "Хлеб", purchasePrice: 32, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-beef-patty", name: "Котлета говяжья", category: "Мясо", purchasePrice: 105, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 3 },
  { id: "demo-ingredient-chicken", name: "Курица", category: "Мясо", purchasePrice: 520, purchaseUnit: "kg", edibleYieldPercent: 92, storageLossPercent: 3 },
  { id: "demo-ingredient-shawarma-beef", name: "Говядина для шаурмы", category: "Мясо", purchasePrice: 760, purchaseUnit: "kg", edibleYieldPercent: 90, storageLossPercent: 4 },
  { id: "demo-ingredient-cheese", name: "Сыр", category: "Молочные", purchasePrice: 18, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-bacon", name: "Бекон", category: "Мясо", purchasePrice: 950, purchaseUnit: "kg", edibleYieldPercent: 100, storageLossPercent: 3 },
  { id: "demo-ingredient-vegetables", name: "Овощи", category: "Овощи", purchasePrice: 180, purchaseUnit: "kg", edibleYieldPercent: 85, storageLossPercent: 5 },
  { id: "demo-ingredient-lavash", name: "Лаваш", category: "Хлеб", purchasePrice: 24, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-signature-sauce", name: "Соус фирменный", category: "Соусы", purchasePrice: 260, purchaseUnit: "liter", edibleYieldPercent: 100, storageLossPercent: 1 },
  { id: "demo-ingredient-spicy-sauce", name: "Острый соус", category: "Соусы", purchasePrice: 310, purchaseUnit: "liter", edibleYieldPercent: 100, storageLossPercent: 1 },
  { id: "demo-ingredient-potato", name: "Картофель", category: "Снэки", purchasePrice: 110, purchaseUnit: "kg", edibleYieldPercent: 88, storageLossPercent: 8 },
  { id: "demo-ingredient-oil", name: "Масло", category: "Снэки", purchasePrice: 190, purchaseUnit: "liter", edibleYieldPercent: 100, storageLossPercent: 1 },
  { id: "demo-ingredient-cheese-sticks", name: "Сырные палочки", category: "Снэки", purchasePrice: 22, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-nuggets", name: "Наггетсы", category: "Снэки", purchasePrice: 18, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-drink", name: "Напиток", category: "Напитки", purchasePrice: 45, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 1 },
  { id: "demo-ingredient-sausage", name: "Сосиска", category: "Мясо", purchasePrice: 58, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 2 },
  { id: "demo-ingredient-napkins", name: "Салфетки/расходники", category: "Расходники", purchasePrice: 3, purchaseUnit: "piece", edibleYieldPercent: 100, storageLossPercent: 0 },
  { id: "demo-ingredient-spices", name: "Соль и специи", category: "Специи", purchasePrice: 420, purchaseUnit: "kg", edibleYieldPercent: 100, storageLossPercent: 1 }
];

const packaging: PackagingSeed[] = [
  { id: "demo-packaging-burger-box", name: "Упаковка бургер", costPerUnit: 18, usedForCategory: "Бургеры" },
  { id: "demo-packaging-shawarma-wrap", name: "Упаковка шаурма", costPerUnit: 14, usedForCategory: "Шаурма" },
  { id: "demo-packaging-hotdog-sleeve", name: "Упаковка хот-дог", costPerUnit: 9, usedForCategory: "Хот-доги" },
  { id: "demo-packaging-snack-box", name: "Коробка для снэков", costPerUnit: 12, usedForCategory: "Снэки" },
  { id: "demo-packaging-cup-lid", name: "Стакан/крышка", costPerUnit: 12, usedForCategory: "Напитки" },
  { id: "demo-packaging-combo-bag", name: "Пакет комбо", costPerUnit: 22, usedForCategory: "Комбо" },
  { id: "demo-packaging-sauce-cup", name: "Контейнер для соуса", costPerUnit: 5, usedForCategory: "Дополнительно" }
];

const products: ProductSeed[] = [
  {
    id: "demo-product-classic-burger",
    category: "Бургеры",
    name: "Классический бургер",
    description: "Демо SKU: говяжья котлета, овощи и фирменный соус.",
    salePrice: 360,
    recipes: [
      { ingredient: "Булочка белая", quantity: 1, unit: "piece" },
      { ingredient: "Котлета говяжья", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 45, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 22, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-burger-box" }]
  },
  {
    id: "demo-product-cheese-burger",
    category: "Бургеры",
    name: "Сырный бургер",
    description: "Демо SKU: классический бургер с сыром.",
    salePrice: 390,
    recipes: [
      { ingredient: "Булочка белая", quantity: 1, unit: "piece" },
      { ingredient: "Котлета говяжья", quantity: 1, unit: "piece" },
      { ingredient: "Сыр", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 40, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 22, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-burger-box" }]
  },
  {
    id: "demo-product-bacon-burger",
    category: "Бургеры",
    name: "Бекон бургер",
    description: "Демо SKU с более высокой food cost для checks.",
    salePrice: 480,
    recipes: [
      { ingredient: "Булочка черная", quantity: 1, unit: "piece" },
      { ingredient: "Котлета говяжья", quantity: 1, unit: "piece" },
      { ingredient: "Бекон", quantity: 35, unit: "g" },
      { ingredient: "Сыр", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 35, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 20, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-burger-box" }]
  },
  {
    id: "demo-product-spicy-burger",
    category: "Бургеры",
    name: "Острый бургер",
    description: "Демо SKU с острым соусом и темной булочкой.",
    salePrice: 410,
    recipes: [
      { ingredient: "Булочка черная", quantity: 1, unit: "piece" },
      { ingredient: "Котлета говяжья", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 40, unit: "g" },
      { ingredient: "Острый соус", quantity: 24, unit: "ml" },
      { ingredient: "Соль и специи", quantity: 2, unit: "g" }
    ],
    packaging: [{ id: "demo-packaging-burger-box" }]
  },
  {
    id: "demo-product-chicken-shawarma",
    category: "Шаурма",
    name: "Куриная шаурма",
    description: "Демо SKU: лаваш, курица, овощи и фирменный соус.",
    salePrice: 360,
    recipes: [
      { ingredient: "Лаваш", quantity: 1, unit: "piece" },
      { ingredient: "Курица", quantity: 145, unit: "g", yieldLossPercent: 4 },
      { ingredient: "Овощи", quantity: 70, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 30, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-shawarma-wrap" }]
  },
  {
    id: "demo-product-beef-shawarma",
    category: "Шаурма",
    name: "Говяжья шаурма",
    description: "Демо SKU с говядиной для шаурмы.",
    salePrice: 450,
    recipes: [
      { ingredient: "Лаваш", quantity: 1, unit: "piece" },
      { ingredient: "Говядина для шаурмы", quantity: 145, unit: "g", yieldLossPercent: 4 },
      { ingredient: "Овощи", quantity: 65, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 28, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-shawarma-wrap" }]
  },
  {
    id: "demo-product-cheese-shawarma",
    category: "Шаурма",
    name: "Сырная шаурма",
    description: "Демо SKU: курица, сыр и овощи.",
    salePrice: 410,
    recipes: [
      { ingredient: "Лаваш", quantity: 1, unit: "piece" },
      { ingredient: "Курица", quantity: 135, unit: "g", yieldLossPercent: 4 },
      { ingredient: "Сыр", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 60, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 28, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-shawarma-wrap" }]
  },
  {
    id: "demo-product-hot-dog",
    category: "Снэки",
    name: "Хот-дог",
    description: "Демо SKU с простой рецептурой.",
    salePrice: 240,
    recipes: [
      { ingredient: "Булочка белая", quantity: 1, unit: "piece" },
      { ingredient: "Сосиска", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 25, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 15, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-hotdog-sleeve" }]
  },
  {
    id: "demo-product-fries",
    category: "Снэки",
    name: "Картофель фри",
    description: "Демо SKU с высокой маржинальностью.",
    salePrice: 180,
    recipes: [
      { ingredient: "Картофель", quantity: 170, unit: "g", yieldLossPercent: 6 },
      { ingredient: "Масло", quantity: 12, unit: "ml" },
      { ingredient: "Соль и специи", quantity: 2, unit: "g" }
    ],
    packaging: [{ id: "demo-packaging-snack-box" }]
  },
  {
    id: "demo-product-cheese-sticks",
    category: "Снэки",
    name: "Сырные палочки",
    description: "Демо snack SKU.",
    salePrice: 290,
    recipes: [
      { ingredient: "Сырные палочки", quantity: 5, unit: "piece" },
      { ingredient: "Масло", quantity: 10, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-snack-box" }]
  },
  {
    id: "demo-product-nuggets",
    category: "Снэки",
    name: "Наггетсы",
    description: "Демо snack SKU.",
    salePrice: 290,
    recipes: [
      { ingredient: "Наггетсы", quantity: 6, unit: "piece" },
      { ingredient: "Масло", quantity: 10, unit: "ml" }
    ],
    packaging: [{ id: "demo-packaging-snack-box" }]
  },
  {
    id: "demo-product-burger-combo",
    category: "Комбо",
    name: "Комбо бургер + фри + напиток",
    description: "Демо combo SKU для dashboard и export.",
    salePrice: 650,
    recipes: [
      { ingredient: "Булочка белая", quantity: 1, unit: "piece" },
      { ingredient: "Котлета говяжья", quantity: 1, unit: "piece" },
      { ingredient: "Сыр", quantity: 1, unit: "piece" },
      { ingredient: "Овощи", quantity: 45, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 22, unit: "ml" },
      { ingredient: "Картофель", quantity: 150, unit: "g", yieldLossPercent: 6 },
      { ingredient: "Масло", quantity: 10, unit: "ml" },
      { ingredient: "Напиток", quantity: 1, unit: "piece" }
    ],
    packaging: [
      { id: "demo-packaging-burger-box" },
      { id: "demo-packaging-snack-box" },
      { id: "demo-packaging-cup-lid" },
      { id: "demo-packaging-combo-bag" }
    ]
  },
  {
    id: "demo-product-shawarma-combo",
    category: "Комбо",
    name: "Комбо шаурма + фри + напиток",
    description: "Демо combo SKU для franchise preview.",
    salePrice: 620,
    recipes: [
      { ingredient: "Лаваш", quantity: 1, unit: "piece" },
      { ingredient: "Курица", quantity: 135, unit: "g", yieldLossPercent: 4 },
      { ingredient: "Овощи", quantity: 65, unit: "g" },
      { ingredient: "Соус фирменный", quantity: 30, unit: "ml" },
      { ingredient: "Картофель", quantity: 150, unit: "g", yieldLossPercent: 6 },
      { ingredient: "Масло", quantity: 10, unit: "ml" },
      { ingredient: "Напиток", quantity: 1, unit: "piece" }
    ],
    packaging: [
      { id: "demo-packaging-shawarma-wrap" },
      { id: "demo-packaging-snack-box" },
      { id: "demo-packaging-cup-lid" },
      { id: "demo-packaging-combo-bag" }
    ]
  },
  {
    id: "demo-product-drink",
    category: "Напитки",
    name: "Напиток",
    description: "Демо drink SKU.",
    salePrice: 150,
    recipes: [{ ingredient: "Напиток", quantity: 1, unit: "piece" }],
    packaging: [{ id: "demo-packaging-cup-lid" }]
  },
  {
    id: "demo-product-extra-sauce",
    category: "Дополнительно",
    name: "Соус дополнительный",
    description: "Демо add-on SKU.",
    salePrice: 90,
    recipes: [{ ingredient: "Соус фирменный", quantity: 25, unit: "ml" }],
    packaging: [{ id: "demo-packaging-sauce-cup" }]
  }
];

const opexItems = [
  { id: "demo-opex-rent", category: "Аренда", amount: 175000, behavior: "FIXED", driver: "FIXED", comment: "Демо: постоянные расходы для портфолио-модели." },
  { id: "demo-opex-payroll", category: "ФОТ", amount: 360000, behavior: "FIXED", driver: "FIXED", comment: "Демо: допущение по ФОТ команды." },
  { id: "demo-opex-utilities", category: "Коммунальные и сервисы", amount: 55000, behavior: "FIXED", driver: "FIXED", comment: "Демо: коммунальные и кухонные сервисы." },
  { id: "demo-opex-software", category: "Софт, POS и IT", amount: 28000, behavior: "FIXED", driver: "FIXED", comment: "Демо: POS, CRM и подписки." },
  { id: "demo-opex-accounting", category: "Бухгалтерия и юр. поддержка", amount: 30000, behavior: "FIXED", driver: "FIXED", comment: "Демо: бухгалтерия и юридическая поддержка." },
  { id: "demo-opex-repairs", category: "Ремонт и обслуживание", amount: 25000, behavior: "FIXED", driver: "FIXED", comment: "Демо: резерв на ремонт и обслуживание." },
  { id: "demo-opex-local-marketing", category: "Локальный маркетинг", amount: 60000, behavior: "FIXED", driver: "FIXED", comment: "Демо: фиксированный бюджет локального маркетинга." },
  { id: "demo-opex-other", category: "Прочий OPEX", amount: 45000, behavior: "FIXED", driver: "FIXED", comment: "Демо: прочие постоянные расходы." }
] as const;

const capexItems = [
  { id: "demo-capex-kitchen-equipment", category: "Кухонное оборудование", amount: 1250000, usefulLifeMonths: 60, supplierComment: "Демо: фритюрницы, гриль и холодильное оборудование.", required: true, paidBeforeOpening: true },
  { id: "demo-capex-renovation", category: "Ремонт и инженерия", amount: 680000, usefulLifeMonths: 60, supplierComment: "Демо: интерьер, отделка и инженерные работы.", required: true, paidBeforeOpening: true },
  { id: "demo-capex-furniture", category: "Мебель и стойка", amount: 320000, usefulLifeMonths: 48, supplierComment: "Демо: стойка выдачи и небольшая посадочная зона.", required: true, paidBeforeOpening: true },
  { id: "demo-capex-signage", category: "Вывеска и меню-борды", amount: 180000, usefulLifeMonths: 36, supplierComment: "Демо: внешняя вывеска и меню-борды.", required: true, paidBeforeOpening: true },
  { id: "demo-capex-pos-it", category: "POS и IT", amount: 140000, usefulLifeMonths: 36, supplierComment: "Демо: POS-терминалы, планшеты и сеть.", required: true, paidBeforeOpening: true },
  { id: "demo-capex-opening-stock", category: "Стартовый склад и мелкий инвентарь", amount: 220000, usefulLifeMonths: 12, supplierComment: "Демо: стартовый склад и мелкий инвентарь.", required: true, paidBeforeOpening: true }
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; errorCode?: string; message?: string };
  return (
    maybeError.code === "P1001" ||
    maybeError.errorCode === "P1001" ||
    String(maybeError.message ?? "").includes("Can't reach database server")
  );
}

async function seedSettings() {
  await prisma.storeInput.upsert({
    where: { id: "default-store" },
    create: {
      id: "default-store",
      location: "Demo food court point",
      formatType: "delivery",
      areaM2: 58,
      seatsCount: 18,
      workingDaysPerMonth: 30,
      workingHoursPerDay: 12,
      avgOrdersPerDay: 150,
      avgItemsPerOrder: 1.55,
      avgCheck: 520,
      deliveryShare: 70,
      aggregatorShare: 55,
      ownDeliveryShare: 15,
      pickupShare: 30,
      acquiringRate: 2.2,
      aggregatorCommissionRate: 26,
      deliveryLogisticsCostPerOrder: 65,
      marketingCostPerItem: 8,
      ownerWithdrawalsMonthly: 0,
      loanPaymentsMonthly: 0,
      workingCapitalChangeMonthly: 0,
      source: "ASSUMPTION"
    },
    update: {
      location: "Demo food court point",
      formatType: "delivery",
      areaM2: 58,
      seatsCount: 18,
      workingDaysPerMonth: 30,
      workingHoursPerDay: 12,
      avgOrdersPerDay: 150,
      avgItemsPerOrder: 1.55,
      avgCheck: 520,
      deliveryShare: 70,
      aggregatorShare: 55,
      ownDeliveryShare: 15,
      pickupShare: 30,
      acquiringRate: 2.2,
      aggregatorCommissionRate: 26,
      deliveryLogisticsCostPerOrder: 65,
      marketingCostPerItem: 8,
      ownerWithdrawalsMonthly: 0,
      loanPaymentsMonthly: 0,
      workingCapitalChangeMonthly: 0,
      source: "ASSUMPTION"
    }
  });

  await prisma.taxSettings.upsert({
    where: { id: "default-tax" },
    create: {
      id: "default-tax",
      taxSystem: "УСН revenue demo assumption",
      revenueTaxRate: 6,
      profitTaxRate: 0,
      payrollTaxRate: 0,
      vatRate: 0,
      otherTaxes: 15000,
      source: "ASSUMPTION"
    },
    update: {
      taxSystem: "УСН revenue demo assumption",
      revenueTaxRate: 6,
      profitTaxRate: 0,
      payrollTaxRate: 0,
      vatRate: 0,
      otherTaxes: 15000,
      source: "ASSUMPTION"
    }
  });

  await prisma.franchiseSettings.upsert({
    where: { id: "default-franchise" },
    create: {
      id: "default-franchise",
      lumpSumFee: 850000,
      royaltyType: "percent_of_revenue",
      royaltyRate: 5,
      fixedMonthlyRoyalty: 0,
      marketingFeeRate: 1.5,
      supplyChainMarkup: 3,
      trainingFee: 180000,
      openingSupportFee: 220000,
      monthlySupportCostPerFranchisee: 35000,
      franchisorFixedTeamCosts: 280000,
      openingInventory: 260000,
      launchMarketing: 180000,
      rentDeposit: 300000,
      contingencyAmount: 250000,
      contingencyPercent: 0,
      loanAmount: 0,
      loanPaymentsMonthly: 0,
      ownerWithdrawalsMonthly: 0,
      numberOfFranchisees: 8,
      monthlyFixedFees: 15000,
      franchiseWorkingDaysPerMonth: 30,
      franchiseAvgOrdersPerDay: 145,
      franchiseAvgItemsPerOrder: 1.55,
      franchiseAvgCheck: 530,
      franchiseDeliverySharePercent: 68,
      franchiseAggregatorSharePercent: 52,
      franchiseAcquiringRatePercent: 2.2,
      franchiseAggregatorCommissionPercent: 26,
      franchiseLogisticsPerOrder: 65,
      franchiseMarketingPerSku: 8,
      franchiseRevenueTaxRatePercent: 6,
      franchiseProfitTaxRatePercent: 0,
      franchiseVatRatePercent: 0,
      franchiseOtherTaxesPerMonth: 15000,
      franchiseLoanPaymentsPerMonth: 0,
      franchiseOwnerWithdrawalsPerMonth: 0,
      franchiseRent: 185000,
      franchisePayroll: 380000,
      franchiseUtilities: 60000,
      franchiseSoftware: 28000,
      franchiseAccounting: 30000,
      franchiseRepairs: 25000,
      franchiseOtherFixedOpex: 55000,
      forecastMonths: 24,
      revenueTrendType: "ramp_up",
      monthlyGrowthRatePercent: 0,
      monthlyDeclineRatePercent: 0,
      rampUpMonths: 5,
      rampUpStartPercent: 70,
      seasonalityEnabled: true,
      franchiseInputsCopiedFromStore: false,
      source: "ASSUMPTION"
    },
    update: {
      lumpSumFee: 850000,
      royaltyType: "percent_of_revenue",
      royaltyRate: 5,
      fixedMonthlyRoyalty: 0,
      marketingFeeRate: 1.5,
      supplyChainMarkup: 3,
      trainingFee: 180000,
      openingSupportFee: 220000,
      monthlySupportCostPerFranchisee: 35000,
      franchisorFixedTeamCosts: 280000,
      openingInventory: 260000,
      launchMarketing: 180000,
      rentDeposit: 300000,
      contingencyAmount: 250000,
      contingencyPercent: 0,
      loanAmount: 0,
      loanPaymentsMonthly: 0,
      ownerWithdrawalsMonthly: 0,
      numberOfFranchisees: 8,
      monthlyFixedFees: 15000,
      franchiseWorkingDaysPerMonth: 30,
      franchiseAvgOrdersPerDay: 145,
      franchiseAvgItemsPerOrder: 1.55,
      franchiseAvgCheck: 530,
      franchiseDeliverySharePercent: 68,
      franchiseAggregatorSharePercent: 52,
      franchiseAcquiringRatePercent: 2.2,
      franchiseAggregatorCommissionPercent: 26,
      franchiseLogisticsPerOrder: 65,
      franchiseMarketingPerSku: 8,
      franchiseRevenueTaxRatePercent: 6,
      franchiseProfitTaxRatePercent: 0,
      franchiseVatRatePercent: 0,
      franchiseOtherTaxesPerMonth: 15000,
      franchiseLoanPaymentsPerMonth: 0,
      franchiseOwnerWithdrawalsPerMonth: 0,
      franchiseRent: 185000,
      franchisePayroll: 380000,
      franchiseUtilities: 60000,
      franchiseSoftware: 28000,
      franchiseAccounting: 30000,
      franchiseRepairs: 25000,
      franchiseOtherFixedOpex: 55000,
      forecastMonths: 24,
      revenueTrendType: "ramp_up",
      monthlyGrowthRatePercent: 0,
      monthlyDeclineRatePercent: 0,
      rampUpMonths: 5,
      rampUpStartPercent: 70,
      seasonalityEnabled: true,
      franchiseInputsCopiedFromStore: false,
      source: "ASSUMPTION"
    }
  });

  await prisma.assumption.upsert({
    where: { id: "demo-portfolio-disclaimer" },
    create: {
      id: "demo-portfolio-disclaimer",
      entityType: "DemoDataset",
      entityId: "portfolio-demo",
      field: "disclaimer",
      value: "demo",
      source: "ASSUMPTION",
      note: DEMO_NOTE
    },
    update: {
      value: "demo",
      source: "ASSUMPTION",
      note: DEMO_NOTE
    }
  });
}

async function seedIngredients() {
  const ingredientByName = new Map<string, { id: string; name: string }>();

  for (const item of ingredients) {
    const ingredient = await prisma.ingredient.upsert({
      where: { name: item.name },
      create: {
        ...item,
        supplier: "Demo supplier",
        comment: DEMO_NOTE,
        source: "ASSUMPTION"
      },
      update: {
        category: item.category,
        supplier: "Demo supplier",
        purchasePrice: item.purchasePrice,
        purchaseUnit: item.purchaseUnit,
        edibleYieldPercent: item.edibleYieldPercent ?? 100,
        storageLossPercent: item.storageLossPercent ?? 0,
        comment: DEMO_NOTE,
        source: "ASSUMPTION"
      }
    });
    ingredientByName.set(ingredient.name, ingredient);
  }

  return ingredientByName;
}

async function seedPackaging() {
  const packagingById = new Map<string, { id: string; name: string; costPerUnit: number }>();

  for (const item of packaging) {
    const pack = await prisma.packaging.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        costPerUnit: item.costPerUnit,
        usedForCategory: item.usedForCategory ?? null,
        supplier: "Demo packaging supplier",
        comment: DEMO_NOTE,
        source: "ASSUMPTION"
      },
      update: {
        name: item.name,
        costPerUnit: item.costPerUnit,
        usedForCategory: item.usedForCategory ?? null,
        supplier: "Demo packaging supplier",
        comment: DEMO_NOTE,
        source: "ASSUMPTION"
      }
    });
    packagingById.set(pack.id, pack);
  }

  return packagingById;
}

async function seedProducts(
  ingredientByName: Map<string, { id: string; name: string }>,
  packagingById: Map<string, { id: string; name: string; costPerUnit: number }>
) {
  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { category_name: { category: item.category, name: item.name } },
      create: {
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
        salePrice: item.salePrice,
        imageUrl: null,
        productUrl: null,
        isActive: true,
        taxRate: null,
        deliveryAvailable: true,
        source: "ASSUMPTION",
        sourceNote: DEMO_NOTE
      },
      update: {
        description: item.description,
        salePrice: item.salePrice,
        imageUrl: null,
        productUrl: null,
        isActive: true,
        taxRate: null,
        deliveryAvailable: true,
        source: "ASSUMPTION",
        sourceNote: DEMO_NOTE
      }
    });

    for (const recipe of item.recipes) {
      const ingredient = ingredientByName.get(recipe.ingredient);
      if (!ingredient) throw new Error(`Missing demo ingredient: ${recipe.ingredient}`);

      await prisma.recipeItem.upsert({
        where: { id: `demo-recipe-${slug(item.name)}-${slug(recipe.ingredient)}` },
        create: {
          id: `demo-recipe-${slug(item.name)}-${slug(recipe.ingredient)}`,
          productId: product.id,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: recipe.quantity,
          unit: recipe.unit,
          yieldLossPercent: recipe.yieldLossPercent ?? 0,
          comment: DEMO_NOTE,
          source: "ASSUMPTION"
        },
        update: {
          productId: product.id,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: recipe.quantity,
          unit: recipe.unit,
          grossWeightGrams: null,
          netWeightGrams: null,
          yieldLossPercent: recipe.yieldLossPercent ?? 0,
          unitPurchasePrice: null,
          unitMeasure: null,
          costPerUnit: null,
          totalIngredientCost: null,
          comment: DEMO_NOTE,
          source: "ASSUMPTION"
        }
      });
    }

    for (const link of item.packaging) {
      const pack = packagingById.get(link.id);
      if (!pack) throw new Error(`Missing demo packaging: ${link.id}`);

      await prisma.productPackaging.upsert({
        where: { id: `demo-packaging-link-${slug(item.name)}-${slug(pack.name)}` },
        create: {
          id: `demo-packaging-link-${slug(item.name)}-${slug(pack.name)}`,
          productId: product.id,
          packagingId: pack.id,
          units: link.units ?? 1,
          comment: DEMO_NOTE
        },
        update: {
          productId: product.id,
          packagingId: pack.id,
          units: link.units ?? 1,
          comment: DEMO_NOTE
        }
      });
    }
  }
}

async function seedOpex() {
  for (const item of opexItems) {
    await prisma.opexItem.upsert({
      where: { id: item.id },
      create: { ...item, source: "ASSUMPTION" },
      update: {
        category: item.category,
        amount: item.amount,
        behavior: item.behavior,
        driver: item.driver,
        comment: item.comment,
        source: "ASSUMPTION"
      }
    });
  }
}

async function seedCapex() {
  for (const item of capexItems) {
    await prisma.capexItem.upsert({
      where: { id: item.id },
      create: { ...item, source: "ASSUMPTION" },
      update: {
        category: item.category,
        amount: item.amount,
        usefulLifeMonths: item.usefulLifeMonths,
        supplierComment: item.supplierComment,
        required: item.required,
        paidBeforeOpening: item.paidBeforeOpening,
        source: "ASSUMPTION"
      }
    });
  }
}

async function countDemoRows() {
  return {
    productCount: await prisma.product.count({ where: { sourceNote: DEMO_NOTE } }),
    ingredientCount: await prisma.ingredient.count({ where: { comment: DEMO_NOTE } }),
    packagingCount: await prisma.packaging.count({ where: { comment: DEMO_NOTE } }),
    recipeCount: await prisma.recipeItem.count({ where: { comment: DEMO_NOTE } }),
    packagingLinkCount: await prisma.productPackaging.count({ where: { comment: DEMO_NOTE } }),
    opexCount: await prisma.opexItem.count({ where: { id: { startsWith: "demo-opex-" } } }),
    capexCount: await prisma.capexItem.count({ where: { id: { startsWith: "demo-capex-" } } })
  };
}

async function main() {
  await seedSettings();
  const ingredientByName = await seedIngredients();
  const packagingById = await seedPackaging();
  await seedProducts(ingredientByName, packagingById);
  await seedOpex();
  await seedCapex();

  const counts = await countDemoRows();
  console.log(
    `Demo seed complete: ${counts.productCount} SKU, ${counts.ingredientCount} ingredients, ` +
    `${counts.packagingCount} packaging items, ${counts.recipeCount} recipe rows, ` +
    `${counts.packagingLinkCount} packaging links, ${counts.opexCount} OPEX, ${counts.capexCount} CAPEX.`
  );
  console.log("Demo data is illustrative, editable, and not financial advice.");
}

async function runWithRetry() {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await main();
      return;
    } catch (error) {
      if (!isTransientConnectionError(error) || attempt === maxAttempts) {
        throw error;
      }

      console.warn(`Transient database connection error during demo seed. Retrying ${attempt + 1}/${maxAttempts}...`);
      await prisma.$disconnect().catch(() => undefined);
      await sleep(1500 * attempt);
    }
  }
}

runWithRetry()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
