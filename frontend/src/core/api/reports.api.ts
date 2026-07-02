import { api } from "./client";

export interface DailyClose {
  employee: { id: string; fullName: string };
  date: string;
  serviceRevenue: number;
  serviceCommission: number;
  appointments: {
    id: string;
    scheduledAt: string;
    customer: string | null;
    services: string[];
    price: number;
    commission: number;
  }[];
  productSales: number;
  productCommission: number;
  sales: {
    id: string;
    total: number;
    commission: number;
    items: { product: string; quantity: number; lineTotal: number }[];
  }[];
  deductions: {
    total: number;
    items: {
      id: string;
      type: string;
      amount: number;
      note: string | null;
      createdAt: string;
    }[];
  };
  netEarnings: number;
}

export const reportsApi = {
  dailyClose: (employeeId: string, date: string) =>
    api.get<DailyClose>(
      `/reports/daily-close?employeeId=${employeeId}&date=${date}`,
    ),
};
