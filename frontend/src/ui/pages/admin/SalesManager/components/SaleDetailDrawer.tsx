import type { Sale } from "@/core/api/sales.api";
import { formatCurrency, formatDateTime, sellerLabel } from "../utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export function SaleDetailDrawer({ isOpen, onClose, sale }: Props) {
  return (
    <div className={`drawer drawer-end ${isOpen ? "" : "pointer-events-none"}`}>
      <input type="checkbox" className="drawer-toggle" checked={isOpen} readOnly />
      <div className="drawer-side z-50">
        <label className="drawer-overlay" onClick={onClose} />
        <div className="bg-base-100 min-h-full w-full md:w-120 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-xl font-bold">Detalle de la venta</h2>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          {sale && (
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <dl className="grid grid-cols-3 gap-y-2 text-sm">
                <dt className="opacity-60">Fecha</dt>
                <dd className="col-span-2 font-medium">
                  {formatDateTime(sale.createdAt)}
                </dd>
                <dt className="opacity-60">Cliente</dt>
                <dd className="col-span-2 font-medium">
                  {sale.customer?.fullName ?? "Sin cliente"}
                </dd>
                <dt className="opacity-60">Vendedor</dt>
                <dd className="col-span-2 font-medium">
                  {sellerLabel(sale.employee)}
                </dd>
              </dl>

              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">P. unit</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((it) => (
                      <tr key={it.id}>
                        <td>{it.product?.name ?? "—"}</td>
                        <td className="text-right">{it.quantity}</td>
                        <td className="text-right">{formatCurrency(it.unitPrice)}</td>
                        <td className="text-right">{formatCurrency(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-base-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
                {Number(sale.commissionTotal) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Comisión del vendedor</span>
                    <span>{formatCurrency(sale.commissionTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
