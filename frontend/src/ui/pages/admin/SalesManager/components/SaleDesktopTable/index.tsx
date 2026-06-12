import type { ChangeEvent } from "react";
import type { Sale } from "@/core/api/sales.api";
import { formatCurrency, formatDateTime, sellerLabel } from "../../utils";

interface Props {
  data: Sale[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (sale: Sale) => void;
}

export function SaleDesktopTable({
  data,
  selectedIds,
  isChecked,
  onViewDetails,
}: Readonly<Props>) {
  return (
    <div className="hidden md:block overflow-x-auto bg-base-100 rounded-box shadow">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th></th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Ítems</th>
            <th>Total</th>
            <th>Comisión</th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.map((sale) => {
            const itemCount = sale.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <tr
                key={sale.id}
                className="cursor-pointer hover:bg-base-200"
                onClick={() => onViewDetails(sale)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.includes(sale.id)}
                    onChange={(e) => isChecked(sale.id, e)}
                    aria-label="Seleccionar venta"
                  />
                </td>
                <td className="whitespace-nowrap">{formatDateTime(sale.createdAt)}</td>
                <td>{sale.customer?.fullName ?? "—"}</td>
                <td>{sellerLabel(sale.employee)}</td>
                <td>{itemCount}</td>
                <td className="font-semibold">{formatCurrency(sale.total)}</td>
                <td>
                  {Number(sale.commissionTotal) > 0 ? (
                    <span className="text-success font-medium">
                      {formatCurrency(sale.commissionTotal)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center opacity-60 py-6">
                Sin ventas registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
