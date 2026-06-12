import {
  SaleRepository,
  type SaleFilters,
  type SaleItemData,
} from "../repositories/sale.repository.ts";
import { ProductRepository } from "../repositories/product.repository.ts";
import { CustomerService } from "./customer.service.ts";
import { EmployeeService } from "./employee.service.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/HttpException.ts";
import type { CreateSaleInput } from "../validators/sale.validators.ts";

/** Round a monetary amount to 2 decimals to avoid float noise in stored values. */
const money = (n: number) => Math.round(n * 100) / 100;

export const SaleService = {
  list: (filters?: SaleFilters) => SaleRepository.all(filters),
  listByEmployee: (employeeId: string, filters?: SaleFilters) =>
    SaleRepository.byEmployee(employeeId, filters),

  async getById(id: string) {
    const sale = await SaleRepository.byId(id);
    if (!sale) throw new NotFoundException("Sale not found");
    return sale;
  },

  /**
   * Registers a product sale.
   * @param opts.sellerEmployeeId set by the employee portal to force the seller
   *   (ignores any employeeId in the body). When omitted, the admin's
   *   `input.employeeId` is used (null = sale without commission to anyone).
   */
  async create(input: CreateSaleInput, opts: { sellerEmployeeId?: string } = {}) {
    const effectiveEmployeeId =
      opts.sellerEmployeeId ?? input.employeeId ?? null;

    if (effectiveEmployeeId) {
      // Ensures the seller exists (throws NotFound otherwise).
      await EmployeeService.getById(effectiveEmployeeId);
    }

    const products = await ProductRepository.byIds(
      input.items.map((i) => i.productId),
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    let commissionTotal = 0;
    const items: SaleItemData[] = input.items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) throw new NotFoundException("Producto no encontrado");
      if (product.stock < it.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        );
      }

      const unitPrice = Number(product.price);
      const commissionPct = effectiveEmployeeId ? Number(product.commission) : 0;
      const lineTotal = money(unitPrice * it.quantity);
      const commissionAmount = money((lineTotal * commissionPct) / 100);

      total += lineTotal;
      commissionTotal += commissionAmount;

      return {
        productId: product.id,
        quantity: it.quantity,
        unitPrice: String(unitPrice),
        commissionPct: String(commissionPct),
        lineTotal: String(lineTotal),
        commissionAmount: String(commissionAmount),
      };
    });

    let customerId: string | null = null;
    if (input.customer) {
      const customer = await CustomerService.upsert(input.customer);
      customerId = customer.id;
    }

    return SaleRepository.create({
      customerId,
      employeeId: effectiveEmployeeId,
      total: String(money(total)),
      commissionTotal: String(money(commissionTotal)),
      items,
    });
  },

  async void(id: string) {
    const sale = await SaleRepository.void(id);
    if (!sale) throw new NotFoundException("Sale not found");
    return sale;
  },
};
