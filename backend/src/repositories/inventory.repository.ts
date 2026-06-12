import { prisma } from "../lib/prisma.ts";
import type { CreateCategoryInput, CreateItemInput, UpdateItemInput } from "../validators/inventory.validators.ts";

export const InventoryRepository = {
  allCategories: () =>
    prisma.inventoryCategory.findMany({ orderBy: { name: "asc" } }),

  createCategory: (data: CreateCategoryInput) =>
    prisma.inventoryCategory.create({ data }),

  deleteCategory: (id: string) =>
    prisma.inventoryCategory.delete({ where: { id } }),

  allItems: () =>
    prisma.inventoryItem.findMany({
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),

  itemById: (id: string) =>
    prisma.inventoryItem.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    }),

  createItem: (data: CreateItemInput) =>
    prisma.inventoryItem.create({
      data: data as any,
      include: { category: { select: { id: true, name: true } } },
    }),

  updateItem: (id: string, data: UpdateItemInput) =>
    prisma.inventoryItem.update({
      where: { id },
      data: data as any,
      include: { category: { select: { id: true, name: true } } },
    }),

  deleteItem: (id: string) =>
    prisma.inventoryItem.delete({ where: { id } }),
};
