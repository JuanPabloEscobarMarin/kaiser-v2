import { prisma } from "../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import { ConflictException } from "../exceptions/HttpException.ts";

export interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  commissionPct: string;
  lineTotal: string;
  commissionAmount: string;
}

export interface CreateSaleData {
  customerId: string | null;
  employeeId: string | null;
  total: string;
  commissionTotal: string;
  items: SaleItemData[];
}

export interface SaleFilters {
  from?: Date;
  to?: Date;
  employeeId?: string;
}

const fullInclude = {
  customer: true,
  employee: { select: { id: true, fullName: true } },
  items: { include: { product: { select: { id: true, name: true } } } },
} as const;

const buildWhere = (filters: SaleFilters): Prisma.SaleWhereInput => {
  const where: Prisma.SaleWhereInput = {};
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }
  return where;
};

export const SaleRepository = {
  /** Decrements stock (guarded against overselling) and creates the sale atomically. */
  create: (data: CreateSaleData) =>
    prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        // Conditional update prevents the stock from going negative under races.
        const res = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          throw new ConflictException("Stock insuficiente para uno de los productos");
        }
      }
      return tx.sale.create({
        data: {
          customerId: data.customerId,
          employeeId: data.employeeId,
          total: data.total,
          commissionTotal: data.commissionTotal,
          items: { create: data.items },
        },
        include: fullInclude,
      });
    }),

  all: (filters: SaleFilters = {}) =>
    prisma.sale.findMany({
      where: buildWhere(filters),
      include: fullInclude,
      orderBy: { createdAt: "desc" },
    }),

  byEmployee: (employeeId: string, filters: SaleFilters = {}) =>
    prisma.sale.findMany({
      where: { ...buildWhere(filters), employeeId },
      include: fullInclude,
      orderBy: { createdAt: "desc" },
    }),

  byId: (id: string) =>
    prisma.sale.findUnique({ where: { id }, include: fullInclude }),

  /** Voids a sale: restores stock for every line, then deletes it (items cascade). */
  void: (id: string) =>
    prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) return null;
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.sale.delete({ where: { id } });
      return sale;
    }),
};
