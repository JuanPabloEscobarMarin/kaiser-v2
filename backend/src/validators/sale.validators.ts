import { z } from "zod";
import { isoDate } from "./common.ts";
import { customerSchema } from "./customer.validators.ts";


export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "La venta debe tener al menos un producto"),
  // Optional walk-in customer (upserted by identification, like bookings).
  customer: customerSchema.optional().nullable(),
  // Seller. Only honored for admin requests; the employee portal forces its own id.
  employeeId: z.string().uuid().optional().nullable(),
});

export const listSalesQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  employeeId: z.string().uuid().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQueryInput = z.infer<typeof listSalesQuerySchema>;
