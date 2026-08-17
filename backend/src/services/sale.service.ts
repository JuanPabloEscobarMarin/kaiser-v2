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
    // Validación: Verificar que el ID de la venta no sea nulo, vacío ni contenga solo espacios.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la venta es obligatorio");
    }
    const sale = await SaleRepository.byId(id);
    if (!sale) throw new NotFoundException("Venta no encontrada");
    return sale;
  },

  /**
   * Registers a product sale.
   * @param opts.sellerEmployeeId set by the employee portal to force the seller
   *   (ignores any employeeId in the body). When omitted, the admin's
   *   `input.employeeId` is used (null = sale without commission to anyone).
   */
  async create(input: CreateSaleInput, opts: { sellerEmployeeId?: string } = {}) {
    // Validación: La venta debe contener al menos un producto en el listado de items.
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException("La venta debe incluir al menos un producto");
    }
    // Validación: Verificar que cada item tenga un ID válido y una cantidad entera estrictamente positiva (> 0).
    for (const item of input.items) {
      if (!item.productId || item.productId.trim().length === 0) {
        throw new BadRequestException("Cada item debe incluir un ID de producto válido");
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new BadRequestException("La cantidad de cada producto debe ser un número entero mayor a 0");
      }
    }

    // Validación: Prevenir items duplicados con el mismo productId en la misma petición para no falsear el control de stock.
    const productIds = input.items.map((i) => i.productId.trim());
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      throw new BadRequestException("No se permiten productos duplicados en la misma venta; consolida las cantidades en una sola línea");
    }

    const rawEmployeeId = opts.sellerEmployeeId ?? input.employeeId ?? null;
    const effectiveEmployeeId = rawEmployeeId ? rawEmployeeId.trim() : null;

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
      // Validación: Verificar si el producto se encuentra activo para la venta.
      if ("state" in product && !product.state) {
        throw new BadRequestException(`El producto "${product.name}" no está activo para la venta`);
      }

      if (product.stock < it.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        );
      }

      const unitPrice = Number(product.price);
      // Validación: El precio unitario del producto en catálogo debe ser mayor o igual a 0.
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(`El precio configurado para "${product.name}" no es válido`);
      }
      const commissionPct = effectiveEmployeeId ? Number(product.commission) : 0;
      const lineTotal = money(unitPrice * it.quantity);
      const commissionAmount = money((lineTotal * commissionPct) / 100);

      total += lineTotal;
      commissionTotal += commissionAmount;

      return {
        productId: product.id,
        quantity: it.quantity,
        unitPrice: String(unitPrice),
        // Costo congelado al vender: cambiar el costo del producto después
        // no altera la utilidad de ventas pasadas.
        unitCost: String(money(Number(product.saleCost))),
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
    // Validación: Verificar que el ID de la venta a anular sea válido.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la venta es obligatorio");
    }
    const sale = await SaleRepository.void(id);
    if (!sale) throw new NotFoundException("Venta no encontrada");

    // Validación: Evitar anular una venta que ya se encuentra en estado anulado.
    if ("state" in sale && (sale as { state?: string }).state === "VOIDED") {
      throw new BadRequestException("Esta venta ya ha sido anulada previamente");
    }
    const voided = await SaleRepository.void(id.trim());
    if (!voided) throw new NotFoundException("Venta no encontrada");

    return voided;
  },
};
