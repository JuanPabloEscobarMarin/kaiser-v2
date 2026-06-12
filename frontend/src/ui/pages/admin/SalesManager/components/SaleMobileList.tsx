import type { ChangeEvent } from "react";
import type { Sale } from "@/core/api/sales.api";
import { formatCurrency, formatDateTime, sellerLabel } from "../utils";

interface Props {
  sales: Sale[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (sale: Sale) => void;
}

export function SaleMobileList({
  sales,
  selectedIds,
  isChecked,
  onViewDetails,
}: Props) {
  if (sales.length === 0) {
    return (
      <p className="md:hidden text-center opacity-60 py-6">
        Sin ventas registradas
      </p>
    );
  }

  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {sales.map((sale) => {
        const itemCount = sale.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={sale.id}>
            <div
              className="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md"
              onClick={() => onViewDetails(sale)}
            >
              <div className="card-body p-4 gap-2">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedIds.includes(sale.id)}
                    aria-label="Seleccionar venta"
                    onChange={(e) => isChecked(sale.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-bold">{formatCurrency(sale.total)}</span>
                </div>
                <div className="text-sm opacity-80">
                  {formatDateTime(sale.createdAt)}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>{sale.customer?.fullName ?? "Sin cliente"}</span>
                  <span>{itemCount} ítem(s)</span>
                  <span className="opacity-70">{sellerLabel(sale.employee)}</span>
                </div>
                {Number(sale.commissionTotal) > 0 && (
                  <div className="text-sm text-success">
                    Comisión: {formatCurrency(sale.commissionTotal)}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
